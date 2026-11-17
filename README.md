# ระบบวันลาบนเว็บ (Google Sheet + Apps Script)

ระบบวันลาที่มีสิทธิ์ 3 ระดับ (พนักงาน / หัวหน้า / HR) ใช้ Google Sheet เป็นฐานข้อมูล และใช้ Apps Script ทำเป็น Web App ข้อมูลทั้งหมดเป็นข้อมูลสมมติ

| ไฟล์ | ทำหน้าที่ |
|---|---|
| [code/Code.gs](code/Code.gs) | ฝั่ง Google: ตรวจ PIN และสิทธิ์ ยื่นใบลา อนุมัติใบลา Dashboard รีเซ็ต PIN |
| [code/Setup.gs](code/Setup.gs) | สร้างชีต ข้อมูลสมมติ สูตร และกราฟ (รันครั้งเดียว) |
| [code/Index.html](code/Index.html) | หน้าเว็บ มีเมนูตามสิทธิ์ และใช้บนมือถือได้ |
| [code/appsscript.json](code/appsscript.json) | ตั้งค่าโปรเจกต์ (เวลาไทย, Web app) |
| [leave-system.md](leave-system.md) | ไฟล์ต้นฉบับ: ภาพรวม วิธีติดตั้ง และโค้ดทั้งหมด |
| [คู่มือติดตั้งระบบวันลา.docx](คู่มือติดตั้งระบบวันลา.docx) | คู่มือติดตั้งพร้อมภาพหน้าจอจากการติดตั้งจริง |

วิธีติดตั้งดูหัวข้อ 2–3 ใน [leave-system.md](leave-system.md)

> PIN ในระบบนี้เหมาะกับการฝึกเท่านั้น ถ้าใช้งานจริงควรเปลี่ยนเป็น Sign in with Google
