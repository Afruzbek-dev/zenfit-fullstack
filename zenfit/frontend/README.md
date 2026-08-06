# ZenFit — Telegram Mini App

React + Vite bilan qurilgan, Telegram WebApp SDK'ga ulangan versiya. Hech qanday
native ilova build qilish, App Store/Play Market tekshiruvi kerak emas — botni
ochish bilanoq ishlaydi.

## 1. Lokal ishga tushirish

```bash
npm install
npm run dev
```

Brauzerda ochiladi (Telegram'siz ham ishlaydi — `src/telegram.js` ichidagi
barcha chaqiruvlar `window.Telegram` yo'q bo'lsa avtomatik no-op bo'ladi).

## 2. Bot yaratish (@BotFather)

1. Telegram'da [@BotFather](https://t.me/BotFather) bilan suhbat oching
2. `/newbot` → nom va username bering (masalan `zenfit_bot`)
3. Bot yaratilgach, `/mybots` → botingizni tanlang → **Bot Settings** →
   **Menu Button** → **Configure Menu Button**
4. So'ralganda ilova URL'ini kiriting (4-bosqichda deploy qilingandan keyin,
   masalan `https://zenfit.vercel.app`)
5. Tugma nomi sifatida masalan `🥗 ZenFit ochish` deb yozing

Ilovani `/newapp` orqali to'liq Mini App sifatida ham ro'yxatdan o'tkazish
mumkin (bosh ekranga alohida ikonka bilan chiqadi) — bu ixtiyoriy, Menu
Button bilan boshlash eng tezkor yo'l.

## 3. Build

```bash
npm run build
```

`dist/` papkasi hosil bo'ladi — shu papkani istalgan statik hosting'ga
joylashtirasiz.

## 4. Deploy (HTTPS shart — Telegram buni talab qiladi)

Eng tez variantlar:
- **Vercel**: `vercel deploy` yoki GitHub repo'ni ulab avtomatik deploy
- **Netlify**: `dist/` papkasini drag-and-drop qilish yoki CLI orqali
- **Cloudflare Pages**: GitHub repo ulab avtomatik build

Deploy bo'lgan URL'ni 2-bosqichdagi Menu Button sozlamasiga qo'ying.

## Telegram integratsiyasi qayerda ishlaydi

`src/telegram.js` — barcha Telegram WebApp SDK chaqiruvlari shu yerda,
xavfsiz o'ralgan holda (brauzerda ham, Telegram'da ham ishlaydi):

- **Foydalanuvchi ismi** — `getTelegramUser()` orqali `initDataUnsafe.user`
  dan olinadi, alohida ro'yxatdan o'tish/kirish ekrani kerak emas
- **Tema** — ilova ochilganda Telegram'ning o'z темasini (`colorScheme`)
  oladi, keyin top bar/Profile'dagi tugma bilan qo'lda almashtirish mumkin
- **BackButton** — ichki ekranlar (Program/Session/Scan/Progress) ochilganda
  Telegram'ning tabiiy orqaga tugmasi ko'rinadi va ishlaydi
- **Haptic feedback** — tab almashtirish, ovqat qo'shish, dastur tanlash,
  mashqni yakunlash kabi harakatlarda vibratsiya (faqat mobil Telegram'da
  sezilarli)
- **Header/background rang** — темага mos ravishda Telegram'ning o'z
  interfeys ranglari ham sinxronlanadi (`setHeaderColor`/`setBackgroundColor`)

## Muhim: production uchun xavfsizlik

`getTelegramUser()` `initDataUnsafe`dan foydalanadi — bu **faqat ko'rsatish
uchun** ishonchli (ism, avatar). Agar backend qo'shsangiz (masalan
foydalanuvchi ma'lumotlarini serverga saqlash), backend tomonda
`window.Telegram.WebApp.initData` qatorini bot tokeningiz bilan
HMAC-SHA256 orqali tekshirishingiz shart — aks holda istalgan odam o'zini
boshqa foydalanuvchi sifatida ko'rsatishi mumkin. Tafsilotlar:
https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

## Struktura

```
index.html          — telegram-web-app.js SDK shu yerda ulanadi
src/
  main.jsx           — React entry point
  telegram.js         — Telegram WebApp SDK'ning xavfsiz wrapper'i
  App.jsx             — barcha ekranlar (Home, Workouts, Recipes, Profile,
                         Program/Session/Scan/Progress) + Telegram bilan
                         ulangan App shell
```

## Keyingi qadam (native ilovaga o'tish)

Agar kelajakda foydalanuvchilar soni o'sib, native ilova kerak bo'lsa —
`zenfit_flutter/` papkasidagi Flutter loyihasi xuddi shu ekran va
funksiyalarni allaqachon takrorlaydi. Backend (agar qo'shilsa) ikkalasiga
ham умumiy bo'ladi.
