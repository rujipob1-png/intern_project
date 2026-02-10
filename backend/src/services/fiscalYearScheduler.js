/**
 * ============================================
 * Fiscal Year Leave Carryover Scheduler
 * ============================================
 * 
 * ระบบยกยอดวันลาพักผ่อนอัตโนมัติ
 * ทำงานทุกวันที่ 1 ตุลาคม ของทุกปี (เริ่มต้นปีงบประมาณใหม่)
 * 
 * หลักการทำงาน:
 * 1. ทุกวันที่ 1 ตุลาคม เวลา 00:01 น. ระบบจะ:
 *    - ยกยอดวันลาพักผ่อนที่เหลือจากปีก่อนให้ทุกคน
 *    - Reset วันลาป่วย = 60 วัน
 *    - Reset วันลากิจ = 15 วัน
 * 
 * 2. การคำนวณยกยอดวันลาพักผ่อน:
 *    - อายุราชการ < 10 ปี: สะสมได้สูงสุด 20 วัน
 *    - อายุราชการ >= 10 ปี: สะสมได้สูงสุด 30 วัน
 *    - วันลาใหม่ปีละ 10 วัน + ยกยอดจากปีก่อน (ไม่เกินเพดาน)
 * 
 * 3. ส่ง Notification แจ้งเตือนผู้ใช้หลังยกยอดเสร็จ
 * 
 * 4. เมื่อ Server restart จะตรวจสอบว่ายกยอดปีนี้ไปแล้วหรือยัง
 *    ถ้ายังไม่ได้ยกยอด จะทำการยกยอดทันที
 */

import cron from 'node-cron';
import { supabaseAdmin } from '../config/supabase.js';

// ============================================
// Utility Functions
// ============================================

/**
 * คำนวณปีงบประมาณไทย
 * ปีงบประมาณเริ่ม 1 ตุลาคม - 30 กันยายน
 * เช่น 1 ต.ค. 2567 - 30 ก.ย. 2568 = ปีงบ 2568
 */
const getCurrentFiscalYear = () => {
  const today = new Date();
  const month = today.getMonth(); // 0-11 (0 = January)
  const year = today.getFullYear() + 543; // Convert to Buddhist Era
  
  // If month >= October (9), fiscal year = current year + 1
  if (month >= 9) {
    return year + 1;
  }
  return year;
};

/**
 * คำนวณอายุราชการ (ปี)
 */
const calculateServiceYears = (hireDate) => {
  if (!hireDate) return 0;
  
  const hire = new Date(hireDate);
  const today = new Date();
  
  let years = today.getFullYear() - hire.getFullYear();
  const monthDiff = today.getMonth() - hire.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hire.getDate())) {
    years--;
  }
  
  return Math.max(0, years);
};

/**
 * คำนวณเพดานสะสมวันลาพักผ่อน
 */
const getVacationCarryoverLimit = (serviceYears) => {
  return serviceYears >= 10 ? 30 : 20;
};

// ============================================
// Core Carryover Functions
// ============================================

/**
 * ยกยอดวันลาพักผ่อนสำหรับผู้ใช้ทั้งหมด
 */
const processAllVacationCarryover = async () => {
  const currentFiscalYear = getCurrentFiscalYear();
  console.log(`\n📅 [Scheduler] เริ่มยกยอดวันลาพักผ่อน ปีงบประมาณ พ.ศ. ${currentFiscalYear}`);
  
  try {
    // ดึง users ที่ active และยังไม่ได้ยกยอดปีนี้
    const { data: users, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('is_active', true)
      .or(`last_carryover_fiscal_year.is.null,last_carryover_fiscal_year.neq.${currentFiscalYear}`);
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (users.length === 0) {
      console.log('✅ [Scheduler] ยกยอดวันลาครบทุกคนแล้วสำหรับปีงบประมาณนี้');
      return { processed: 0, failed: 0, results: [] };
    }
    
    console.log(`📊 [Scheduler] พบผู้ใช้ที่ต้องยกยอด: ${users.length} คน`);
    
    const results = [];
    const errors = [];
    
    for (const user of users) {
      try {
        const serviceYears = calculateServiceYears(user.hire_date);
        const carryoverLimit = getVacationCarryoverLimit(serviceYears);
        const previousRemaining = (user.vacation_leave_balance || 0) + (user.vacation_carryover || 0);
        const maxCarryover = Math.max(0, carryoverLimit - 10); // เพดาน - วันลาใหม่
        const newCarryover = Math.min(previousRemaining, maxCarryover);
        
        // Update user
        await supabaseAdmin
          .from('users')
          .update({
            vacation_leave_balance: 10, // วันลาใหม่ 10 วัน
            vacation_carryover: newCarryover,
            last_carryover_fiscal_year: currentFiscalYear,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        // Log การเปลี่ยนแปลง
        await supabaseAdmin.from('leave_balance_logs').insert({
          user_id: user.id,
          leave_type: 'vacation_leave',
          change_amount: newCarryover - (user.vacation_carryover || 0),
          balance_after: 10 + newCarryover,
          reason: `auto_carryover_fiscal_year_${currentFiscalYear}`
        });
        
        // สร้าง Notification แจ้งผู้ใช้
        await supabaseAdmin.from('notifications').insert({
          user_id: user.id,
          title: '📅 ยกยอดวันลาพักผ่อนประจำปี',
          message: `วันลาพักผ่อนของคุณถูกยกยอดแล้ว\n` +
                   `• วันลาจากปีก่อน: ${previousRemaining} วัน\n` +
                   `• ยกยอดได้: ${newCarryover} วัน\n` +
                   `• วันลาปีใหม่: 10 วัน\n` +
                   `• รวมทั้งหมด: ${10 + newCarryover} วัน\n` +
                   `• ปีงบประมาณ พ.ศ. ${currentFiscalYear}`,
          type: 'system',
          is_read: false
        });
        
        results.push({
          user_id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          service_years: serviceYears,
          previous_remaining: previousRemaining,
          new_carryover: newCarryover,
          total_available: 10 + newCarryover
        });
        
        console.log(`   ✓ ${user.first_name} ${user.last_name}: ${previousRemaining} → ยกยอด ${newCarryover} → รวม ${10 + newCarryover} วัน`);
        
      } catch (err) {
        console.error(`   ✗ ${user.first_name} ${user.last_name}: ${err.message}`);
        errors.push({
          user_id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          error: err.message
        });
      }
    }
    
    console.log(`\n✅ [Scheduler] ยกยอดวันลาพักผ่อนสำเร็จ: ${results.length} คน, ล้มเหลว: ${errors.length} คน`);
    
    return { processed: results.length, failed: errors.length, results, errors };
    
  } catch (error) {
    console.error('❌ [Scheduler] เกิดข้อผิดพลาดในการยกยอดวันลา:', error);
    throw error;
  }
};

/**
 * Reset วันลาป่วยและลากิจประจำปี
 */
const resetAnnualLeaveBalance = async () => {
  const currentFiscalYear = getCurrentFiscalYear();
  console.log(`\n🔄 [Scheduler] Reset วันลาป่วย/ลากิจ ปีงบประมาณ พ.ศ. ${currentFiscalYear}`);
  
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        sick_leave_balance: 60,    // ลาป่วย 60 วัน/ปี
        personal_leave_balance: 15, // ลากิจ 15 วัน/ปี
        updated_at: new Date().toISOString()
      })
      .eq('is_active', true)
      .select('id, first_name, last_name');
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ [Scheduler] Reset วันลาป่วย/ลากิจสำเร็จ: ${data.length} คน`);
    
    // สร้าง Notification แจ้งทุกคน
    const notifications = data.map(user => ({
      user_id: user.id,
      title: '🔄 Reset วันลาประจำปี',
      message: `สิทธิ์วันลาของคุณถูก Reset ประจำปีงบประมาณ พ.ศ. ${currentFiscalYear}\n` +
               `• ลาป่วย: 60 วัน\n` +
               `• ลากิจ: 15 วัน`,
      type: 'system',
      is_read: false
    }));
    
    await supabaseAdmin.from('notifications').insert(notifications);
    
    return { updated_count: data.length };
    
  } catch (error) {
    console.error('❌ [Scheduler] เกิดข้อผิดพลาดใน Reset วันลา:', error);
    throw error;
  }
};

/**
 * ตรวจสอบและยกยอดวันลาถ้าจำเป็น (เรียกตอน server start)
 */
const checkAndProcessCarryoverIfNeeded = async () => {
  const currentFiscalYear = getCurrentFiscalYear();
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-11
  
  console.log('\n🔍 [Scheduler] ตรวจสอบสถานะการยกยอดวันลา...');
  console.log(`   ปีงบประมาณปัจจุบัน: พ.ศ. ${currentFiscalYear}`);
  console.log(`   วันที่ปัจจุบัน: ${today.toLocaleDateString('th-TH')}`);
  
  // ตรวจสอบว่ามีใครยังไม่ได้ยกยอดบ้าง
  const { data: pendingUsers, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('is_active', true)
    .or(`last_carryover_fiscal_year.is.null,last_carryover_fiscal_year.neq.${currentFiscalYear}`);
  
  if (error) {
    console.error('❌ [Scheduler] ไม่สามารถตรวจสอบสถานะการยกยอดได้:', error);
    return;
  }
  
  if (pendingUsers.length === 0) {
    console.log('✅ [Scheduler] ยกยอดวันลาครบทุกคนแล้วสำหรับปีงบประมาณนี้');
    return;
  }
  
  // ถ้าเป็นช่วงหลังเริ่มปีงบใหม่ (ต.ค. - ธ.ค.) และยังมีคนไม่ได้ยกยอด
  // ให้ยกยอดเลย
  if (currentMonth >= 9 || currentMonth <= 2) { // ต.ค. - มี.ค.
    console.log(`⚠️ [Scheduler] พบผู้ใช้ที่ยังไม่ได้ยกยอด: ${pendingUsers.length} คน`);
    console.log('🚀 [Scheduler] เริ่มยกยอดอัตโนมัติ...');
    
    await processAllVacationCarryover();
    await resetAnnualLeaveBalance();
  } else {
    console.log(`ℹ️ [Scheduler] มีผู้ใช้รอยกยอด ${pendingUsers.length} คน - จะยกยอดวันที่ 1 ต.ค.`);
  }
};

// ============================================
// Cron Job Setup
// ============================================

/**
 * ตั้งเวลา Cron Job
 * Schedule: "1 0 1 10 *" = นาทีที่ 1, ชั่วโมงที่ 0, วันที่ 1, เดือน 10 (ตุลาคม)
 * = ทุกวันที่ 1 ตุลาคม เวลา 00:01 น.
 */
const startFiscalYearScheduler = () => {
  console.log('\n⏰ [Scheduler] เริ่มต้น Fiscal Year Scheduler...');
  
  // Cron expression: "minute hour day month dayOfWeek"
  // "1 0 1 10 *" = 00:01 ของวันที่ 1 ตุลาคม ทุกปี
  const cronExpression = '1 0 1 10 *';
  
  cron.schedule(cronExpression, async () => {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 [Scheduler] ถึงวันที่ 1 ตุลาคม - เริ่มต้นปีงบประมาณใหม่!');
    console.log('═══════════════════════════════════════════════════════════');
    
    try {
      // 1. ยกยอดวันลาพักผ่อน
      await processAllVacationCarryover();
      
      // 2. Reset วันลาป่วย/ลากิจ
      await resetAnnualLeaveBalance();
      
      console.log('\n✅ [Scheduler] จัดการวันลาประจำปีเสร็จสิ้น!');
      console.log('═══════════════════════════════════════════════════════════\n');
      
    } catch (error) {
      console.error('❌ [Scheduler] เกิดข้อผิดพลาด:', error);
    }
  }, {
    timezone: 'Asia/Bangkok' // ใช้เวลาประเทศไทย
  });
  
  console.log('   ⏰ Schedule: ทุกวันที่ 1 ตุลาคม เวลา 00:01 น. (Asia/Bangkok)');
  console.log('   📋 Tasks: ยกยอดวันลาพักผ่อน + Reset ลาป่วย/ลากิจ');
  console.log('✅ [Scheduler] Fiscal Year Scheduler พร้อมทำงาน\n');
};

// ============================================
// Export
// ============================================

export {
  startFiscalYearScheduler,
  checkAndProcessCarryoverIfNeeded,
  processAllVacationCarryover,
  resetAnnualLeaveBalance,
  getCurrentFiscalYear,
  calculateServiceYears,
  getVacationCarryoverLimit
};
