/**
 * ทดสอบ "ยกเลิกการลา" (Cancel Leave) — ครบ 4 ระดับจริง
 * 
 * Flow ยกเลิก:
 *   User ขอยกเลิก → pending_cancel
 *   Director (L2) อนุมัติ → cancel_level1
 *   Central Staff (L3) อนุมัติ → cancel_level2
 *   Central Head (L4) อนุมัติ → cancel_level3
 *   Admin (L5) อนุมัติ → cancelled (balance คืน)
 * 
 * Test Users:
 *   51550 ณัฐวุฒิ (GYS, user)
 *   51497 ธมนต์รัตน์ (GYS, director)
 *   51417 อานนท์ (GOK, central_office_staff)
 *   51410 คมกฤช (GOK, central_office_head)
 *   50001 วิชัย (GOK, admin)
 */

const BASE = 'http://localhost:3000/api';
const PW = '123456';
const SICK = 'd2097f05-c1d6-45b7-8330-c26587f17271';

let passed = 0, failed = 0;
const results = [];
function ok(c, n) { if(c){passed++;results.push(`  ✅ ${n}`);}else{failed++;results.push(`  ❌ ${n}`);} }

// ─── API Helpers ───
async function login(code) {
  const r = await fetch(`${BASE}/auth/login`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ employeeCode: code, password: PW })
  });
  const d = await r.json();
  if (!d.success) throw new Error(`Login ${code}: ${d.message}`);
  return { token: d.data.token, user: d.data.user };
}

async function create(token, dates, reason) {
  const r = await fetch(`${BASE}/leaves`, {
    method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
    body: JSON.stringify({ leaveTypeId: SICK, selectedDates: dates, totalDays: dates.length, reason })
  });
  const d = await r.json();
  if (!d.success) console.log(`   ⚠ create(${dates}): ${d.message}`);
  return d;
}

async function cancel(token, id, reason) {
  const r = await fetch(`${BASE}/leaves/${id}/cancel`, {
    method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
    body: JSON.stringify({ cancelReason: reason })
  });
  return { status: r.status, ...(await r.json()) };
}

async function stat(token, id) {
  const r = await fetch(`${BASE}/leaves/${id}`, { headers:{ Authorization:`Bearer ${token}` } });
  return (await r.json()).data;
}

async function bal(token) {
  const r = await fetch(`${BASE}/leaves/balance`, { headers:{ Authorization:`Bearer ${token}` } });
  return (await r.json()).data;
}

// ─── Leave Approval (4 levels) ───
async function dirApprove(t, id) {
  const r = await fetch(`${BASE}/director/leaves/${id}/approve`, {
    method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${t}`},
    body: JSON.stringify({ comment: 'อนุมัติ' })
  }); return { status: r.status, ...(await r.json()) };
}
async function dirReject(t, id, txt) {
  const r = await fetch(`${BASE}/director/leaves/${id}/reject`, {
    method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${t}`},
    body: JSON.stringify({ comment: txt, remarks: txt })
  }); return { status: r.status, ...(await r.json()) };
}
async function staffApprove(t, id) {
  const r = await fetch(`${BASE}/central-office/staff/${id}/approve`, {
    method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${t}`},
    body: JSON.stringify({ comment: 'ตรวจสอบแล้ว' })
  }); return { status: r.status, ...(await r.json()) };
}
async function headApprove(t, id) {
  const r = await fetch(`${BASE}/central-office/head/${id}/approve`, {
    method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${t}`},
    body: JSON.stringify({ comment: 'อนุมัติ' })
  }); return { status: r.status, ...(await r.json()) };
}
async function admApprove(t, id) {
  const r = await fetch(`${BASE}/admin/leaves/${id}/approve`, {
    method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${t}`},
    body: JSON.stringify({ comment: 'อนุมัติ' })
  }); return { status: r.status, ...(await r.json()) };
}

// ─── Cancel Approval (4 levels) ───
async function dirApproveCancel(t, id) {
  const r = await fetch(`${BASE}/director/cancel-requests/${id}/approve`, {
    method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${t}`},
    body: JSON.stringify({ comment: 'อนุมัติยกเลิก' })
  }); return { status: r.status, ...(await r.json()) };
}
async function dirRejectCancel(t, id, txt) {
  const r = await fetch(`${BASE}/director/cancel-requests/${id}/reject`, {
    method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${t}`},
    body: JSON.stringify({ comment: txt, remarks: txt })
  }); return { status: r.status, ...(await r.json()) };
}
async function staffApproveCancel(t, id) {
  const r = await fetch(`${BASE}/central-office/staff/cancel-requests/${id}/approve`, {
    method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${t}`},
    body: JSON.stringify({ comment: 'ตรวจสอบยกเลิกแล้ว' })
  }); return { status: r.status, ...(await r.json()) };
}
async function headApproveCancel(t, id) {
  const r = await fetch(`${BASE}/central-office/head/cancel-requests/${id}/approve`, {
    method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${t}`},
    body: JSON.stringify({ comment: 'อนุมัติยกเลิก' })
  }); return { status: r.status, ...(await r.json()) };
}
async function admApproveCancel(t, id) {
  const r = await fetch(`${BASE}/admin/cancel-requests/${id}/approve`, {
    method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${t}`},
    body: JSON.stringify({ comment: 'อนุมัติยกเลิกขั้นสุดท้าย' })
  }); return { status: r.status, ...(await r.json()) };
}

// ─── Composite: Approve leave all 4 levels ───
async function approveAll(D, S, H, A, id, U) {
  let r, s;
  r = await dirApprove(D, id);
  s = (await stat(U, id))?.status;
  console.log(`     L2 Director: ${r.status} → ${s}`);

  r = await staffApprove(S, id);
  s = (await stat(U, id))?.status;
  console.log(`     L3 Staff: ${r.status} → ${s}`);

  r = await headApprove(H, id);
  s = (await stat(U, id))?.status;
  console.log(`     L4 Head: ${r.status} → ${s}`);

  r = await admApprove(A, id);
  s = (await stat(U, id))?.status;
  console.log(`     L5 Admin: ${r.status} → ${s}`);
  return s;
}

// ─── Composite: Approve cancel all 4 levels ───
async function approveCancelAll(D, S, H, A, id, U) {
  let r, s;
  r = await dirApproveCancel(D, id);
  s = (await stat(U, id))?.status;
  console.log(`     L2 Dir cancel: ${r.status} → ${s}`);

  r = await staffApproveCancel(S, id);
  s = (await stat(U, id))?.status;
  console.log(`     L3 Staff cancel: ${r.status} → ${s}`);

  r = await headApproveCancel(H, id);
  s = (await stat(U, id))?.status;
  console.log(`     L4 Head cancel: ${r.status} → ${s}`);

  r = await admApproveCancel(A, id);
  s = (await stat(U, id))?.status;
  console.log(`     L5 Admin cancel: ${r.status} → ${s}`);
  return s;
}

// ═══════════════════════════════════════════════
async function run() {
  console.log('\n🔬 ═══════════════════════════════════════');
  console.log('   ทดสอบยกเลิกการลา — ครบ 4 ระดับจริง');
  console.log('   ═══════════════════════════════════════\n');

  const U = await login('51550');
  const D = await login('51497');
  const S = await login('51417');
  const H = await login('51410');
  const A = await login('50001');

  console.log(`   👤 User:    ${U.user.fullName} (${U.user.role_name}) [${U.user.department}]`);
  console.log(`   👤 Director: ${D.user.fullName} (${D.user.role_name}) [${D.user.department}]`);
  console.log(`   👤 Staff:   ${S.user.fullName} (${S.user.role_name}) [${S.user.department}]`);
  console.log(`   👤 Head:    ${H.user.fullName} (${H.user.role_name}) [${H.user.department}]`);
  console.log(`   👤 Admin:   ${A.user.fullName} (${A.user.role_name}) [${A.user.department}]`);
  console.log('');

  // ─── Test 1: ยกเลิก pending leave ──────────────────────
  console.log('━━━ Test 1: ยกเลิกใบลา pending ━━━');
  {
    const lv = await create(U.token, ['2027-05-03'], 'ทดสอบยกเลิก pending');
    if (!lv.data?.id) { ok(false,'สร้างใบลา'); ok(false,'skip'); ok(false,'skip'); ok(false,'skip'); }
    else {
      ok(lv.success, 'สร้างใบลา');
      ok(lv.data?.status === 'pending', `Status = pending (${lv.data?.status})`);

      const c = await cancel(U.token, lv.data.id, 'เปลี่ยนแผนแล้ว ไม่จำเป็นต้องลาครับ');
      ok(c.success, 'ยกเลิกสำเร็จ');

      const s = await stat(U.token, lv.data.id);
      ok(s?.status === 'pending_cancel', `Status = pending_cancel (${s?.status})`);
    }
  }
  console.log(results.slice(-4).join('\n') + '\n');

  // ─── Test 2: ยกเลิกซ้ำ → Error ────────────────────────
  console.log('━━━ Test 2: ยกเลิกซ้ำ → Error ━━━');
  {
    const lv = await create(U.token, ['2027-05-04'], 'ทดสอบซ้ำ');
    await cancel(U.token, lv.data.id, 'ครั้งแรก ต้องการยกเลิกเพราะเหตุจำเป็น');
    const c = await cancel(U.token, lv.data.id, 'ครั้งสอง ต้องการยกเลิกเพราะเหตุจำเป็น');
    ok(!c.success, 'ยกเลิกซ้ำ → error');
    ok(c.status === 400, `HTTP 400 (${c.status})`);
  }
  console.log(results.slice(-2).join('\n') + '\n');

  // ─── Test 3: คนอื่นยกเลิก → Error ─────────────────────
  console.log('━━━ Test 3: คนอื่นยกเลิกใบลา → Error ━━━');
  {
    const lv = await create(U.token, ['2027-05-05'], 'ทดสอบ unauthorized');
    if (!lv.data?.id) { console.log(`   ⚠ create failed: ${lv.message}`); ok(false,'สร้างใบลาสำหรับ test3'); ok(false,'skip'); }
    else {
      const c = await cancel(D.token, lv.data.id, 'ผอ.ลองยกเลิก ทดสอบว่าจะ error ไหม');
      ok(!c.success, 'คนอื่นยกเลิก → error');
      ok(c.status === 403 || c.status === 404, `HTTP 403/404 (${c.status})`);
    }
  }
  console.log(results.slice(-2).join('\n') + '\n');

  // ─── Test 4: ยกเลิกใบ rejected → Error ─────────────────
  console.log('━━━ Test 4: ยกเลิกใบลา rejected → Error ━━━');
  {
    const lv = await create(U.token, ['2027-05-06'], 'ทดสอบ reject');
    if (!lv.data?.id) { console.log(`   ⚠ create failed: ${lv.message}`); ok(false,'test4 skip'); }
    else {
      const rej = await dirReject(D.token, lv.data.id, 'ไม่อนุมัติเนื่องจากเหตุผลไม่เพียงพอ');
      console.log(`   Director reject: ${rej.status}`);
      const s = await stat(U.token, lv.data.id);
      console.log(`   Status: ${s?.status}`);
      const c = await cancel(U.token, lv.data.id, 'ลองยกเลิกใบที่ rejected แล้ว ทดสอบ validation');
      ok(!c.success, 'ยกเลิกใบ rejected → error');
      console.log(`   → ${c.message}`);
    }
  }
  console.log(results.slice(-1).join('\n') + '\n');

  // ─── Test 5: FULL FLOW ครบ 4 ระดับ → Balance คืน ──────
  console.log('━━━ Test 5: Full Flow 4 ระดับ — อนุมัติ → ยกเลิก → อนุมัติยกเลิก → Balance คืน ━━━');
  {
    const b0 = await bal(U.token);
    console.log(`   Balance ก่อน: sick = ${b0?.sick}`);

    const lv = await create(U.token, ['2027-05-10'], 'ทดสอบ full cancel 4 levels');
    ok(lv.success, 'สร้างใบลา');

    console.log('   ── Approve leave (4 levels) ──');
    const fs = await approveAll(D.token, S.token, H.token, A.token, lv.data.id, U.token);
    ok(fs === 'approved_final', `Approved final (${fs})`);

    const b1 = await bal(U.token);
    console.log(`   Balance หลังอนุมัติ: sick = ${b1?.sick}`);
    ok(b1?.sick > b0?.sick, `Balance เพิ่ม (ใช้ไปแล้ว: ${b0?.sick} → ${b1?.sick})`);

    console.log('   ── Cancel leave ──');
    const c = await cancel(U.token, lv.data.id, 'ภารกิจถูกเลื่อน ไม่ต้องลาแล้วครับ');
    ok(c.success, 'ส่งคำขอยกเลิก');
    const sc = await stat(U.token, lv.data.id);
    ok(sc?.status === 'pending_cancel', `Status = pending_cancel (${sc?.status})`);

    console.log('   ── Approve cancel (4 levels) ──');
    const cfs = await approveCancelAll(D.token, S.token, H.token, A.token, lv.data.id, U.token);
    ok(cfs === 'cancelled', `Status = cancelled (${cfs})`);

    const b2 = await bal(U.token);
    console.log(`   Balance หลังยกเลิก: sick = ${b2?.sick}`);
    ok(b2?.sick === b0?.sick, `Balance คืนกลับ (ก่อน:${b0?.sick} → หลัง:${b2?.sick})`);
  }
  console.log('');

  // ─── Test 6: Reject cancellation → approved_final ──────
  console.log('━━━ Test 6: Director Reject cancellation → ใบลากลับ approved_final ━━━');
  {
    const lv = await create(U.token, ['2027-05-11'], 'ทดสอบ reject cancel');
    console.log('   ── Approve leave ──');
    await approveAll(D.token, S.token, H.token, A.token, lv.data.id, U.token);

    await cancel(U.token, lv.data.id, 'ขอยกเลิกเพื่อทดสอบ reject cancellation flow');
    let s = await stat(U.token, lv.data.id);
    ok(s?.status === 'pending_cancel', `Status = pending_cancel (${s?.status})`);

    const rej = await dirRejectCancel(D.token, lv.data.id, 'ไม่อนุมัติยกเลิก เนื่องจากผ่านกำหนดเวลาแล้ว');
    console.log(`   Director reject cancel: ${rej.status}`);
    ok(rej.status === 200, 'Reject cancel สำเร็จ');

    s = await stat(U.token, lv.data.id);
    ok(s?.status === 'approved_final', `Status = approved_final (${s?.status})`);
  }
  console.log('');

  // ─── Test 7: ยกเลิกใบที่ cancelled แล้ว → Error ──────
  console.log('━━━ Test 7: ยกเลิกใบที่ cancelled แล้ว → Error ━━━');
  {
    const lv = await create(U.token, ['2027-05-12'], 'ทดสอบ re-cancel');
    await approveAll(D.token, S.token, H.token, A.token, lv.data.id, U.token);
    await cancel(U.token, lv.data.id, 'ขอยกเลิก เพื่อทดสอบว่า cancel ซ้ำได้ไหม');
    await approveCancelAll(D.token, S.token, H.token, A.token, lv.data.id, U.token);

    const s = await stat(U.token, lv.data.id);
    console.log(`   Status: ${s?.status}`);
    const c = await cancel(U.token, lv.data.id, 'ลองยกเลิกซ้ำครับ ทดสอบ validation');
    ok(!c.success, 'ยกเลิก cancelled → error');
    ok(c.status === 400, `HTTP 400 (${c.status})`);
  }
  console.log(results.slice(-2).join('\n') + '\n');

  // ─── Test 8: Wrong level approver → Error ─────────────
  console.log('━━━ Test 8: Approver ผิด level → Error ━━━');
  {
    const lv = await create(U.token, ['2027-05-13'], 'ทดสอบ wrong level');
    await cancel(U.token, lv.data.id, 'ขอยกเลิกครับ ทดสอบ wrong level approver');

    // Admin ลอง approve ตอน pending_cancel (ต้องเป็น Director)
    const w1 = await admApproveCancel(A.token, lv.data.id);
    ok(w1.status >= 400, `Admin approve pending_cancel → error (${w1.status})`);
    console.log(`   → Admin at pending_cancel: ${w1.status} - ${w1.message}`);

    // Staff ลอง approve ตอน pending_cancel (ต้องเป็น Director)
    const w2 = await staffApproveCancel(S.token, lv.data.id);
    ok(w2.status >= 400, `Staff approve pending_cancel → error (${w2.status})`);
    console.log(`   → Staff at pending_cancel: ${w2.status} - ${w2.message}`);

    // Head ลอง approve ตอน pending_cancel (ต้องเป็น Director)
    const w3 = await headApproveCancel(H.token, lv.data.id);
    ok(w3.status >= 400, `Head approve pending_cancel → error (${w3.status})`);
    console.log(`   → Head at pending_cancel: ${w3.status} - ${w3.message}`);
  }
  console.log(results.slice(-3).join('\n') + '\n');

  // ─── Test 9: Cancel ระหว่าง approve flow (approved_level2) ──
  console.log('━━━ Test 9: Cancel ระหว่าง approve flow (approved_level2) ━━━');
  {
    const lv = await create(U.token, ['2027-05-17'], 'ทดสอบยกเลิกระหว่าง approve');
    await dirApprove(D.token, lv.data.id);
    await staffApprove(S.token, lv.data.id);
    let s = await stat(U.token, lv.data.id);
    console.log(`   Status after L2+L3: ${s?.status}`);

    const c = await cancel(U.token, lv.data.id, 'ขอยกเลิกตอนกำลัง approve อยู่ครับ');
    ok(c.success, `Cancel ระหว่าง approve (status was: ${s?.status})`);

    s = await stat(U.token, lv.data.id);
    ok(s?.status === 'pending_cancel', `Status = pending_cancel (${s?.status})`);
  }
  console.log(results.slice(-2).join('\n') + '\n');

  // ─── Test 10: Director เห็น pending cancel requests ───
  console.log('━━━ Test 10: Director เห็น pending cancel requests ━━━');
  {
    const r = await fetch(`${BASE}/director/cancel-requests/pending`, {
      headers: { Authorization: `Bearer ${D.token}` }
    });
    const d = await r.json();
    console.log(`   Pending cancel list: ${d.data?.length} รายการ`);
    ok(d.success && d.data?.length > 0, `Director เห็น pending cancel (${d.data?.length} รายการ)`);
  }
  console.log(results.slice(-1).join('\n') + '\n');

  // ─── Test 11: Staff เห็น pending cancel requests ──────
  console.log('━━━ Test 11: Staff เห็น pending cancel requests (cancel_level1) ━━━');
  {
    // สร้างใบลาใหม่แล้วยกเลิก + Director approve cancel → cancel_level1
    const lv = await create(U.token, ['2027-05-18'], 'ทดสอบ staff pending');
    await cancel(U.token, lv.data.id, 'ขอยกเลิกครับ เพื่อทดสอบ staff pending list');
    await dirApproveCancel(D.token, lv.data.id);

    const s = await stat(U.token, lv.data.id);
    console.log(`   Status after dir approve cancel: ${s?.status}`);

    const r = await fetch(`${BASE}/central-office/staff/cancel-requests/pending`, {
      headers: { Authorization: `Bearer ${S.token}` }
    });
    const d = await r.json();
    console.log(`   Staff pending cancel list: ${d.data?.length} รายการ`);
    const found = d.data?.some(x => x.id === lv.data.id);
    ok(found, 'Staff เห็นคำขอยกเลิก cancel_level1');
  }
  console.log(results.slice(-1).join('\n') + '\n');

  // ═══════ SUMMARY ═══════════════════════════════════════
  console.log('🔬 ═══════════════════════════════════════');
  console.log('   สรุปผลทดสอบยกเลิกการลา (ครบ 4 ระดับ)');
  console.log('   ═══════════════════════════════════════');
  console.log(`   ✅ ผ่าน: ${passed}`);
  console.log(`   ❌ ไม่ผ่าน: ${failed}`);
  console.log(`   📊 รวม: ${passed + failed} tests`);
  console.log('   ─────────────────────────────────────');
  results.forEach(r => console.log(r));
  console.log('   ═══════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

run().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
