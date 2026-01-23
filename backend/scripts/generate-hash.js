import bcrypt from 'bcrypt';

/**
 * Script สำหรับสร้าง password hash
 * ใช้สำหรับ insert ข้อมูล users ใน Supabase
 */

const password = '123456';
const saltRounds = 10;

const generateHash = async () => {
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('\n========================================');
    console.log('🔐 Password Hash Generator');
    console.log('========================================');
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
    console.log('========================================\n');
    console.log('✅ Copy hash ข้างบนไปใช้ใน sample_data.sql');
    console.log('========================================\n');
  } catch (error) {
    console.error('Error generating hash:', error);
  }
};

generateHash();
