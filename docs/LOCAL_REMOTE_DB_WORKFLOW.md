\# تشغيل النظام محليًا وعن بعد



\## الحالة الحالية



يدعم المشروع الآن طريقتين للتشغيل:



1\. تشغيل بعيد على قاعدة Supabase.

2\. تشغيل محلي على PostgreSQL داخل الجهاز.



\## ملفات البيئة



\- `.env.remote.safe`

&#x20; - يحتوي إعدادات الاتصال بقاعدة Supabase.

&#x20; - لا يجب رفعه إلى GitHub.



\- `.env.local.safe`

&#x20; - يحتوي نفس إعدادات `.env.remote.safe` مع تغيير:

&#x20;   - `DATABASE\_URL`

&#x20;   - `DIRECT\_URL`

&#x20; - إلى قاعدة PostgreSQL المحلية:

&#x20;   `benf\_sys\_local`



\## التشغيل البعيد



```cmd

cd /d c:\\benf\_sys

scripts\\use-remote-db.cmd


## استيراد قاعدة Supabase إلى PostgreSQL المحلي

تم اعتماد سكربت واحد فقط للاستيراد الكامل الآمن من Supabase إلى المحلي:

```cmd
node scripts\import-remote-public-full-to-local.js