# ZenFit — deploy va botga ulash

Tartib muhim: **backend → frontend → backend env yangilash → bot**. Sabab —
backend botning tugmalari uchun frontend manzilini biladi, frontend esa
backend manzilini biladi.

---

## 0. GitHub'ga push

Repo lokalda tayyor (barcha manba commit qilingan, `.env` va bazalar
chiqarib tashlangan).

1. GitHub'da **bo'sh** private repo yarating (README/gitignore qo'shmang),
   masalan `zenfit`.
2. Keyin:

```bash
git remote add origin https://github.com/<foydalanuvchi>/zenfit.git
git branch -M main
git push -u origin main
```

---

## 1. Backend loyihasi (`zenfit-backend`)

Vercel → **Add New → Project** → repoingizni tanlang.

| Sozlama | Qiymat |
|---|---|
| Project Name | `zenfit-backend` |
| Root Directory | `zenfit/backend` |
| Framework Preset | Other |

**Environment Variables** (Production):

| Nomi | Qiymat |
|---|---|
| `DATABASE_URL` | **Transaction pooler** URI (pastdagi izohga qarang) |
| `BOT_TOKEN` | @BotFather'dan (lokal `.env` da bor) |
| `JWT_SECRET` | lokal `.env` dagi qiymat |
| `ADMIN_SECRET` | lokal `.env` dagi qiymat (64 belgi) |
| `TELEGRAM_WEBHOOK_SECRET` | lokal `.env` dagi qiymat (48 belgi) |
| `GEMINI_API_KEY` **yoki** `ANTHROPIC_API_KEY` | aistudio.google.com/apikey (bepul tarif bor) yoki console.anthropic.com |
| `GEMINI_MODEL` | `gemini-2.5-flash` (ixtiyoriy) |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` (ixtiyoriy) |
| `USE_TELEGRAM_WEBHOOK` | `1` |
| `ALLOW_DEV_LOGIN` | `0` ← **production'da albatta 0** |
| `CRON_SECRET` | lokal `.env` dagi qiymat (48 belgi) — kunlik eslatmalar uchun |
| `MINI_APP_URL` | hozircha bo'sh qoldiring, 3-bosqichda to'ldiriladi |
| `CORS_ORIGIN` | hozircha bo'sh qoldiring, 3-bosqichda to'ldiriladi |

### Region — Supabase yonida bo'lishi shart

`vercel.json` da `"regions": ["fra1"]` turibdi. Sababi: Supabase
`eu-central-1` (Frankfurt) da. Vercel'ning standart regioni `iad1` (AQSh),
u holda har bir SQL so'rov Atlantika okeanini kesib o'tadi — ilova ochilishi
10 soniyagacha cho'zilgan edi. Bazani boshqa regionga ko'chirsangiz, bu
qatorni ham o'zgartiring.

Tekshirish:

```bash
curl -sI https://zenfit-backend.vercel.app/api/health | grep -i x-vercel-id
```

Javobda `::fra1::` ko'rinishi kerak.

### `DATABASE_URL` — qaysi ulanishni olish kerak

Supabase uch xil ulanish satri beradi. **To'g'ridan-to'g'ri ulanish ishlamaydi**:

| Ulanish | Host | Holat |
|---|---|---|
| To'g'ridan-to'g'ri | `db.<ref>.supabase.co:5432` | ❌ Faqat IPv6 — `ENOTFOUND` beradi |
| Session pooler | `aws-0-<region>.pooler.supabase.com:5432` | ✅ Ishlaydi (uzoq yashovchi server uchun) |
| **Transaction pooler** | `aws-0-<region>.pooler.supabase.com:6543` | ✅ **Vercel uchun shu** |

Serverless har so'rovda yangi ulanish ochadi, shuning uchun transaction pooler
to'g'ri tanlov. Ikkalasi ham sinab ko'rilgan va ishlaydi.

Format:

```
postgresql://postgres.<ref>:<PAROL>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

> Foydalanuvchi nomi `postgres` emas, `postgres.<ref>` ekaniga e'tibor bering.
> Parolda maxsus belgilar bo'lsa, URL-encode qiling (`@` → `%40` va h.k.).

Deploy qiling va tekshiring:

```bash
curl https://zenfit-backend.vercel.app/api/health
```

`{"ok":true,"db":"postgres","ai":true,"aiProvider":"gemini"}` chiqishi kerak.
`"db":"sqlite"` chiqsa — `DATABASE_URL` o'qilmayapti.
`"ai":false` chiqsa — hech qaysi AI kaliti yo'q yoki placeholder qiymat turibdi.

AI kaliti: `GEMINI_API_KEY` yoki `ANTHROPIC_API_KEY` — **bittasi yetadi**.
Ikkalasi ham qo'yilsa Anthropic tanlanadi; `AI_PROVIDER=gemini` bilan
majburlash mumkin. `aiProvider` maydoni qaysi biri ishlayotganini ko'rsatadi.

---

## 2. Frontend loyihasi (`zenfit-miniapp`)

Vercel → **Add New → Project** → xuddi shu repo.

| Sozlama | Qiymat |
|---|---|
| Project Name | `zenfit-miniapp` |
| Root Directory | `zenfit/frontend` |
| Framework Preset | Vite (avtomatik aniqlanadi) |

**Environment Variables:**

| Nomi | Qiymat |
|---|---|
| `VITE_API_URL` | 1-bosqichdagi backend manzili, masalan `https://zenfit-backend.vercel.app` |

> `VITE_*` o'zgaruvchilari **build vaqtida** o'qiladi. Keyin o'zgartirsangiz,
> qayta deploy qilish shart — aks holda eski manzil bundle ichida qoladi.

---

## 3. Backend env'ini yangilash

Endi frontend manzili ma'lum. `zenfit-backend` loyihasida:

| Nomi | Qiymat |
|---|---|
| `MINI_APP_URL` | `https://zenfit-miniapp.vercel.app` |
| `CORS_ORIGIN` | `https://zenfit-miniapp.vercel.app` (vergul bilan bir nechta bo'lishi mumkin, `*` **ishlatmang**) |

Saqlagach **Redeploy** qiling — env o'zgarishi avtomatik qayta deploy qilmaydi.

---

## 4. Botga ulash

Lokal `.env` faylida quyidagilarni production qiymatlariga qo'ying:

```
API_BASE_URL=https://zenfit-backend.vercel.app
MINI_APP_URL=https://zenfit-miniapp.vercel.app
```

So'ng:

```bash
cd zenfit/backend
node --env-file=.env scripts/setup-bot.js            # hozirgi holatni ko'rish
node --env-file=.env scripts/setup-bot.js --apply    # webhook + menyu + buyruqlar
```

Bu uch narsani sozlaydi:
- **Webhook** → `https://zenfit-backend.vercel.app/api/telegram/webhook`
- **Menyu tugmasi** → Mini App'ni ochadi
- **Buyruqlar ro'yxati** → `/start`, `/profile`, `/today`, `/workout`, `/streak`,
  `/trainer`, `/scan`, `/premium`, `/help`

Tekshirish: botga `/start` yozing. Javob kelmasa:

```bash
node --env-file=.env scripts/setup-bot.js    # last_error_message ni ko'rsatadi
```

---

## Lokal ishlashni davom ettirish

Webhook o'rnatilgach bot **faqat** production backend'ga xabar yuboradi.
Lokalda polling bilan ishlash uchun:

```bash
node --env-file=.env scripts/setup-bot.js --delete-webhook
```

va `.env` da `USE_TELEGRAM_WEBHOOK=0` qiling.

> Bitta bot tokeni bilan polling va webhook'ni **bir vaqtda** ishlatib
> bo'lmaydi. Doimiy lokal ishlash kerak bo'lsa, @BotFather'da alohida test
> bot oching.

---

## Baza migratsiyasi

Sxema o'zgarganda (yangi jadval yoki ustun) migratsiyani ishga tushiring.
Har bir amal idempotent, shuning uchun qayta ishlatish xavfsiz:

```bash
cd zenfit/backend
npm run migrate          # .env — production Supabase
npm run migrate:local    # .env.local — lokal SQLite
```

---

## Kunlik eslatmalar (Vercel Cron)

`vercel.json` da `/api/cron/reminders` har kuni 14:00 UTC (Toshkent bo'yicha
19:00) ishga tushadi. Vercel `Authorization: Bearer $CRON_SECRET` sarlavhasini
o'zi qo'shadi — `CRON_SECRET` o'rnatilmagan bo'lsa endpoint 401 qaytaradi va
hech kimga xabar ketmaydi.

Kimga xabar ketishini **yubormasdan** ko'rish:

```bash
curl -H "authorization: Bearer $CRON_SECRET" \
  "https://zenfit-backend.vercel.app/api/cron/reminders?dry=1"
```

Eslatma turi profil sozlamalaridan olinadi (ovqat / mashq / suv) va o'sha kuni
allaqachon belgilagan foydalanuvchiga xabar bormaydi.

---

## Nima ishlamaydi (kutilgan holat)

- **To'lov** — `/api/payment/checkout` va `/api/payment/cards/bind` merchant
  sozlanmaguncha 503 qaytaradi. Payme/Click webhook'lari imzoni tekshiradi,
  lekin tranzaksiya holat mashinasi hali yozilmagan. Karta biriktirish
  provayder sahifasida bo'ladi — karta raqami hech qachon backendga kelmaydi.
- **Mashqlar matni** — mashq nomlari, qadamlar va xatolar hozircha faqat
  o'zbek tilida. Ilova interfeysi o'zbek/rus tilida ishlaydi.
