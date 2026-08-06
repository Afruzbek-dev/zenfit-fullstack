# ZenFit — Telegram Mini App (to'liq stack)

> Boshqa ilovalar faqat kaloriya sanaydi yoki faqat zal sotadi.
> **ZenFit — ovqat va mashqni bitta AI orqali, bitta balansda boshqaradigan hamroh.**

Uchta alohida deploy qilinadigan qism:

| Papka | Nima | Stack |
|---|---|---|
| `backend/` | REST API + Telegram bot | Node 22.5+, Express, Postgres (yoki SQLite), JWT, Anthropic Claude |
| `frontend/` | Telegram Mini App | React 18, Vite, Tailwind |
| `admin/` | Ichki analitika paneli | React, Vite, Recharts |

---

## Nima ishlaydi

**Autentifikatsiya** — Telegram `initData` bot token bilan HMAC-SHA256 orqali
server tomonda tekshiriladi, so'ng sessiya uchun JWT beriladi. Alohida
ro'yxatdan o'tish yo'q.

**Onboarding (11 bosqich)** — jins, yosh, bo'y, vazn, faollik, maqsad →
Mifflin-St Jeor formulasi bilan BMR/TDEE va kunlik kaloriya + makro me'yori
darhol ko'rsatiladi. So'ng 5 ta savol (tajriba, kun soni, jihoz, davomiylik,
jarohat) → **AI mashq rejasi** tuziladi.

**AI mashq rejasi (`src/lib/aiPlanEngine.js`)** — to'liq qoidaga asoslangan,
mijoz tomonda 0 ms da ishlaydi, hech qanday og'irlikni model "o'ylab
topmaydi":
- Split: 2-3 kun → Full Body, 4 kun → Upper/Lower, 5-6 kun → Push/Pull/Legs
- Boshlang'ich og'irlik tana vaznining %'idan (daraja bo'yicha), 0.8 xavfsizlik
  koeffitsienti bilan, 2.5 kg ga yaxlitlanadi
- **Progressiv yuklama** — o'tgan sessiyada barcha setlarda yuqori takror
  bajarilgan bo'lsa, bazaviy mashqqa +2.5 kg, izolyatsiyaga +1 kg
- Jarohat filtri: tizza → cho'kkalash o'rniga glute bridge, bel → hinge
  o'rniga seated row, yelka → OHP o'rniga lateral raise
- Bir split kuni takrorlanganda mashqlar aylanma tarzda almashadi

**AI Skaner** — taom rasmi (kamera yoki galereya, yuklashdan oldin siqiladi)
yoki matnli so'rov → Claude Vision taom nomi, kaloriya va makrolarni baholaydi.
Porsiya koeffitsienti (0.5× … 2×) bilan dietaga qo'shiladi.

**AI Trener chat** — foydalanuvchi profili, bugungi kaloriya balansi, suv,
so'nggi mashqlari va faol rejasini ko'rib turadigan suhbat. Xavfsizlik
qoidalari system prompt'da (tashxis qo'ymaydi, ekstremal dieta tavsiya
qilmaydi).

**AI ovqat rejasi** — kunlik me'yorga mos 4 mahal ovqat, milliy taomlar bilan.

**Mashqlar bazasi** — 41 ta mashq: o'zbekcha bosqichma-bosqich texnika, tez
uchraydigan xatolar, video havolasi.

**Kuzatuv** — ovqat, mashq (set/takror/kg darajasida), suv, vazn tarixi,
streak, haftalik kaloriya balansi grafigi, yutuqlar.

**Telegram bot** — `/start`, `/profile`, `/today`, `/workout`, `/streak`,
`/premium`, `/help`. Mini App'da qo'shilgan har bir yozuv botda ham ko'rinadi.

---

## Ishga tushirish (lokal)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

`.env` da kamida quyidagilar bo'lsin:

- `BOT_TOKEN` — @BotFather'dan
- `JWT_SECRET` — uzun tasodifiy qator
- `ANTHROPIC_API_KEY` — AI funksiyalar uchun (bo'lmasa API 503 qaytaradi,
  ilova qulamaydi)
- `ADMIN_SECRET` — admin panel uchun, kamida 16 belgi
- `ALLOW_DEV_LOGIN=1` — brauzerda Telegram'siz test qilish uchun

**Ma'lumotlar bazasi:** `DATABASE_URL` o'rnatilgan bo'lsa Postgres (Supabase)
ishlatiladi, aks holda lokal SQLite fayl. Ikkalasi ham bir xil so'rovlar bilan
ishlaydi — route kodi qaysi baza ekanini bilmaydi.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:8787
npm run dev
```

Brauzerda ochilganda `ALLOW_DEV_LOGIN=1` bo'lsa dev sessiya bilan ishlaydi.
Telegram ichida esa haqiqiy `initData` tekshiriladi.

---

## Supabase (production baza)

Loyiha allaqachon yaratilgan: `zenfit` (`mnslwrljqofgokavirmp`, eu-central-1).
Sxema qo'llangan (11 jadval, RLS yoqilgan).

Ulash uchun Supabase Dashboard → **Project Settings → Database → Connection
string (URI, Session pooler)** dan olib, `.env` ga qo'ying:

```
DATABASE_URL=postgresql://postgres.mnslwrljqofgokavirmp:<PAROL>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

RLS barcha jadvallarda yoqilgan va **hech qanday policy yo'q** — ya'ni anon
kalit orqali PostgREST'dan hech narsa o'qib bo'lmaydi. Backend ishonchli
server ulanishi orqali kiradi.

---

## Xavfsizlik — production'ga chiqarishdan oldin

- `.env` fayllarni **hech qachon** git'ga qo'shmang
- `JWT_SECRET` va `ADMIN_SECRET` uzun, tasodifiy bo'lsin
  (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `ALLOW_DEV_LOGIN=0` qiling — aks holda istalgan odam sessiya ochadi
- `CORS_ORIGIN` ni faqat frontend domeningizga cheklang (`*` emas)
- Admin API `ADMIN_SECRET` o'rnatilmagan bo'lsa **butunlay o'chadi** (fail
  closed) — bu ataylab shunday
- Backend **hech qachon** karta raqamini qabul qilmaydi. To'lov PSP'ning o'z
  sahifasiga yo'naltiriladi.

---

## Hali qilinmagan

- **To'lov** — Payme/Click webhook'lari imzoni tekshiradi, lekin tranzaksiya
  holat mashinasi (CheckPerformTransaction / CreateTransaction / Perform /
  Cancel) yozilmagan. Merchant hisobi ulanmaguncha `/checkout` 503 qaytaradi.
- **Mashq videolari** — har mashqda `youtubeId: null`. Hozir tugma YouTube
  qidiruvini ochadi (doim ishlaydi). Tasdiqlangan video ID qo'yilsa, ekran
  avtomatik ichki pleyerga o'tadi.
- **Tayyor trener dasturlari** — ro'yxat bor, lekin kunlik jadvali AI reja
  kabi to'liq emas.
- **Bot avtomatik xabarlari** — marketing rejasidagi 7 kunlik ketma-ketlik
  (`sendMarketingPush` funksiyasi tayyor, lekin cron/scheduler ulanmagan).
- **Referral tizimi**.
