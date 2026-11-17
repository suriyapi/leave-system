# ระบบวันลาบนเว็บ (Google Sheet + Apps Script) — สิทธิ์ 3 ระดับ

ไฟล์นี้รวมทุกอย่างที่ต้องใช้ไว้ในไฟล์เดียว ใช้ติดตั้งระบบด้วย **Claude Code** หรือคัดลอกไปวางเองก็ได้

- ระบบนี้ต่อยอดจาก Mini Project วันที่ 4 ของหลักสูตร "การใช้โปรแกรม Excel และ AI สำหรับงาน HRM"
- ข้อมูลทั้งหมดเป็นข้อมูลสมมติ: พนักงาน 40 คน บันทึกการลา 220 รายการ
- PIN ในระบบนี้เหมาะกับการฝึกเท่านั้น ถ้าใช้งานจริงควรเปลี่ยนเป็น Sign in with Google

---

## 1. ภาพรวมระบบ

| ส่วน | ทำหน้าที่ |
|---|---|
| Google Sheet | ฐานข้อมูล 5 ชีต: ตั้งค่า, พนักงาน, บันทึกการลา, สิทธิ์ลา (มีสูตร), Dashboard |
| `Code.gs` | ฝั่ง Google: ตรวจรหัส PIN และสิทธิ์ อ่านสิทธิ์ลา บันทึกใบลา อนุมัติใบลา ทำ Dashboard และรีเซ็ต PIN |
| `Setup.gs` | สร้างชีต ข้อมูลสมมติ สูตร ตัวเลือก และกราฟให้อัตโนมัติ **รันครั้งเดียว** |
| `Index.html` | หน้าเว็บ มีเมนู ☰ ที่แสดงตามสิทธิ์ และรองรับมือถือ |
| `appsscript.json` | ตั้งค่าโปรเจกต์ ใช้เวลาไทย และให้เว็บทำงานในชื่อเจ้าของ เปิดได้ทุกคน |

### สิทธิ์ 3 ระดับ (ชีต พนักงาน คอลัมน์ G)

| เมนู | พนักงาน | หัวหน้า | HR |
|---|:-:|:-:|:-:|
| สิทธิ์ลาของฉัน + ประวัติ | ✓ | ✓ | ✓ |
| ยื่นใบลา (เตือนเมื่อจะเกินสิทธิ์) | ✓ | ✓ | ✓ |
| อนุมัติใบลา | – | แผนกตัวเอง | ทุกแผนก |
| สิทธิ์ลาของทีม | – | แผนกตัวเอง | ทุกคน + ตัวกรอง |
| Dashboard | – | – | ✓ |
| จัดการ PIN | – | – | ✓ |

กติกาที่ระบบใช้:
- อนุมัติใบลาของตัวเองไม่ได้ ใบลาของหัวหน้าให้ HR อนุมัติ ใบลาของ HR ให้ HR อีกคนอนุมัติ
- หัวหน้าอนุมัติข้ามแผนกไม่ได้ และอนุมัติใบเดิมซ้ำไม่ได้
- ทุกครั้งที่อนุมัติ ระบบบันทึกผู้อนุมัติและเวลาไว้ในคอลัมน์ J และ K
- ฝั่ง Google ตรวจรหัส PIN และสิทธิ์ใหม่ทุกครั้งที่มีการเรียกข้อมูล

### บัญชีทดสอบ

| รหัส | PIN | สิทธิ์ | แผนก |
|---|---|---|---|
| E001 | 7618 | HR | ฝ่ายบุคคล |
| E006 | 5070 | HR | ฝ่ายบุคคล |
| E002 | 7238 | หัวหน้า | ฝ่ายบัญชี |
| E003 | 4278 | หัวหน้า | ฝ่ายขาย (มีใบลา E008 รออนุมัติ) |
| E007 | 3183 | พนักงาน | ฝ่ายบัญชี (ลาเกินสิทธิ์) |

ค่าที่ควรได้หลังรัน Setup:
- วันลาที่อนุมัติรวม 322 วัน
- ใบลารออนุมัติ 3 รายการ
- ลาเกินสิทธิ์ 3 คน หักเงินรวม 12,966.67 บาท:

  | รหัส | วันที่ลาเกิน | หักเงิน (บาท) |
  |---|---|---|
  | E007 | 2 | 1,100 |
  | E012 | 8 | 10,266.67 |
  | E019 | 1.5 | 1,600 |

---

## 2. วิธีที่ 1: ให้ Claude Code ติดตั้งด้วย clasp (แนะนำ)

### 2.1 เตรียมเครื่อง (ทำครั้งเดียว)

1. เปิด https://script.google.com/home/usersettings แล้วเปิด **Google Apps Script API** ให้เป็น **On**
2. ติดตั้ง Node.js เวอร์ชัน 18 ขึ้นไป แล้วรัน:

```bash
npm install -g @google/clasp
clasp login        # เปิดเบราว์เซอร์ให้ล็อกอิน Google และกดอนุญาตเอง
```

### 2.2 Prompt สำหรับ Claude Code

บันทึกไฟล์นี้ไว้ในโฟลเดอร์ว่าง ตั้งชื่อว่า `leave-system.md` แล้วเปิด Claude Code ในโฟลเดอร์นั้น จากนั้นพิมพ์:

```text
อ่าน leave-system.md แล้วติดตั้งระบบวันลาให้ด้วย clasp:
1. แยกโค้ดในหัวข้อ 4 ออกเป็นไฟล์ appsscript.json, Code.gs, Setup.gs, Index.html (เนื้อหาต้องตรงทุกตัวอักษร)
2. รัน: clasp create --type sheets --title "ระบบวันลาบนเว็บ (ข้อมูลสมมติ)" --rootDir .
   (ถ้า clasp สร้าง appsscript.json ทับ ให้เขียนเนื้อหาจากหัวข้อ 4.1 กลับเข้าไป)
3. clasp push --force
4. บอกฉันให้เปิด clasp open (หรือ clasp open-script) แล้วรัน setupData กับ testSystem ใน editor เอง (ต้องกดอนุญาตสิทธิ์ครั้งแรก)
5. เมื่อฉันบอกว่ารันแล้ว ให้ clasp deploy --description "v1" แล้วบอก URL ของ Web app
6. ห้ามแก้ตรรกะสิทธิ์ใน Code.gs ถ้าไม่ได้ถาม
```

### 2.3 ถ้ามีโปรเจกต์ที่สร้างไว้แล้วใน Chrome

ถ้าจะใช้ Sheet "ระบบวันลาบนเว็บ (ข้อมูลสมมติ)" ที่ Claude สร้างไว้ในบัญชี tatomha@gmail.com ให้ใช้ `clone` แทน `create`:

```bash
clasp clone 1IRUSGN_p1X8Dyr0sDdv1tkwvFrW8UMiB9mfP2aapGumw-VGLbu4imCWf
```

- ไฟล์ `รหัส.gs` ที่ได้มาคือ Code.gs ให้ลบทิ้ง แล้วใช้ `Code.gs` จากไฟล์นี้แทน เพื่อไม่ให้มีโค้ดซ้ำ 2 ไฟล์
- จากนั้นทำต่อตั้งแต่ขั้น `clasp push --force`

### 2.4 คำสั่งที่ใช้บ่อย

| ต้องการ | คำสั่ง |
|---|---|
| ส่งโค้ดขึ้น Google | `clasp push --force` |
| เปิด editor | `clasp open-script` (clasp รุ่นเก่าใช้ `clasp open`) |
| สร้างเวอร์ชันใหม่ของ Web app | `clasp deploy --description "v2"` |
| อัปเดต deployment เดิม ให้ URL ไม่เปลี่ยน | `clasp deployments` แล้ว `clasp deploy -i <deploymentId> -d "v2"` |
| ดู log | `clasp logs` หรือดู Executions ใน editor |

---

## 3. วิธีที่ 2: วางเองในเบราว์เซอร์ (ไม่ต้องใช้ clasp)

1. เปิด https://sheets.new แล้วตั้งชื่อไฟล์
2. ไปที่ **Extensions › Apps Script**
3. วางโค้ด:
   - วาง `Code.gs` แทนโค้ดเดิม
   - กด **+ › Script** ตั้งชื่อ `Setup` แล้ววาง `Setup.gs`
   - กด **+ › HTML** ตั้งชื่อ `Index` แล้ววาง `Index.html`
   - กด Save
4. เลือกฟังก์ชัน `setupData` แล้วกด **Run** ระบบจะขออนุญาต ให้ทำตามนี้:
   1. **Review permissions** แล้วเลือกบัญชี
   2. **Advanced › Go to … (unsafe)**
   3. **Allow**
5. รัน `testSystem` แล้วดู Execution log ต้องขึ้น `OK`
6. ไปที่ **Deploy › New deployment** เลือกชนิด **Web app** แล้วตั้งค่า:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - กด Deploy แล้วคัดลอก URL
7. ทดสอบตามลำดับนี้:
   1. เข้าด้วย E007 แล้วยื่นใบลา
   2. เข้าด้วย E002 ไปที่ ☰ › อนุมัติใบลา แล้วกดอนุมัติ
   3. เข้าด้วย E007 อีกครั้ง สถานะต้องเป็น "อนุมัติ" และสิทธิ์คงเหลือต้องลดลง
   4. เข้าด้วย E001 แล้วเปิด Dashboard
8. ถ้าแก้โค้ดภายหลัง ให้ไปที่ **Deploy › Manage deployments › ✎ › Version: New version** ระบบจะใช้ URL เดิม

### ข้อควรรู้

- ถ้าเปิดลิงก์ใน LINE แล้วจอขาว ให้เติม `?openExternalBrowser=1` ท้าย URL
- วันตัดยอดในช่อง `ตั้งค่า!A4` ตั้งไว้เป็น 31/10/2569 ถ้าใช้งานจริงให้เปลี่ยนเป็น `=TODAY()`
- **พนักงานใหม่:**
  - ชีต พนักงาน: เพิ่มแถว ใส่ PIN และสิทธิ์
  - ชีต สิทธิ์ลา: ใส่รหัสในคอลัมน์ A แล้วลากสูตรจากแถวบนลงมา
- ถ้าต้องการให้แจ้งอีเมลเมื่อมีใบลาใหม่ ให้ใส่อีเมลที่ `HR_EMAIL` ใน Code.gs
- **ห้ามรัน `setupData` ซ้ำหลังเริ่มใช้งานจริง** เพราะจะล้างข้อมูลในชีตทั้งหมด
- แชร์ไฟล์ Sheet ให้เฉพาะ HR ส่วนพนักงานใช้แค่ลิงก์เว็บ

---

## 4. โค้ดทั้งหมด

### 4.1 `appsscript.json`

```json
{
  "timeZone": "Asia/Bangkok",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  }
}
```

### 4.2 `Code.gs`

```javascript
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
```

### 4.3 `Setup.gs`

```javascript
/**
 * Setup.gs — สร้างชีตและข้อมูลตัวอย่าง (ข้อมูลสมมติ) อัตโนมัติ ใช้แทนการอัปโหลดไฟล์ xlsx
 * วิธีใช้: Google Sheet เปล่า › Extensions › Apps Script › วางไฟล์นี้คู่กับ Code.gs › Run setupData ครั้งเดียว
 * ระวัง: รันซ้ำจะล้างข้อมูลในชีตเดิมทั้งหมดแล้วสร้างใหม่
 */
const EMP_DATA = [["E001","สมชาย ใจดี","ฝ่ายบุคคล","2020-07-26",19500,"7618","HR"],["E002","สุดา รักงาน","ฝ่ายบัญชี","2017-05-06",32000,"7238","หัวหน้า"],["E003","วิชัย มั่นคง","ฝ่ายขาย","2022-05-04",15000,"4278","หัวหน้า"],["E004","นภา แสงทอง","ฝ่ายไอที","2015-07-27",24500,"3929","หัวหน้า"],["E005","ประเสริฐ ทองดี","ฝ่ายผลิต","2016-09-26",22000,"4772","หัวหน้า"],["E006","อรุณี พรหมมา","ฝ่ายบุคคล","2022-11-24",24500,"5070","HR"],["E007","ธนากร ศรีสุข","ฝ่ายบัญชี","2026-02-16",16500,"3183","พนักงาน"],["E008","กมลวรรณ บุญมา","ฝ่ายขาย","2025-04-05",32000,"2418","พนักงาน"],["E009","พงศกร วงศ์ใหญ่","ฝ่ายไอที","2020-11-07",22000,"5114","พนักงาน"],["E010","ศิริพร คำแก้ว","ฝ่ายผลิต","2020-02-23",45000,"7276","พนักงาน"],["E011","อนุชา เพชรรัตน์","ฝ่ายบุคคล","2013-05-14",15500,"9696","หัวหน้า"],["E012","วันเพ็ญ สายสุวรรณ","ฝ่ายบัญชี","2020-08-21",38500,"9824","พนักงาน"],["E013","ชัยวัฒน์ นาคสุข","ฝ่ายขาย","2014-11-26",24500,"2471","พนักงาน"],["E014","รัตนา อินทร์แก้ว","ฝ่ายไอที","2025-04-01",15000,"9016","พนักงาน"],["E015","สมศักดิ์ บุญเรือง","ฝ่ายผลิต","2018-06-19",15000,"4268","พนักงาน"],["E016","ปิยะนุช แก้วมณี","ฝ่ายบุคคล","2026-03-01",15000,"7908","พนักงาน"],["E017","ณัฐพล จันทร์เพ็ญ","ฝ่ายบัญชี","2019-06-19",15000,"4550","พนักงาน"],["E018","มาลัย ทองคำ","ฝ่ายขาย","2025-07-08",15500,"7127","พนักงาน"],["E019","เอกชัย ศรีวงศ์","ฝ่ายไอที","2020-04-08",32000,"7358","พนักงาน"],["E020","จิราพร มีสุข","ฝ่ายผลิต","2017-01-09",15500,"4483","พนักงาน"],["E021","กิตติ ใจดี","ฝ่ายบุคคล","2024-05-07",38500,"3494","พนักงาน"],["E022","พรทิพย์ รักงาน","ฝ่ายบัญชี","2021-11-15",32000,"8560","พนักงาน"],["E023","ธีระ มั่นคง","ฝ่ายขาย","2026-03-09",45000,"3932","พนักงาน"],["E024","สุนิสา แสงทอง","ฝ่ายไอที","2016-06-11",16500,"6551","พนักงาน"],["E025","วีระ ทองดี","ฝ่ายผลิต","2017-02-19",38500,"2359","พนักงาน"],["E026","อัญชลี พรหมมา","ฝ่ายบุคคล","2024-05-11",15000,"9662","พนักงาน"],["E027","ภาณุ ศรีสุข","ฝ่ายบัญชี","2012-06-01",28000,"2438","พนักงาน"],["E028","ดวงใจ บุญมา","ฝ่ายขาย","2023-05-16",45000,"8684","พนักงาน"],["E029","ศุภชัย วงศ์ใหญ่","ฝ่ายไอที","2012-12-07",19500,"6183","พนักงาน"],["E030","นันทนา คำแก้ว","ฝ่ายผลิต","2016-02-24",28000,"7596","พนักงาน"],["E031","สุรเชษฐ์ เพชรรัตน์","ฝ่ายบุคคล","2012-10-19",32000,"1698","พนักงาน"],["E032","ชลธิชา สายสุวรรณ","ฝ่ายบัญชี","2022-03-13",28000,"5413","พนักงาน"],["E033","ปกรณ์ นาคสุข","ฝ่ายขาย","2023-10-27",24500,"1124","พนักงาน"],["E034","เบญจมาศ อินทร์แก้ว","ฝ่ายไอที","2014-04-09",16500,"7966","พนักงาน"],["E035","วรวุฒิ บุญเรือง","ฝ่ายผลิต","2022-02-07",15000,"4338","พนักงาน"],["E036","ลัดดา แก้วมณี","ฝ่ายบุคคล","2025-09-10",22000,"6939","พนักงาน"],["E037","อภิชาติ จันทร์เพ็ญ","ฝ่ายบัญชี","2024-06-02",16500,"9754","พนักงาน"],["E038","กนกพร ทองคำ","ฝ่ายขาย","2026-07-03",19500,"2324","พนักงาน"],["E039","ยุทธนา ศรีวงศ์","ฝ่ายไอที","2025-05-22",24500,"8570","พนักงาน"],["E040","พิมพ์ชนก มีสุข","ฝ่ายผลิต","2019-02-18",15500,"9497","พนักงาน"]];   // รหัส ชื่อ แผนก วันเริ่มงาน เงินเดือน PIN สิทธิ์
const LEAVE_DATA = [["2026-01-03","2026-01-05","E010",0,3,1],["2025-12-31","2026-01-05","E025",2,1,1],["2026-01-02","2026-01-06","E004",0,1,1],["2026-01-05","2026-01-06","E018",0,2,1],["2026-01-03","2026-01-06","E027",2,3,1],["2026-01-04","2026-01-06","E029",0,1,1],["2026-01-04","2026-01-06","E035",0,1,1],["2026-01-01","2026-01-07","E003",0,1,2],["2026-01-06","2026-01-08","E012",2,2,1],["2026-01-02","2026-01-08","E037",0,3,2],["2026-01-02","2026-01-09","E024",0,0.5,1],["2026-01-10","2026-01-14","E025",0,1,1],["2026-01-10","2026-01-15","E029",2,1,1],["2026-01-14","2026-01-16","E002",0,3,2],["2026-01-14","2026-01-19","E006",2,1,1],["2026-01-13","2026-01-19","E017",0,3,1],["2026-01-17","2026-01-19","E037",2,2,1],["2026-01-19","2026-01-20","E015",2,1,1],["2026-01-19","2026-01-20","E037",0,1,1],["2026-01-21","2026-01-22","E028",0,1,1],["2026-01-25","2026-01-27","E001",0,3,1],["2026-01-25","2026-01-29","E016",0,0.5,1],["2026-01-24","2026-01-30","E017",2,1,1],["2026-01-23","2026-01-30","E021",0,1,1],["2026-01-30","2026-02-03","E030",0,2,1],["2026-02-02","2026-02-03","E034",2,2,1],["2026-02-01","2026-02-05","E039",2,1,1],["2026-02-04","2026-02-10","E010",1,1,1],["2026-02-10","2026-02-11","E012",0,1,1],["2026-02-18","2026-02-20","E019",1,0.5,1],["2026-02-23","2026-02-26","E018",0,0.5,1],["2026-02-21","2026-02-26","E020",2,1,1],["2026-03-01","2026-03-02","E040",0,0.5,1],["2026-02-27","2026-03-03","E007",0,1,1],["2026-03-01","2026-03-04","E040",2,3,1],["2026-03-03","2026-03-05","E005",2,1,1],["2026-03-01","2026-03-06","E007",0,1,1],["2026-03-06","2026-03-10","E014",0,1,1],["2026-03-10","2026-03-12","E033",2,2,1],["2026-03-05","2026-03-12","E019",1,2,1],["2026-03-12","2026-03-13","E004",0,2,1],["2026-03-10","2026-03-16","E012",0,1,1],["2026-03-14","2026-03-16","E019",0,3,1],["2026-03-13","2026-03-17","E003",2,4,0],["2026-03-16","2026-03-19","E011",1,1,1],["2026-03-15","2026-03-20","E009",1,0.5,1],["2026-03-21","2026-03-25","E035",0,1,1],["2026-03-19","2026-03-26","E029",0,2,2],["2026-03-19","2026-03-26","E031",0,3,1],["2026-03-25","2026-03-27","E039",0,0.5,1],["2026-03-24","2026-03-27","E040",0,0.5,1],["2026-03-25","2026-03-31","E002",2,2,1],["2026-03-27","2026-03-31","E015",0,1,1],["2026-03-30","2026-03-31","E026",1,0.5,1],["2026-04-04","2026-04-06","E015",2,1,1],["2026-04-02","2026-04-08","E002",0,1,2],["2026-04-06","2026-04-13","E013",2,1,1],["2026-04-07","2026-04-13","E015",2,1,1],["2026-04-10","2026-04-15","E025",2,1,1],["2026-04-08","2026-04-15","E012",0,17,1],["2026-04-10","2026-04-16","E022",0,2,1],["2026-04-18","2026-04-20","E017",2,1,1],["2026-04-16","2026-04-21","E012",0,2,1],["2026-04-17","2026-04-21","E013",0,1,1],["2026-04-20","2026-04-21","E027",2,1,1],["2026-04-21","2026-04-22","E032",0,1,2],["2026-04-21","2026-04-22","E012",0,15,1],["2026-04-21","2026-04-23","E001",2,1,1],["2026-04-24","2026-04-27","E034",0,1,1],["2026-04-28","2026-04-30","E021",2,1,1],["2026-04-29","2026-05-01","E031",2,3,1],["2026-04-27","2026-05-01","E039",1,1,1],["2026-05-02","2026-05-04","E021",0,2,1],["2026-05-02","2026-05-04","E024",2,2,1],["2026-04-29","2026-05-04","E034",0,2,1],["2026-05-02","2026-05-05","E001",0,1,1],["2026-04-29","2026-05-06","E007",0,1,1],["2026-05-02","2026-05-06","E010",2,1,1],["2026-05-01","2026-05-08","E035",2,1,1],["2026-05-11","2026-05-13","E012",0,1,1],["2026-05-06","2026-05-13","E015",2,1,1],["2026-05-10","2026-05-13","E036",2,1,1],["2026-05-13","2026-05-14","E013",0,3,1],["2026-05-07","2026-05-14","E022",2,1,1],["2026-05-07","2026-05-14","E027",0,2,2],["2026-05-11","2026-05-14","E035",2,2,1],["2026-05-12","2026-05-14","E019",1,2,1],["2026-05-09","2026-05-15","E023",0,3,1],["2026-05-18","2026-05-19","E006",0,1,1],["2026-05-14","2026-05-19","E019",0,0.5,2],["2026-05-16","2026-05-19","E027",2,3,1],["2026-05-18","2026-05-19","E007",2,2,1],["2026-05-16","2026-05-21","E036",2,1,1],["2026-05-18","2026-05-25","E025",2,3,1],["2026-05-24","2026-05-25","E039",0,3,1],["2026-05-24","2026-05-27","E035",0,0.5,2],["2026-05-26","2026-05-28","E031",0,1,1],["2026-05-25","2026-05-29","E009",2,1,1],["2026-05-28","2026-06-01","E004",0,1,1],["2026-05-29","2026-06-01","E017",2,2,1],["2026-05-25","2026-06-01","E031",2,2,1],["2026-05-26","2026-06-02","E011",0,0.5,1],["2026-05-29","2026-06-02","E020",2,1,1],["2026-05-31","2026-06-04","E037",2,1,1],["2026-05-31","2026-06-04","E039",0,0.5,2],["2026-05-28","2026-06-04","E008",0,2,0],["2026-06-02","2026-06-05","E035",2,2,1],["2026-06-04","2026-06-09","E019",2,1,1],["2026-06-08","2026-06-09","E032",0,1,1],["2026-06-07","2026-06-09","E032",0,3,1],["2026-06-09","2026-06-10","E026",2,1,1],["2026-06-08","2026-06-11","E002",2,1,1],["2026-06-09","2026-06-15","E020",2,1,1],["2026-06-08","2026-06-15","E024",0,3,1],["2026-06-11","2026-06-15","E034",2,3,1],["2026-06-09","2026-06-16","E024",0,3,2],["2026-06-13","2026-06-17","E006",2,1,1],["2026-06-15","2026-06-17","E040",0,2,1],["2026-06-15","2026-06-18","E015",0,1,1],["2026-06-11","2026-06-18","E019",2,1,1],["2026-06-12","2026-06-18","E025",2,1,1],["2026-06-16","2026-06-18","E032",1,0.5,1],["2026-06-13","2026-06-19","E002",2,1,1],["2026-06-13","2026-06-19","E004",0,1,1],["2026-06-19","2026-06-22","E015",0,3,1],["2026-06-21","2026-06-22","E029",2,3,1],["2026-06-17","2026-06-24","E011",0,1,1],["2026-06-20","2026-06-26","E034",2,1,1],["2026-06-23","2026-06-29","E018",0,2,1],["2026-06-28","2026-07-01","E013",0,3,1],["2026-07-04","2026-07-06","E026",0,1,1],["2026-06-29","2026-07-06","E033",0,2,1],["2026-06-29","2026-07-06","E014",2,6,1],["2026-07-02","2026-07-08","E008",0,1,1],["2026-07-04","2026-07-10","E033",0,1,1],["2026-07-09","2026-07-15","E013",2,1,1],["2026-07-14","2026-07-16","E025",2,1,1],["2026-07-12","2026-07-16","E030",1,1,1],["2026-07-14","2026-07-17","E011",2,2,1],["2026-07-13","2026-07-17","E019",2,1,1],["2026-07-14","2026-07-21","E019",0,0.5,1],["2026-07-21","2026-07-22","E036",0,3,1],["2026-07-23","2026-07-27","E013",0,1,2],["2026-07-24","2026-07-28","E006",0,0.5,1],["2026-07-25","2026-07-28","E021",0,2,1],["2026-07-29","2026-07-30","E021",0,1,1],["2026-07-26","2026-07-31","E029",2,3,1],["2026-08-02","2026-08-05","E007",1,1,1],["2026-07-31","2026-08-06","E038",0,0.5,1],["2026-08-05","2026-08-12","E002",2,1,1],["2026-08-10","2026-08-13","E012",0,1,1],["2026-08-06","2026-08-13","E019",2,2,1],["2026-08-09","2026-08-13","E022",0,1,1],["2026-08-09","2026-08-14","E009",0,2,1],["2026-08-16","2026-08-18","E003",2,3,1],["2026-08-15","2026-08-18","E024",2,1,1],["2026-08-15","2026-08-19","E003",0,2,1],["2026-08-17","2026-08-20","E003",2,1,1],["2026-08-16","2026-08-20","E013",0,1,1],["2026-08-14","2026-08-20","E027",1,1,1],["2026-08-14","2026-08-21","E035",0,1,1],["2026-08-16","2026-08-21","E039",2,1,1],["2026-08-23","2026-08-25","E019",2,1,1],["2026-08-23","2026-08-26","E019",2,1,1],["2026-08-27","2026-08-31","E005",0,3,1],["2026-08-25","2026-08-31","E015",2,3,1],["2026-08-25","2026-08-31","E022",0,1,1],["2026-08-27","2026-09-01","E015",0,0.5,1],["2026-08-25","2026-09-01","E034",2,1,1],["2026-08-28","2026-09-02","E004",0,1,1],["2026-08-27","2026-09-02","E026",0,1,1],["2026-08-27","2026-09-02","E033",2,1,1],["2026-08-31","2026-09-04","E018",0,1,1],["2026-09-06","2026-09-08","E020",0,0.5,1],["2026-09-06","2026-09-10","E040",0,1,1],["2026-09-08","2026-09-11","E009",0,1,1],["2026-09-09","2026-09-11","E018",0,1,1],["2026-09-08","2026-09-11","E039",2,2,1],["2026-09-14","2026-09-15","E009",2,3,1],["2026-09-09","2026-09-15","E013",2,1,1],["2026-09-12","2026-09-15","E033",0,1,1],["2026-09-10","2026-09-16","E010",0,1,1],["2026-09-14","2026-09-17","E008",0,2,1],["2026-09-10","2026-09-17","E039",0,2,1],["2026-09-16","2026-09-18","E028",2,1,1],["2026-09-15","2026-09-21","E038",0,0.5,1],["2026-09-15","2026-09-21","E025",1,3,2],["2026-09-20","2026-09-22","E027",2,1,1],["2026-09-16","2026-09-23","E017",0,1,2],["2026-09-18","2026-09-24","E003",0,0.5,1],["2026-09-21","2026-09-24","E004",1,1,1],["2026-09-18","2026-09-24","E040",0,1,1],["2026-09-25","2026-09-29","E032",0,3,1],["2026-09-25","2026-10-01","E017",0,1,1],["2026-09-24","2026-10-01","E034",2,2,1],["2026-09-25","2026-10-02","E024",0,2,1],["2026-09-26","2026-10-02","E030",2,5,0],["2026-10-03","2026-10-05","E006",0,0.5,1],["2026-10-01","2026-10-05","E009",2,2,1],["2026-09-29","2026-10-06","E039",0,2,1],["2026-09-30","2026-10-07","E006",0,2,1],["2026-10-06","2026-10-09","E019",0,1,1],["2026-10-06","2026-10-12","E001",0,1,1],["2026-10-08","2026-10-12","E037",0,1,1],["2026-10-12","2026-10-13","E002",2,1,1],["2026-10-13","2026-10-14","E019",0,0.5,1],["2026-10-10","2026-10-15","E009",0,1,1],["2026-10-11","2026-10-16","E037",2,1,1],["2026-10-18","2026-10-20","E012",2,1,1],["2026-10-19","2026-10-20","E036",2,2,1],["2026-10-16","2026-10-21","E020",2,1,1],["2026-10-18","2026-10-21","E024",2,2,1],["2026-10-17","2026-10-23","E001",0,1,1],["2026-10-17","2026-10-23","E011",2,2,1],["2026-10-21","2026-10-23","E040",1,1,1],["2026-10-21","2026-10-26","E029",2,3,1],["2026-10-19","2026-10-26","E034",2,1,1],["2026-10-21","2026-10-28","E014",0,1,1],["2026-10-25","2026-10-29","E001",0,1,1],["2026-10-27","2026-10-29","E009",0,2,1]];  // วันที่ยื่น วันที่ลา รหัส ประเภท(0-2) วัน สถานะ(0-2)
const L_TYPES = ['ลาป่วย', 'ลากิจ', 'ลาพักร้อน'], L_STATUS = ['รออนุมัติ', 'อนุมัติ', 'ไม่อนุมัติ'];

function setupData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const names = ['ตั้งค่า', 'พนักงาน', 'บันทึกการลา', 'สิทธิ์ลา', 'Dashboard'];
  const sh = {};
  names.forEach((n, i) => { let s = ss.getSheetByName(n); if (s) { s.clear(); s.clearConditionalFormatRules(); } else s = ss.insertSheet(n, i); sh[n] = s; });
  ss.getSheets().forEach(s => { if (names.indexOf(s.getName()) < 0 && s.getLastRow() === 0) ss.deleteSheet(s); });
  const d = (s, h) => { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2], h || 0, 0); };
  const head = (s, a1) => s.getRange(a1).setBackground('#1F5C5C').setFontColor('#FFFFFF').setFontWeight('bold');
  const list = (s, a1, items) => s.getRange(a1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(items).build());
  const N = EMP_DATA.length, MAXR = 2000;
  const LV = c => "'บันทึกการลา'!$" + c + "$2:$" + c + "$" + MAXR;
  const EM = c => "'พนักงาน'!$" + c + "$2:$" + c + "$" + (N + 1);

  // ตั้งค่า (ตำแหน่งเดียวกับไฟล์ Excel วันที่ 4)
  const st = sh['ตั้งค่า'];
  st.getRange('A1').setValue('ตั้งค่า (กติกาการลา) · สคริปต์และสูตรอ่านค่าจากชีตนี้ ห้ามย้ายตำแหน่ง').setFontWeight('bold');
  st.getRange('A3:B8').setValues([['ค่า', 'ความหมาย'], [new Date(2026, 9, 31), 'วันตัดยอดคิดอายุงาน (ใช้งานจริงใส่ =TODAY())'], [30, 'สิทธิ์ลาป่วย วัน/ปี'],
    [3, 'สิทธิ์ลากิจ วัน/ปี'], [30, 'วันต่อเดือน (หักเงินลาเกินสิทธิ์)'], [1, 'เตือนเมื่อพักร้อนเหลือไม่เกิน (วัน)']]);
  st.getRange('A10').setValue('ตารางสิทธิ์ลาพักร้อนตามอายุงาน (VLOOKUP แบบ TRUE)').setFontWeight('bold');
  st.getRange('A11:B16').setValues([['อายุงาน (ปี) ตั้งแต่', 'วันพักร้อน/ปี'], [0, 0], [1, 6], [3, 8], [5, 10], [10, 12]]);
  st.getRange('A4').setNumberFormat('d/m/yyyy'); head(st, 'A3:B3'); head(st, 'A11:B11'); st.setColumnWidth(1, 150); st.setColumnWidth(2, 340);

  // พนักงาน
  const em = sh['พนักงาน'];
  em.getRange('F2:F' + (N + 1)).setNumberFormat('@');
  em.getRange(1, 1, N + 1, 7).setValues([['รหัส', 'ชื่อ-สกุล', 'แผนก', 'วันเริ่มงาน', 'เงินเดือน', 'PIN', 'สิทธิ์']]
    .concat(EMP_DATA.map(r => [r[0], r[1], r[2], d(r[3]), r[4], String(r[5]), r[6]])));
  head(em, 'A1:G1'); em.setFrozenRows(1); em.getRange('D2:D').setNumberFormat('d/m/yyyy'); em.getRange('E2:E').setNumberFormat('#,##0');
  list(em, 'G2:G500', ['พนักงาน', 'หัวหน้า', 'HR']); em.setColumnWidth(2, 170);

  // บันทึกการลา
  const dept = {}; EMP_DATA.forEach(r => dept[r[0]] = r[2]);
  const lv = sh['บันทึกการลา'];
  lv.getRange(1, 1, LEAVE_DATA.length + 1, 11).setValues([['เลขที่', 'วันที่ยื่น', 'วันที่ลา', 'รหัส', 'ประเภท', 'จำนวนวัน', 'เหตุผล', 'สถานะ', 'แผนก', 'ผู้อนุมัติ', 'วันที่อนุมัติ']]
    .concat(LEAVE_DATA.map((r, i) => ['L' + ('000' + (i + 1)).slice(-4), d(r[0], 9), d(r[1]), r[2], L_TYPES[r[3]], r[4], '', L_STATUS[r[5]], dept[r[2]],
      r[5] ? 'E001 (ข้อมูลเดิม)' : '', r[5] ? d(r[0], 15) : ''])));
  head(lv, 'A1:K1'); lv.setFrozenRows(1);
  lv.getRange('B2:B').setNumberFormat('d/m/yyyy h:mm'); lv.getRange('C2:C').setNumberFormat('d/m/yyyy'); lv.getRange('K2:K').setNumberFormat('d/m/yyyy h:mm');
  list(lv, 'E2:E' + MAXR, L_TYPES); list(lv, 'H2:H' + MAXR, L_STATUS);
  lv.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$H2="รออนุมัติ"').setBackground('#FFF2CC').setRanges([lv.getRange('A2:K' + MAXR)]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$H2="ไม่อนุมัติ"').setFontColor('#9C9C9C').setRanges([lv.getRange('A2:K' + MAXR)]).build()]);
  lv.setColumnWidth(7, 180); lv.setColumnWidth(10, 150);

  // สิทธิ์ลา (สูตรเดียวกับไฟล์ Excel วันที่ 4 + คอลัมน์ P รออนุมัติ)
  const en = sh['สิทธิ์ลา'];
  const rows = [['รหัส', 'ชื่อ-สกุล', 'แผนก', 'วันเริ่มงาน', 'อายุงาน (ปี)', 'สิทธิ์พักร้อน', 'ใช้ลาป่วย', 'ใช้ลากิจ', 'ใช้ลาพักร้อน',
    'เหลือลาป่วย', 'เหลือลากิจ', 'เหลือพักร้อน', 'วันลาเกินสิทธิ์', 'หักเงิน (บาท)', 'สถานะ', 'รออนุมัติ (วัน)']];
  EMP_DATA.forEach((e, i) => {
    const r = i + 2, a = '$A' + r, S = "'ตั้งค่า'!";
    const look = c => 'INDEX(' + EM(c) + ',MATCH(' + a + ',' + EM('A') + ',0))';
    const used = (t, s) => 'SUMIFS(' + LV('F') + ',' + LV('D') + ',' + a + ',' + LV('E') + ',"' + t + '",' + LV('H') + ',"' + (s || 'อนุมัติ') + '")';
    rows.push([e[0], '=' + look('B'), '=' + look('C'), '=' + look('D'), '=DATEDIF(D' + r + ',' + S + '$A$4,"y")',
      '=VLOOKUP(E' + r + ',' + S + '$A$12:$B$16,2,TRUE)', '=' + used('ลาป่วย'), '=' + used('ลากิจ'), '=' + used('ลาพักร้อน'),
      '=' + S + '$A$5-G' + r, '=' + S + '$A$6-H' + r, '=F' + r + '-I' + r, '=MAX(0,-J' + r + ')+MAX(0,-K' + r + ')+MAX(0,-L' + r + ')',
      '=ROUND(' + look('E') + '/' + S + '$A$7*M' + r + ',2)',
      '=IFS(M' + r + '>0,"เกินสิทธิ์",AND(F' + r + '>0,L' + r + '<=' + S + '$A$8),"ใกล้หมด",TRUE,"ปกติ")',
      '=SUMIFS(' + LV('F') + ',' + LV('D') + ',' + a + ',' + LV('H') + ',"รออนุมัติ")']);
  });
  en.getRange(1, 1, rows.length, 16).setValues(rows);
  head(en, 'A1:P1'); en.setFrozenRows(1); en.setFrozenColumns(2);
  en.getRange('D2:D').setNumberFormat('d/m/yyyy'); en.getRange('N2:N').setNumberFormat('#,##0.00'); en.setColumnWidth(2, 170);
  const o = en.getRange('O2:O' + (N + 1));
  en.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('เกินสิทธิ์').setBackground('#F8CBAD').setFontColor('#9C0006').setRanges([o]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('ใกล้หมด').setBackground('#FFE699').setRanges([o]).build()]);

  // Dashboard (สำหรับ HR ในชีต · หน้าเว็บมี Dashboard ของตัวเอง)
  const db = sh['Dashboard'];
  db.getRange('A1').setValue('Dashboard วันลา (อัปเดตทันทีที่มีใบลาใหม่หรือ HR เปลี่ยนสถานะ)').setFontWeight('bold').setFontSize(14);
  db.getRange('A3:D4').setValues([['วันลาอนุมัติรวม', 'รออนุมัติ (รายการ)', 'คนลาเกินสิทธิ์', 'เงินที่ต้องหักรวม'],
    ['=SUMIFS(' + LV('F') + ',' + LV('H') + ',"อนุมัติ")', '=COUNTIF(' + LV('H') + ',"รออนุมัติ")',
     "=COUNTIF('สิทธิ์ลา'!$O$2:$O$" + (N + 1) + ',"เกินสิทธิ์")', "=SUM('สิทธิ์ลา'!$N$2:$N$" + (N + 1) + ')']]);
  head(db, 'A3:D3'); db.getRange('A4:D4').setFontSize(18).setFontWeight('bold').setFontColor('#B4531A'); db.getRange('D4').setNumberFormat('#,##0.00');
  const depts = ['ฝ่ายบุคคล', 'ฝ่ายบัญชี', 'ฝ่ายขาย', 'ฝ่ายไอที', 'ฝ่ายผลิต'];
  db.getRange(6, 1, 6, 4).setValues([['แผนก'].concat(L_TYPES)].concat(depts.map((x, i) => [x].concat(L_TYPES.map(t =>
    '=SUMIFS(' + LV('F') + ',' + LV('I') + ',$A' + (7 + i) + ',' + LV('E') + ',"' + t + '",' + LV('H') + ',"อนุมัติ")')))));
  head(db, 'A6:D6'); db.setColumnWidths(1, 4, 140);
  db.insertChart(db.newChart().asColumnChart().addRange(db.getRange('A6:D11')).setStacked().setPosition(3, 6, 0, 0)
    .setOption('title', 'วันลาอนุมัติตามแผนก').setOption('colors', ['#1F4E4E', '#C9A227', '#B4531A']).build());

  SpreadsheetApp.flush();
  ss.setActiveSheet(lv);
  Logger.log('สร้างข้อมูลเสร็จ: พนักงาน ' + N + ' คน · บันทึกการลา ' + LEAVE_DATA.length + ' รายการ · วันลาอนุมัติรวม ' + db.getRange('A4').getValue());
}
```

### 4.4 `Index.html`

```html
<!DOCTYPE html>
<html lang="th">
<head>
<base target="_top">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@500;600&family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  :root{--dark:#1F4E4E;--dark2:#2A6262;--light:#F7F6F1;--card:#FFFDF8;--line:#DCD8CC;--text:#2E3B3B;--muted:#6B7A7A;
        --accent:#B4531A;--accent2:#F2B58A;--ok:#2E7D4F;--okbg:#E2EFDA;--warn:#8A6100;--warnbg:#FFF2CC;--bad:#9C1C06;--badbg:#FCE4D6}
  *{box-sizing:border-box}
  body{margin:0;font-family:'Sarabun',Tahoma,sans-serif;background:var(--light);color:var(--text);font-size:16px;line-height:1.5}
  h1,h2,h3{font-family:'Kanit',Tahoma,sans-serif;font-weight:600;margin:0;color:var(--dark)}
  .wrap{max-width:1000px;margin:0 auto;padding:16px}
  header{background:var(--dark);color:var(--light);position:sticky;top:0;z-index:5}
  header .wrap{display:flex;align-items:center;gap:12px;padding-top:12px;padding-bottom:12px}
  header h1{color:var(--light);font-size:20px;flex:1}
  .ham{background:none;border:0;cursor:pointer;padding:8px;margin-left:-8px;border-radius:8px;display:flex;flex-direction:column;gap:5px}
  .ham span{display:block;width:22px;height:2px;background:var(--light);border-radius:2px}
  .who{font-size:14px;color:#CFE0DC;text-align:right;line-height:1.35}
  .btn{font:inherit;font-weight:600;border:0;border-radius:10px;padding:11px 18px;cursor:pointer;background:var(--accent);color:#FFF8F0}
  .btn:disabled{opacity:.55;cursor:wait}
  .btn.line{background:transparent;color:var(--dark);border:1px solid var(--line)}
  .btn.sm{padding:7px 12px;font-size:14px}
  .btn.ok{background:var(--ok)} .btn.no{background:#fff;color:var(--bad);border:1px solid #E7B9A8}
  .card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px}
  .login{max-width:400px;margin:48px auto}
  .login h2{font-size:26px;margin-bottom:4px}
  label{display:block;font-weight:600;font-size:14px;margin:14px 0 6px}
  input,select,textarea{width:100%;font:inherit;padding:11px 12px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--text)}
  input:focus,select:focus,textarea:focus{outline:2px solid var(--accent2);border-color:var(--accent)}
  .hint{font-size:13px;color:var(--muted)}
  .msg{border-radius:10px;padding:10px 14px;margin-top:14px;font-size:15px}
  .msg.err{background:var(--badbg);color:var(--bad)} .msg.ok{background:var(--okbg);color:var(--ok)} .msg.warn{background:var(--warnbg);color:var(--warn)}
  .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px} .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
  .bal .t,.kpi .t{font-size:14px;color:var(--muted);font-weight:600}
  .bal .n,.kpi .n{font-family:'Kanit',sans-serif;font-size:32px;font-weight:600;color:var(--dark);line-height:1.15}
  .bal .n small{font-size:15px;color:var(--muted);font-weight:500}
  .kpi .n{color:var(--accent)} .kpi .n small{font-size:15px;color:var(--muted);font-weight:500}
  .bar{height:8px;border-radius:8px;background:#EAF0EE;overflow:hidden;margin:10px 0 6px}
  .bar i{display:block;height:100%;background:var(--dark)}
  .bal.low .bar i{background:#C9A227} .bal.over .bar i{background:var(--accent)} .bal.over .n{color:var(--accent)}
  .chip{display:inline-block;font-size:13px;font-weight:700;border-radius:999px;padding:3px 10px;white-space:nowrap}
  .c-ok{background:var(--okbg);color:var(--ok)} .c-wait{background:var(--warnbg);color:var(--warn)} .c-no{background:#EDEDED;color:#666} .c-over{background:var(--badbg);color:var(--bad)}
  .c-role{background:#2A6262;color:#F7F6F1}
  .sec{margin-top:18px} .sec h3{font-size:19px;margin-bottom:12px}
  .row2{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}
  .types{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .types input{position:absolute;opacity:0;width:1px;height:1px}
  .types label{margin:0;text-align:center;border:1px solid var(--line);border-radius:10px;padding:10px 4px;cursor:pointer;font-weight:600;background:#fff}
  .types input:checked+label{background:var(--dark);color:var(--light);border-color:var(--dark)}
  table{width:100%;border-collapse:collapse;font-size:15px}
  th{text-align:left;font-size:13px;color:var(--muted);font-weight:600;padding:8px;border-bottom:1px solid var(--line)}
  td{padding:10px 8px;border-bottom:1px solid #EEEBE2;vertical-align:top}
  td.num,th.num{text-align:right}
  .neg{color:var(--accent);font-weight:700}
  .empty{color:var(--muted);text-align:center;padding:18px}
  .top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
  .filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px} .filters>*{flex:1;min-width:160px}
  /* drawer */
  .scrim{position:fixed;inset:0;background:rgba(20,40,40,.4);opacity:0;pointer-events:none;transition:opacity .2s;z-index:20}
  .drawer{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:84vw;background:var(--card);z-index:21;transform:translateX(-100%);transition:transform .22s;display:flex;flex-direction:column}
  body.menu .scrim{opacity:1;pointer-events:auto} body.menu .drawer{transform:none;box-shadow:4px 0 24px rgba(0,0,0,.12)}
  .drawer .dh{background:var(--dark);color:var(--light);padding:20px 18px}
  .drawer .dh b{font-size:17px} .drawer .dh div{font-size:14px;color:#CFE0DC}
  .drawer nav{padding:10px;flex:1;overflow:auto}
  .drawer .grp{font-size:12px;color:var(--muted);font-weight:700;padding:12px 10px 4px}
  .drawer a{display:flex;justify-content:space-between;align-items:center;padding:11px 12px;border-radius:10px;color:var(--text);text-decoration:none;font-weight:600;cursor:pointer}
  .drawer a:hover{background:#EEF2F0} .drawer a.on{background:#E3ECE9;color:var(--dark)}
  .badge{background:var(--accent);color:#fff;border-radius:999px;font-size:12px;padding:1px 8px}
  .drawer .out{border-top:1px solid var(--line);padding:12px}
  /* approve cards */
  .req{display:grid;grid-template-columns:1fr auto;gap:8px 16px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:14px 16px;background:#fff;margin-bottom:10px}
  .req .acts{display:flex;gap:8px}
  .hbar{display:flex;height:22px;border-radius:6px;overflow:hidden;background:#EEF2F0}
  .hbar i{display:block;height:100%}
  .legend{display:flex;gap:14px;font-size:13px;color:var(--muted);margin-bottom:8px} .legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:4px}
  .modal{position:fixed;inset:0;background:rgba(20,40,40,.45);display:none;align-items:center;justify-content:center;padding:16px;z-index:30}
  .modal.show{display:flex} .modal .card{max-width:420px;width:100%}
  .modal .acts{display:flex;gap:10px;justify-content:flex-end;margin-top:16px}
  .spin{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.5);border-top-color:#fff;border-radius:50%;animation:s .8s linear infinite;vertical-align:-3px;margin-right:6px}
  .btn.line .spin{border-color:rgba(31,78,78,.3);border-top-color:var(--dark)}
  @keyframes s{to{transform:rotate(360deg)}}
  .hide{display:none!important}
  @media (max-width:720px){
    .grid3,.row2{grid-template-columns:1fr} .grid4{grid-template-columns:1fr 1fr}
    .bal{display:grid;grid-template-columns:1fr auto;align-items:end;gap:0 12px} .bal .bar,.bal .hint{grid-column:1/-1}
    table.cards thead{display:none} table.cards,table.cards tbody,table.cards tr,table.cards td{display:block;width:100%}
    table.cards tr{border:1px solid var(--line);border-radius:12px;padding:8px 12px;margin-bottom:10px;background:#fff}
    table.cards td{border:0;padding:3px 0;display:flex;justify-content:space-between;gap:10px;text-align:right}
    table.cards td::before{content:attr(data-l);color:var(--muted);font-size:13px;text-align:left}
    .req{grid-template-columns:1fr} .req .acts>*{flex:1}
    header h1{font-size:17px} .who{display:none}
  }
</style>
</head>
<body>
<header><div class="wrap">
  <button class="ham hide" id="hamBtn" onclick="menu(true)" aria-label="เมนู"><span></span><span></span><span></span></button>
  <h1 id="pageTitle">ระบบวันลา</h1>
  <div class="who hide" id="userBox"><b id="uName"></b><br><span id="uDept"></span></div>
</div></header>

<div class="scrim" onclick="menu(false)"></div>
<aside class="drawer" aria-label="เมนู">
  <div class="dh"><b id="dName"></b><div id="dInfo"></div></div>
  <nav id="nav"></nav>
  <div class="out"><button class="btn line" style="width:100%" onclick="logout()">ออกจากระบบ</button></div>
</aside>

<main class="wrap">
  <!-- เข้าสู่ระบบ -->
  <section id="loginView" class="card login">
    <h2>เข้าสู่ระบบ</h2>
    <p class="hint">ใช้รหัสพนักงานและ PIN 4 หลักที่ได้รับจากฝ่ายบุคคล</p>
    <form onsubmit="doLogin(event)">
      <label for="id">รหัสพนักงาน</label>
      <input id="id" placeholder="E001" autocomplete="username" required>
      <label for="pin">PIN</label>
      <input id="pin" type="password" inputmode="numeric" maxlength="4" autocomplete="current-password" required>
      <button id="loginBtn" class="btn" style="width:100%;margin-top:18px">เข้าสู่ระบบ</button>
    </form>
    <div id="loginMsg"></div>
  </section>

  <!-- ของฉัน -->
  <section id="v-me" class="view hide">
    <div class="top">
      <div><h2 style="font-size:24px">สิทธิ์ลาคงเหลือ</h2><span class="hint" id="tenure"></span></div>
      <div style="display:flex;gap:8px;align-items:center"><span id="stChip"></span>
        <button class="btn line sm" onclick="reloadMe()" id="refBtn">รีเฟรช</button></div>
    </div>
    <div id="overMsg"></div>
    <div class="grid3 sec" id="balCards"></div>
    <div class="card sec">
      <h3>ประวัติการลา <span class="hint">(30 รายการล่าสุด)</span></h3>
      <table class="cards"><thead><tr><th>เลขที่</th><th>วันที่ลา</th><th>ประเภท</th><th class="num">วัน</th><th>เหตุผล</th><th>สถานะ</th></tr></thead>
        <tbody id="hist"></tbody></table>
    </div>
  </section>

  <!-- ยื่นใบลา -->
  <section id="v-apply" class="view hide">
    <div class="card">
      <h3 style="font-size:22px">ยื่นใบลา</h3>
      <p class="hint" id="applyHint"></p>
      <form onsubmit="sendLeave(event)">
        <label>ประเภทการลา</label>
        <div class="types">
          <input type="radio" name="type" id="t1" value="ลาป่วย" checked><label for="t1">ลาป่วย</label>
          <input type="radio" name="type" id="t2" value="ลากิจ"><label for="t2">ลากิจ</label>
          <input type="radio" name="type" id="t3" value="ลาพักร้อน"><label for="t3">ลาพักร้อน</label>
        </div>
        <div class="row2">
          <div><label for="date">วันที่ลา (วันแรก)</label><input type="date" id="date" required></div>
          <div><label for="days">จำนวนวัน</label><select id="days"></select></div>
        </div>
        <label for="reason">เหตุผล <span class="hint">(ไม่บังคับ)</span></label>
        <textarea id="reason" rows="2" maxlength="200" placeholder="เช่น ไปพบแพทย์"></textarea>
        <button id="sendBtn" class="btn" style="margin-top:16px">ส่งใบลา</button>
      </form>
      <div id="sendMsg"></div>
    </div>
  </section>

  <!-- อนุมัติ -->
  <section id="v-approve" class="view hide">
    <div class="top"><div><h2 style="font-size:24px">อนุมัติใบลา</h2><span class="hint" id="apScope"></span></div>
      <button class="btn line sm" id="apRef" onclick="loadPending()">รีเฟรช</button></div>
    <div id="apMsg"></div>
    <div class="sec" id="apList"></div>
  </section>

  <!-- ทีม -->
  <section id="v-team" class="view hide">
    <div class="top"><div><h2 style="font-size:24px" id="teamTitle">สิทธิ์ลาของทีม</h2><span class="hint" id="teamScope"></span></div>
      <button class="btn line sm" id="tmRef" onclick="loadTeam()">รีเฟรช</button></div>
    <div class="card sec">
      <div class="filters"><input id="tmSearch" placeholder="ค้นหารหัสหรือชื่อ" oninput="drawTeam()">
        <select id="tmDept" onchange="drawTeam()"></select>
        <select id="tmSt" onchange="drawTeam()"><option value="">ทุกสถานะ</option><option>เกินสิทธิ์</option><option>ใกล้หมด</option><option>ปกติ</option></select></div>
      <table class="cards"><thead><tr><th>รหัส</th><th>ชื่อ-สกุล</th><th>แผนก</th><th class="num">เหลือป่วย</th><th class="num">เหลือกิจ</th><th class="num">เหลือพักร้อน</th><th class="num">รออนุมัติ</th><th>สถานะ</th></tr></thead>
        <tbody id="tmBody"></tbody></table>
    </div>
  </section>

  <!-- Dashboard -->
  <section id="v-dash" class="view hide">
    <div class="top"><h2 style="font-size:24px">Dashboard วันลา</h2><button class="btn line sm" id="dbRef" onclick="loadDash()">รีเฟรช</button></div>
    <div class="grid4 sec" id="kpis"></div>
    <div class="card sec"><h3>วันลาที่อนุมัติ แยกแผนก</h3>
      <div class="legend"><span><i style="background:#1F4E4E"></i>ลาป่วย</span><span><i style="background:#C9A227"></i>ลากิจ</span><span><i style="background:#B4531A"></i>ลาพักร้อน</span></div>
      <div id="deptBars"></div></div>
    <div class="grid3 sec" style="grid-template-columns:2fr 1fr">
      <div class="card"><h3>ลาเกินสิทธิ์ (ต้องหักเงิน)</h3><table class="cards"><thead><tr><th>รหัส</th><th>ชื่อ</th><th>แผนก</th><th class="num">วันเกิน</th><th class="num">หักเงิน</th></tr></thead><tbody id="overBody"></tbody></table></div>
      <div class="card"><h3>พักร้อนใกล้หมด</h3><div id="nearList"></div></div>
    </div>
  </section>

  <!-- PIN -->
  <section id="v-pin" class="view hide">
    <div class="card" style="max-width:520px">
      <h3 style="font-size:22px">จัดการ PIN</h3>
      <p class="hint">ใช้เมื่อพนักงานลืม PIN หรือพนักงานใหม่ · แจ้ง PIN ใหม่ให้เจ้าตัวเป็นการส่วนตัว</p>
      <label for="pinEmp">พนักงาน</label><select id="pinEmp"></select>
      <label for="pinNew">PIN ใหม่ (4 หลัก)</label>
      <div style="display:flex;gap:8px"><input id="pinNew" inputmode="numeric" maxlength="4"><button class="btn line" type="button" onclick="randPin()">สุ่ม</button></div>
      <button class="btn" id="pinBtn" style="margin-top:16px" onclick="savePin()">บันทึก PIN</button>
      <div id="pinMsg"></div>
    </div>
  </section>
</main>

<div class="modal" id="confirmBox"><div class="card">
  <h3 style="font-size:19px" id="cfTitle">ยืนยัน</h3>
  <p id="confirmText"></p>
  <div class="acts"><button class="btn line" onclick="closeConfirm()">ยกเลิก</button><button class="btn" id="cfOk">ยืนยัน</button></div>
</div></div>

<script>
  var S = { id: '', pin: '', role: '', data: null, team: [] };
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmt = function (n) { return (Math.round(n * 10) / 10).toString(); };
  var money = function (n) { return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var VIEWS = [
    { id: 'me', label: 'สิทธิ์ลาของฉัน', roles: ['พนักงาน', 'หัวหน้า', 'HR'], grp: 'ของฉัน' },
    { id: 'apply', label: 'ยื่นใบลา', roles: ['พนักงาน', 'หัวหน้า', 'HR'], grp: 'ของฉัน' },
    { id: 'approve', label: 'อนุมัติใบลา', roles: ['หัวหน้า', 'HR'], grp: 'จัดการ', badge: true },
    { id: 'team', label: 'สิทธิ์ลาของทีม', labelHR: 'พนักงานทั้งหมด', roles: ['หัวหน้า', 'HR'], grp: 'จัดการ' },
    { id: 'dash', label: 'Dashboard', roles: ['HR'], grp: 'HR' },
    { id: 'pin', label: 'จัดการ PIN', roles: ['HR'], grp: 'HR' }
  ];

  (function init() {
    var sel = $('days');
    for (var d = 0.5; d <= 10; d += 0.5) { var o = document.createElement('option'); o.value = d; o.textContent = fmt(d) + ' วัน'; if (d === 1) o.selected = true; sel.appendChild(o); }
    var t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset()); $('date').value = t.toISOString().slice(0, 10);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { menu(false); closeConfirm(); } });
  })();

  function msg(box, text, kind) { $(box).innerHTML = text ? '<div class="msg ' + kind + '">' + esc(text) + '</div>' : ''; }
  function busy(btn, on, label) {
    var b = $(btn); if (!b) return; b.disabled = on;
    if (on) { b.dataset.l = b.textContent; b.innerHTML = '<span class="spin"></span>' + (label || 'โหลด'); } else b.textContent = b.dataset.l || b.textContent;
  }
  function call(fn, args, ok, fail) {
    google.script.run.withSuccessHandler(ok).withFailureHandler(function (e) { fail(e && e.message ? e.message : String(e)); })[fn].apply(null, args);
  }
  function auth() { return [S.id, S.pin]; }
  function menu(open) { document.body.classList.toggle('menu', !!open); }
  function chipFor(st) {
    var c = st === 'อนุมัติ' || st === 'ปกติ' ? 'c-ok' : (st === 'รออนุมัติ' || st === 'ใกล้หมด' ? 'c-wait' : (st === 'เกินสิทธิ์' ? 'c-over' : 'c-no'));
    return '<span class="chip ' + c + '">' + esc(st) + '</span>';
  }

  /* ---------- login / nav ---------- */
  function doLogin(ev) {
    ev.preventDefault();
    S.id = $('id').value.trim().toUpperCase(); S.pin = $('pin').value.trim();
    busy('loginBtn', true, 'กำลังตรวจสอบ'); msg('loginMsg', '');
    call('login', auth(), function (d) { busy('loginBtn', false); afterLogin(d); }, function (e) { busy('loginBtn', false); msg('loginMsg', e, 'err'); });
  }
  function afterLogin(d) {
    S.role = d.emp.role; S.data = d;
    $('loginView').classList.add('hide'); $('hamBtn').classList.remove('hide'); $('userBox').classList.remove('hide');
    $('uName').textContent = d.emp.id + ' ' + d.emp.name; $('uDept').textContent = d.emp.dept + ' · ' + d.emp.role;
    $('dName').textContent = d.emp.id + ' ' + d.emp.name;
    $('dInfo').innerHTML = esc(d.emp.dept) + ' <span class="chip c-role" style="margin-left:6px">' + esc(d.emp.role) + '</span>';
    drawNav(d.pendingCount); renderMe(d); go('me');
  }
  function drawNav(pending) {
    var html = '', grp = '';
    VIEWS.forEach(function (v) {
      if (v.roles.indexOf(S.role) < 0) return;
      if (v.grp !== grp) { grp = v.grp; html += '<div class="grp">' + esc(grp) + '</div>'; }
      var label = S.role === 'HR' && v.labelHR ? v.labelHR : v.label;
      html += '<a id="nav-' + v.id + '" onclick="go(\'' + v.id + '\')"><span>' + esc(label) + '</span>' +
        (v.badge && pending ? '<span class="badge">' + pending + '</span>' : '') + '</a>';
    });
    $('nav').innerHTML = html;
  }
  function go(view) {
    var v = VIEWS.filter(function (x) { return x.id === view; })[0];
    if (!v || v.roles.indexOf(S.role) < 0) return;
    Array.prototype.forEach.call(document.querySelectorAll('.view'), function (el) { el.classList.add('hide'); });
    $('v-' + view).classList.remove('hide');
    Array.prototype.forEach.call(document.querySelectorAll('.drawer a'), function (a) { a.classList.toggle('on', a.id === 'nav-' + view); });
    $('pageTitle').textContent = S.role === 'HR' && v.labelHR ? v.labelHR : v.label;
    menu(false); window.scrollTo(0, 0);
    if (view === 'approve') loadPending();
    if (view === 'team') loadTeam();
    if (view === 'dash') loadDash();
    if (view === 'pin') loadEmps();
    if (view === 'apply') applyHint();
  }
  function logout() {
    S = { id: '', pin: '', role: '', data: null, team: [] }; $('pin').value = ''; menu(false);
    Array.prototype.forEach.call(document.querySelectorAll('.view'), function (el) { el.classList.add('hide'); });
    $('hamBtn').classList.add('hide'); $('userBox').classList.add('hide'); $('loginView').classList.remove('hide'); $('pageTitle').textContent = 'ระบบวันลา';
  }

  /* ---------- ของฉัน ---------- */
  function reloadMe() {
    busy('refBtn', true);
    call('login', auth(), function (d) { busy('refBtn', false); S.data = d; drawNav(d.pendingCount); renderMe(d); }, function (e) { busy('refBtn', false); msg('overMsg', e, 'err'); });
  }
  function renderMe(d) {
    $('tenure').textContent = 'เริ่มงาน ' + d.emp.start + ' · อายุงาน ' + d.bal.tenure + ' ปี' + (d.bal.pending ? ' · รออนุมัติ ' + fmt(d.bal.pending) + ' วัน' : '');
    $('stChip').innerHTML = chipFor(d.bal.status);
    $('overMsg').innerHTML = d.bal.overDays > 0 ? '<div class="msg err">ลาเกินสิทธิ์ ' + fmt(d.bal.overDays) + ' วัน · หักเงินเดือนประมาณ ' + money(d.bal.deduct) + ' บาท</div>' : '';
    $('balCards').innerHTML = d.bal.types.map(function (t) {
      var pct = t.quota > 0 ? Math.max(0, Math.min(100, t.left / t.quota * 100)) : 0;
      var c = t.left < 0 ? 'over' : (t.quota > 0 && t.left <= 1 ? 'low' : '');
      return '<div class="card bal ' + c + '"><div class="t">' + esc(t.type) + '</div><div class="n">' + fmt(t.left) + ' <small>/ ' + fmt(t.quota) + ' วัน</small></div>' +
        '<div class="bar"><i style="width:' + pct + '%"></i></div><div class="hint">ใช้ไป ' + fmt(t.used) + ' วัน' + (t.quota === 0 ? ' · ยังไม่มีสิทธิ์ (อายุงานไม่ถึง 1 ปี)' : '') + '</div></div>';
    }).join('');
    $('hist').innerHTML = d.hist.length ? d.hist.map(function (h) {
      return '<tr><td data-l="เลขที่">' + esc(h.no) + '</td><td data-l="วันที่ลา">' + esc(h.date) + '</td><td data-l="ประเภท">' + esc(h.type) +
        '</td><td data-l="วัน" class="num">' + fmt(h.days) + '</td><td data-l="เหตุผล">' + (esc(h.reason) || '-') + '</td><td data-l="สถานะ">' + chipFor(h.status) +
        (h.by ? '<div class="hint">' + esc(h.by) + '</div>' : '') + '</td></tr>';
    }).join('') : '<tr><td class="empty" colspan="6">ยังไม่มีประวัติการลา</td></tr>';
  }
  function applyHint() {
    var b = S.data && S.data.bal; if (!b) return;
    $('applyHint').textContent = 'คงเหลือ: ' + b.types.map(function (t) { return t.type + ' ' + fmt(t.left) + ' วัน'; }).join(' · ') +
      (S.role === 'พนักงาน' ? '' : ' · ใบลาของคุณต้องให้ผู้มีสิทธิ์คนอื่นอนุมัติ');
  }

  /* ---------- ยื่นใบลา ---------- */
  var pendingAction = null;
  function confirmBox(title, text, okLabel, fn) { $('cfTitle').textContent = title; $('confirmText').textContent = text; $('cfOk').textContent = okLabel; pendingAction = fn; $('confirmBox').classList.add('show'); }
  function closeConfirm() { $('confirmBox').classList.remove('show'); pendingAction = null; }
  $('cfOk').onclick = function () { var f = pendingAction; closeConfirm(); if (f) f(); };
  function sendLeave(ev, confirmed) {
    if (ev) ev.preventDefault();
    var form = { id: S.id, pin: S.pin, type: document.querySelector('input[name=type]:checked').value, date: $('date').value, days: $('days').value, reason: $('reason').value.trim(), confirm: !!confirmed };
    busy('sendBtn', true, 'กำลังส่ง'); msg('sendMsg', '');
    call('submitLeave', [form], function (r) {
      busy('sendBtn', false);
      if (r.needConfirm) { confirmBox('ใบลานี้จะเกินสิทธิ์', r.message, 'ยืนยันส่ง', function () { sendLeave(null, true); }); return; }
      msg('sendMsg', r.message, 'ok'); $('reason').value = ''; S.data = r.data; renderMe(r.data); drawNav(r.data.pendingCount); applyHint();
    }, function (e) { busy('sendBtn', false); msg('sendMsg', e, 'err'); });
  }

  /* ---------- อนุมัติ ---------- */
  function loadPending() {
    busy('apRef', true); $('apList').innerHTML = '<p class="hint">กำลังโหลด…</p>';
    call('getPending', auth(), function (r) {
      busy('apRef', false);
      $('apScope').textContent = r.role === 'HR' ? 'ทุกแผนก · ' + r.list.length + ' รายการรออนุมัติ' : r.dept + ' · ' + r.list.length + ' รายการรออนุมัติ';
      drawNav(r.list.length);
      $('apList').innerHTML = r.list.length ? r.list.map(function (o) {
        var warn = o.leftAfter < 0 ? '<span class="chip c-over">อนุมัติแล้วจะเกินสิทธิ์ ' + fmt(-o.leftAfter) + ' วัน</span>' : '<span class="hint">หลังอนุมัติเหลือ ' + fmt(o.leftAfter) + ' วัน</span>';
        return '<div class="req"><div><b>' + esc(o.id + ' ' + o.name) + '</b> <span class="hint">' + esc(o.dept) + ' · ' + esc(o.no) + '</span><br>' +
          esc(o.type) + ' ' + fmt(o.days) + ' วัน · วันที่ ' + esc(o.date) + (o.reason ? ' · ' + esc(o.reason) : '') + '<br>' + warn + '</div>' +
          '<div class="acts"><button class="btn no sm" onclick="act(\'' + esc(o.no) + '\',\'ไม่อนุมัติ\',this)">ไม่อนุมัติ</button>' +
          '<button class="btn ok sm" onclick="act(\'' + esc(o.no) + '\',\'อนุมัติ\',this)">อนุมัติ</button></div></div>';
      }).join('') : '<div class="card empty">ไม่มีใบลารออนุมัติ</div>';
    }, function (e) { busy('apRef', false); $('apList').innerHTML = ''; msg('apMsg', e, 'err'); });
  }
  function act(no, decision, btn) {
    confirmBox(decision + ' ' + no, 'ยืนยัน ' + decision + ' ใบลา ' + no + ' ใช่ไหม', decision, function () {
      btn.disabled = true;
      call('decide', [S.id, S.pin, no, decision], function (r) { msg('apMsg', r.message, 'ok'); loadPending(); }, function (e) { btn.disabled = false; msg('apMsg', e, 'err'); });
    });
  }

  /* ---------- ทีม ---------- */
  function loadTeam() {
    busy('tmRef', true); $('tmBody').innerHTML = '<tr><td class="empty" colspan="8">กำลังโหลด…</td></tr>';
    call('getTeam', auth(), function (r) {
      busy('tmRef', false); S.team = r.list;
      $('teamTitle').textContent = r.role === 'HR' ? 'พนักงานทั้งหมด' : 'สิทธิ์ลาของทีม';
      $('teamScope').textContent = (r.role === 'HR' ? 'ทุกแผนก' : r.dept) + ' · ' + r.list.length + ' คน';
      var depts = []; r.list.forEach(function (e) { if (depts.indexOf(e.dept) < 0) depts.push(e.dept); });
      $('tmDept').innerHTML = '<option value="">ทุกแผนก</option>' + depts.map(function (d) { return '<option>' + esc(d) + '</option>'; }).join('');
      $('tmDept').classList.toggle('hide', r.role !== 'HR');
      drawTeam();
    }, function (e) { busy('tmRef', false); $('tmBody').innerHTML = '<tr><td class="empty" colspan="8">' + esc(e) + '</td></tr>'; });
  }
  function drawTeam() {
    var q = $('tmSearch').value.trim().toLowerCase(), d = $('tmDept').value, st = $('tmSt').value;
    var list = S.team.filter(function (e) { return (!q || (e.id + ' ' + e.name).toLowerCase().indexOf(q) >= 0) && (!d || e.dept === d) && (!st || e.status === st); });
    var cellN = function (n) { return '<span class="' + (n < 0 ? 'neg' : '') + '">' + fmt(n) + '</span>'; };
    $('tmBody').innerHTML = list.length ? list.map(function (e) {
      return '<tr><td data-l="รหัส">' + esc(e.id) + '</td><td data-l="ชื่อ">' + esc(e.name) + '</td><td data-l="แผนก">' + esc(e.dept) + '</td>' +
        '<td data-l="เหลือป่วย" class="num">' + cellN(e.types[0].left) + '</td><td data-l="เหลือกิจ" class="num">' + cellN(e.types[1].left) + '</td>' +
        '<td data-l="เหลือพักร้อน" class="num">' + cellN(e.types[2].left) + ' <span class="hint">/ ' + fmt(e.types[2].quota) + '</span></td>' +
        '<td data-l="รออนุมัติ" class="num">' + (e.pending ? fmt(e.pending) : '-') + '</td><td data-l="สถานะ">' + chipFor(e.status) + '</td></tr>';
    }).join('') : '<tr><td class="empty" colspan="8">ไม่พบข้อมูล</td></tr>';
  }

  /* ---------- Dashboard ---------- */
  function loadDash() {
    busy('dbRef', true);
    call('getDashboard', auth(), function (r) {
      busy('dbRef', false);
      var k = [['วันลาอนุมัติรวม', fmt(r.approved), 'วัน'], ['ใบลารออนุมัติ', r.pending, 'รายการ'], ['ลาเกินสิทธิ์', r.overCount, 'คน'], ['เงินที่ต้องหักรวม', money(r.deduct), 'บาท']];
      $('kpis').innerHTML = k.map(function (x) { return '<div class="card kpi"><div class="t">' + x[0] + '</div><div class="n">' + esc(x[1]) + ' <small>' + x[2] + '</small></div></div>'; }).join('');
      var max = Math.max.apply(null, r.depts.map(function (d) { return d['ลาป่วย'] + d['ลากิจ'] + d['ลาพักร้อน']; }).concat([1]));
      var col = { 'ลาป่วย': '#1F4E4E', 'ลากิจ': '#C9A227', 'ลาพักร้อน': '#B4531A' };
      $('deptBars').innerHTML = r.depts.map(function (d) {
        var tot = d['ลาป่วย'] + d['ลากิจ'] + d['ลาพักร้อน'];
        return '<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:14px"><b>' + esc(d.dept) + '</b><span>' + fmt(tot) + ' วัน</span></div>' +
          '<div class="hbar" style="width:' + (tot / max * 100) + '%">' + ['ลาป่วย', 'ลากิจ', 'ลาพักร้อน'].map(function (t) {
            return '<i title="' + t + ' ' + fmt(d[t]) + '" style="width:' + (tot ? d[t] / tot * 100 : 0) + '%;background:' + col[t] + '"></i>'; }).join('') + '</div></div>';
      }).join('');
      $('overBody').innerHTML = r.over.length ? r.over.map(function (o) {
        return '<tr><td data-l="รหัส">' + esc(o.id) + '</td><td data-l="ชื่อ">' + esc(o.name) + '</td><td data-l="แผนก">' + esc(o.dept) + '</td><td data-l="วันเกิน" class="num">' + fmt(o.overDays) + '</td><td data-l="หักเงิน" class="num">' + money(o.deduct) + '</td></tr>';
      }).join('') : '<tr><td class="empty" colspan="5">ไม่มี</td></tr>';
      $('nearList').innerHTML = r.near.length ? r.near.map(function (n) { return '<div style="padding:6px 0;border-bottom:1px solid #EEEBE2">' + esc(n.id + ' ' + n.name) + '<div class="hint">' + esc(n.dept) + '</div></div>'; }).join('') : '<p class="hint">ไม่มี</p>';
    }, function (e) { busy('dbRef', false); $('kpis').innerHTML = '<div class="msg err">' + esc(e) + '</div>'; });
  }

  /* ---------- PIN ---------- */
  function loadEmps() {
    call('listEmployees', auth(), function (list) {
      $('pinEmp').innerHTML = list.map(function (e) { return '<option value="' + esc(e.id) + '">' + esc(e.id + ' ' + e.name + ' (' + e.dept + ' · ' + e.role + ')') + '</option>'; }).join('');
    }, function (e) { msg('pinMsg', e, 'err'); });
  }
  function randPin() { $('pinNew').value = String(Math.floor(1000 + Math.random() * 9000)); }
  function savePin() {
    var t = $('pinEmp').value, p = $('pinNew').value.trim();
    if (!/^\d{4}$/.test(p)) { msg('pinMsg', 'PIN ต้องเป็นตัวเลข 4 หลัก', 'err'); return; }
    busy('pinBtn', true, 'กำลังบันทึก');
    call('resetPin', [S.id, S.pin, t, p], function (r) { busy('pinBtn', false); msg('pinMsg', r.message, 'ok'); $('pinNew').value = ''; if (t === S.id) S.pin = p; },
      function (e) { busy('pinBtn', false); msg('pinMsg', e, 'err'); });
  }
</script>
</body>
</html>
```
