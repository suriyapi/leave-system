/**
 * ระบบวันลาบนเว็บ (Google Sheet + Apps Script Web App) — สิทธิ์ 3 ระดับ
 *   พนักงาน : ดูสิทธิ์ลาของตัวเอง ยื่นใบลา ดูประวัติ
 *   หัวหน้า  : + ดูสิทธิ์ลาของคนในแผนก + อนุมัติ/ไม่อนุมัติใบลาของแผนกตัวเอง
 *   HR      : + ทุกแผนก + Dashboard + รีเซ็ต PIN
 * สิทธิ์อยู่ที่ชีต "พนักงาน" คอลัมน์ G · ทุกฟังก์ชันตรวจรหัส + PIN + สิทธิ์ใหม่ทุกครั้ง
 * Deploy: Deploy › New deployment › Web app · Execute as: Me · Who has access: Anyone
 * ข้อมูลในไฟล์ฝึกเป็นข้อมูลสมมติ · PIN เหมาะกับการฝึกเท่านั้น
 */

const SHEET = { EMP: 'พนักงาน', LEAVE: 'บันทึกการลา', ENT: 'สิทธิ์ลา', SET: 'ตั้งค่า' };
const TYPES = ['ลาป่วย', 'ลากิจ', 'ลาพักร้อน'];
const ROLES = ['พนักงาน', 'หัวหน้า', 'HR'];
const HR_EMAIL = '';          // ใส่อีเมล HR ถ้าต้องการแจ้งเตือนเมื่อมีใบลาใหม่ (เว้นว่าง = ไม่ส่ง)
const MAX_DAYS = 30;
// คอลัมน์ชีตบันทึกการลา (เริ่ม 0): เลขที่ วันที่ยื่น วันที่ลา รหัส ประเภท จำนวนวัน เหตุผล สถานะ แผนก ผู้อนุมัติ วันที่อนุมัติ
const LV = { NO: 0, SUB: 1, DATE: 2, ID: 3, TYPE: 4, DAYS: 5, REASON: 6, STATUS: 7, DEPT: 8, BY: 9, AT: 10 };

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('ระบบวันลา')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ---------- helpers ---------- */
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sh_(name) {
  const s = ss_().getSheetByName(name);
  if (!s) throw new Error('ไม่พบชีต "' + name + '" ตรวจชื่อชีตให้ตรง');
  return s;
}
function thaiDate_(d) {
  if (!(d instanceof Date)) return String(d || '');
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'd/M/') + (d.getFullYear() + 543);
}
function num_(v) { const n = Number(v); return isNaN(n) ? 0 : n; }
function key_(v) { return String(v || '').trim().toUpperCase(); }
function setting_(a1) { return num_(sh_(SHEET.SET).getRange(a1).getValue()); }

/** ตรวจรหัส + PIN แล้วคืนข้อมูลพนักงานพร้อมสิทธิ์ */
function auth_(id, pin) {
  id = key_(id); pin = String(pin || '').trim();
  if (!/^E\d{3}$/.test(id)) throw new Error('รหัสพนักงานต้องเป็นรูปแบบ E001');
  const rows = sh_(SHEET.EMP).getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (key_(rows[i][0]) === id) {
      if (String(rows[i][5]).trim() !== pin) throw new Error('PIN ไม่ถูกต้อง');
      const role = ROLES.indexOf(String(rows[i][6]).trim()) >= 0 ? String(rows[i][6]).trim() : 'พนักงาน';
      return { id: id, name: String(rows[i][1]), dept: String(rows[i][2]), start: rows[i][3], role: role, row: i + 1 };
    }
  }
  throw new Error('ไม่พบรหัสพนักงาน ' + id);
}
function need_(me, roles) {
  if (roles.indexOf(me.role) < 0) throw new Error('สิทธิ์ของคุณ (' + me.role + ') ใช้เมนูนี้ไม่ได้');
}
/** หัวหน้าเห็นเฉพาะแผนกตัวเอง HR เห็นทุกแผนก */
function inScope_(me, dept) { return me.role === 'HR' || (me.role === 'หัวหน้า' && dept === me.dept); }

/** อ่านชีตสิทธิ์ลาทั้งหมด → { E001: {...}, ... } */
function entAll_() {
  const rows = sh_(SHEET.ENT).getDataRange().getValues();
  const sick = setting_('A5'), biz = setting_('A6');
  const out = {};
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]; const id = key_(r[0]); if (!id) continue;
    out[id] = {
      id: id, name: String(r[1]), dept: String(r[2]), tenure: num_(r[4]),
      types: [
        { type: 'ลาป่วย', quota: sick, used: num_(r[6]), left: num_(r[9]) },
        { type: 'ลากิจ', quota: biz, used: num_(r[7]), left: num_(r[10]) },
        { type: 'ลาพักร้อน', quota: num_(r[5]), used: num_(r[8]), left: num_(r[11]) }
      ],
      overDays: num_(r[12]), deduct: num_(r[13]), status: String(r[14]), pending: num_(r[15])
    };
  }
  return out;
}
function leaveRows_() { return sh_(SHEET.LEAVE).getDataRange().getValues(); }
function leaveObj_(r) {
  return { no: String(r[LV.NO]), submitted: thaiDate_(r[LV.SUB]), date: thaiDate_(r[LV.DATE]), id: key_(r[LV.ID]), type: String(r[LV.TYPE]),
           days: num_(r[LV.DAYS]), reason: String(r[LV.REASON] || ''), status: String(r[LV.STATUS]), dept: String(r[LV.DEPT]),
           by: String(r[LV.BY] || ''), at: thaiDate_(r[LV.AT]) };
}
function history_(id, rows) {
  rows = rows || leaveRows_();
  const out = [];
  for (let i = rows.length - 1; i >= 1 && out.length < 30; i--) if (key_(rows[i][LV.ID]) === id) out.push(leaveObj_(rows[i]));
  return out;
}
function pendingCount_(me, rows) {
  if (me.role === 'พนักงาน') return 0;
  let n = 0;
  for (let i = 1; i < rows.length; i++)
    if (rows[i][LV.STATUS] === 'รออนุมัติ' && inScope_(me, String(rows[i][LV.DEPT])) && key_(rows[i][LV.ID]) !== me.id) n++;
  return n;
}

/* ---------- ทุกสิทธิ์ ---------- */
function login(id, pin) {
  const me = auth_(id, pin);
  const rows = leaveRows_();
  return {
    emp: { id: me.id, name: me.name, dept: me.dept, start: thaiDate_(me.start), role: me.role },
    bal: entAll_()[me.id], hist: history_(me.id, rows), pendingCount: pendingCount_(me, rows)
  };
}

function submitLeave(form) {
  const me = auth_(form.id, form.pin);
  const type = String(form.type);
  if (TYPES.indexOf(type) < 0) throw new Error('เลือกประเภทการลา');
  const days = Number(form.days);
  if (!(days > 0) || days > MAX_DAYS || Math.round(days * 2) !== days * 2) throw new Error('จำนวนวันต้องเป็น 0.5, 1, 1.5, … ไม่เกิน ' + MAX_DAYS);
  const m = String(form.date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error('เลือกวันที่ลา');
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const reason = String(form.reason || '').slice(0, 200);

  const bal = entAll_()[me.id];
  const t = bal.types.filter(function (x) { return x.type === type; })[0];
  const pendingSame = history_(me.id).filter(function (h) { return h.status === 'รออนุมัติ' && h.type === type; })
    .reduce(function (s, h) { return s + h.days; }, 0);
  const after = t.left - pendingSame - days;
  if (after < 0 && !form.confirm) {
    return { needConfirm: true, message: type + ' คงเหลือ ' + t.left + ' วัน (รออนุมัติอยู่ ' + pendingSame + ' วัน) ใบลานี้ ' + days +
      ' วัน จะเกินสิทธิ์ ' + (-after) + ' วัน วันที่เกินอาจถูกหักเงินเดือน ยืนยันส่งใบลาหรือไม่' };
  }
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  let no;
  try {
    const sh = sh_(SHEET.LEAVE); const last = sh.getLastRow(); let n = 0;
    if (last >= 2) sh.getRange(2, 1, last - 1, 1).getValues().forEach(function (r) {
      const k = parseInt(String(r[0]).replace(/\D/g, ''), 10); if (k > n) n = k; });
    no = 'L' + ('000' + (n + 1)).slice(-4);
    sh.appendRow([no, new Date(), date, me.id, type, days, reason, 'รออนุมัติ', me.dept, '', '']);
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
  if (HR_EMAIL) {
    MailApp.sendEmail(HR_EMAIL, 'ใบลาใหม่ ' + no + ' ' + me.name, me.id + ' ' + me.name + ' (' + me.dept + ')\n' + type + ' ' + days +
      ' วัน วันที่ ' + thaiDate_(date) + '\nเหตุผล: ' + reason + '\n' + ss_().getUrl());
  }
  return { ok: true, message: 'ส่งใบลา ' + no + ' แล้ว สถานะ: รออนุมัติ', data: login(form.id, form.pin) };
}

/* ---------- หัวหน้า + HR ---------- */
/** ใบลาที่รออนุมัติในขอบเขตของฉัน (ไม่รวมของตัวเอง) */
function getPending(id, pin) {
  const me = auth_(id, pin); need_(me, ['หัวหน้า', 'HR']);
  const ent = entAll_(); const rows = leaveRows_(); const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r[LV.STATUS] !== 'รออนุมัติ' || !inScope_(me, String(r[LV.DEPT])) || key_(r[LV.ID]) === me.id) continue;
    const o = leaveObj_(r); const e = ent[o.id] || { name: o.id, types: [] };
    const t = e.types.filter(function (x) { return x.type === o.type; })[0] || { left: 0 };
    o.name = e.name; o.left = t.left; o.leftAfter = t.left - o.days;
    out.push(o);
  }
  return { list: out, role: me.role, dept: me.dept };
}

function decide(id, pin, leaveNo, decision) {
  const me = auth_(id, pin); need_(me, ['หัวหน้า', 'HR']);
  if (['อนุมัติ', 'ไม่อนุมัติ'].indexOf(decision) < 0) throw new Error('ผลการพิจารณาไม่ถูกต้อง');
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sh = sh_(SHEET.LEAVE); const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][LV.NO]) !== String(leaveNo)) continue;
      const r = rows[i];
      if (key_(r[LV.ID]) === me.id) throw new Error('อนุมัติใบลาของตัวเองไม่ได้');
      if (!inScope_(me, String(r[LV.DEPT]))) throw new Error('ใบลานี้ไม่อยู่ในแผนกของคุณ');
      if (r[LV.STATUS] !== 'รออนุมัติ') throw new Error('ใบลานี้ถูกพิจารณาแล้ว (' + r[LV.STATUS] + ')');
      sh.getRange(i + 1, LV.STATUS + 1).setValue(decision);
      sh.getRange(i + 1, LV.BY + 1, 1, 2).setValues([[me.id + ' ' + me.name, new Date()]]);
      SpreadsheetApp.flush();
      return { ok: true, message: leaveNo + ' : ' + decision + ' แล้ว' };
    }
    throw new Error('ไม่พบใบลา ' + leaveNo);
  } finally { lock.releaseLock(); }
}

/** สิทธิ์ลาคงเหลือของทีม (หัวหน้า = แผนกตัวเอง, HR = ทุกคน) */
function getTeam(id, pin) {
  const me = auth_(id, pin); need_(me, ['หัวหน้า', 'HR']);
  const ent = entAll_(); const list = [];
  Object.keys(ent).forEach(function (k) { if (inScope_(me, ent[k].dept)) list.push(ent[k]); });
  return { list: list, role: me.role, dept: me.dept };
}

/* ---------- HR ---------- */
function getDashboard(id, pin) {
  const me = auth_(id, pin); need_(me, ['HR']);
  const ent = entAll_(); const rows = leaveRows_();
  const depts = {}; let approved = 0, pending = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]; const d = String(r[LV.DEPT]);
    if (r[LV.STATUS] === 'รออนุมัติ') pending++;
    if (r[LV.STATUS] !== 'อนุมัติ') continue;
    approved += num_(r[LV.DAYS]);
    depts[d] = depts[d] || { dept: d, 'ลาป่วย': 0, 'ลากิจ': 0, 'ลาพักร้อน': 0 };
    if (TYPES.indexOf(r[LV.TYPE]) >= 0) depts[d][r[LV.TYPE]] += num_(r[LV.DAYS]);
  }
  const over = [], near = []; let deduct = 0;
  Object.keys(ent).forEach(function (k) {
    const e = ent[k]; deduct += e.deduct;
    if (e.status === 'เกินสิทธิ์') over.push({ id: e.id, name: e.name, dept: e.dept, overDays: e.overDays, deduct: e.deduct });
    if (e.status === 'ใกล้หมด') near.push({ id: e.id, name: e.name, dept: e.dept });
  });
  return { approved: approved, pending: pending, overCount: over.length, deduct: Math.round(deduct * 100) / 100,
           depts: Object.keys(depts).map(function (k) { return depts[k]; }), over: over, near: near };
}

function listEmployees(id, pin) {
  const me = auth_(id, pin); need_(me, ['HR']);
  const rows = sh_(SHEET.EMP).getDataRange().getValues(); const out = [];
  for (let i = 1; i < rows.length; i++) if (rows[i][0]) out.push({ id: key_(rows[i][0]), name: String(rows[i][1]), dept: String(rows[i][2]), role: String(rows[i][6] || 'พนักงาน') });
  return out;
}

function resetPin(id, pin, targetId, newPin) {
  const me = auth_(id, pin); need_(me, ['HR']);
  newPin = String(newPin || '').trim();
  if (!/^\d{4}$/.test(newPin)) throw new Error('PIN ต้องเป็นตัวเลข 4 หลัก');
  const sh = sh_(SHEET.EMP); const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (key_(rows[i][0]) === key_(targetId)) {
      sh.getRange(i + 1, 6).setNumberFormat('@').setValue(newPin);
      return { ok: true, message: 'ตั้ง PIN ใหม่ของ ' + key_(targetId) + ' ' + rows[i][1] + ' แล้ว แจ้งเจ้าตัวเป็นการส่วนตัว' };
    }
  }
  throw new Error('ไม่พบรหัส ' + targetId);
}

/** รันครั้งแรกจากหน้า Apps Script เพื่ออนุญาตสิทธิ์และตรวจว่าชีตครบ */
function testSystem() {
  [SHEET.EMP, SHEET.LEAVE, SHEET.ENT, SHEET.SET].forEach(sh_);
  const rows = sh_(SHEET.EMP).getDataRange().getValues();
  const roles = {}; for (let i = 1; i < rows.length; i++) roles[rows[i][6]] = (roles[rows[i][6]] || 0) + 1;
  const r = login(rows[1][0], rows[1][5]);
  Logger.log('OK: ' + r.emp.id + ' ' + r.emp.name + ' (' + r.emp.role + ') · สิทธิ์ในชีต: ' + JSON.stringify(roles));
}
