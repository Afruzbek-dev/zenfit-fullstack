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
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string (URI, **Session pooler**), `[YOUR-PASSWORD]` o'rniga parol |
| `BOT_TOKEN` | @BotFather'dan (lokal `.env` da bor) |
| `JWT_SECRET` | lokal `.env` dagi qiymat |
| `ADMIN_SECRET` | lokal `.env` dagi qiymat (64 belgi) |
| `TELEGRAM_WEBHOOK_SECRET` | lokal `.env` dagi qiymat (48 belgi) |
| `ANTHROPIC_API_KEY` | console.anthropic.com dan |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` |
| `USE_TELEGRAM_WEBHOOK` | `1` |
| `ALLOW_DEV_LOGIN` | `0` ← **production'da albatta 0** |
| `MINI_APP_URL` | hozircha bo'sh qoldiring, 3-bosqichda to'ldiriladi |
| `CORS_ORIGIN` | hozircha bo'sh qoldiring, 3-bosqichda to'ldiriladi |

Deploy qiling va tekshiring:

```bash
curl https://zenfit-backend.vercel.app/api/health
```

`{"ok":true,"db":"postgres","ai":true}` chiqishi kerak.
`"db":"sqlite"` chiqsa — `DATABASE_URL` o'qilmayapti.
`"ai":false` chiqsa — `ANTHROPIC_API_KEY` yo'q yoki placeholder.

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

## Nima ishlamaydi (kutilgan holat)

- **To'lov** — `/api/payment/checkout` merchant sozlanmaguncha 503 qaytaradi.
  Payme/Click webhook'lari imzoni tekshiradi, lekin tranzaksiya holat mashinasi
  hali yozilmagan.
- **Mashq videolari** — `youtubeId` hali `null`, tugma YouTube qidiruvini
  ochadi.
