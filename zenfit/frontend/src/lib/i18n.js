/**
 * Translations.
 *
 * Uzbek is the source language and the fallback: a missing Russian key falls
 * back to Uzbek rather than showing the raw key, so a gap degrades to a real
 * sentence. Look-ups take a dotted path — t("profile.healthData").
 *
 * Coverage: navigation, home, activity logging, the workout flow, the whole
 * profile area and premium/payment are translated into all three languages,
 * and every exercise's name, steps and mistakes live in data/exerciseText.js.
 * Onboarding, scan, recipes, chat and progress still render Uzbek strings and
 * are the next batch to move over.
 */

import en from "./i18n.en.js";

export const LANGUAGES = [
  { id: "uz", label: "O'zbekcha", native: "O'zbek" },
  { id: "ru", label: "Ruscha", native: "Русский" },
  { id: "en", label: "Inglizcha", native: "English" },
];

const uz = {
  common: {
    save: "Saqlash", cancel: "Bekor qilish", close: "Yopish", back: "Orqaga",
    delete: "O'chirish", edit: "Tahrirlash", add: "Qo'shish", done: "Tayyor",
    loading: "Yuklanmoqda…", error: "Xatolik", retry: "Qayta urinish",
    saved: "Saqlandi", deleted: "O'chirildi", soon: "Tez orada",
    min: "daq", kcal: "kkal", kg: "kg", km: "km", cm: "sm", none: "Yo'q",
    on: "Yoqilgan", off: "O'chirilgan", optional: "ixtiyoriy",
  },
  nav: { home: "Bosh", workouts: "Mashq", scan: "Skan", trainer: "Trener", profile: "Profil" },

  home: {
    morning: "Xayrli tong", day: "Xayrli kun", evening: "Xayrli kech", night: "Xayrli tun",
    remaining: "kkal qoldi", over: "ortiqcha", eaten: "Yeyildi", target: "Me'yor", burned: "Sarflandi",
    protein: "Oqsil", carbs: "Uglevod", fat: "Yog'",
    water: "Suv", todayStatus: "Bugungi holat", meals: "Ovqat", workouts: "Mashq", streak: "Streak",
    todayMeals: "Bugungi ovqatlar", addMeal: "+ Qo'shish",
    noMeals: "Hali ovqat qo'shilmagan", noMealsDesc: "Taom rasmini skanerlang yoki retseptlardan tanlang.",
    scanWithAi: "AI bilan skanerlash",
    qaScan: "AI Skan", qaRecipes: "Retseptlar", qaProgress: "Progress", qaTrainer: "AI Trener", qaActivity: "Faollik",
    planNudge: "AI mashq rejasini tuzing", planNudgeDesc: "Vazningizga mos kg'lar bilan haftalik reja",
    days: "kun", ta: "ta",
  },

  activity: {
    title: "Faollik", subtitle: "Yugurish, piyoda yurish va boshqa mashqlar",
    logTitle: "Faollikni belgilash", pick: "Mashq turini tanlang",
    duration: "Davomiylik", distance: "Masofa", intensity: "Zichlik",
    light: "Yengil", moderate: "O'rtacha", vigorous: "Jadal",
    note: "Izoh", notePlaceholder: "Masalan: park bo'ylab",
    customName: "Mashq nomi", customPlaceholder: "Masalan: stol tennisi",
    save: "Faollikni saqlash", saved: "Faollik qo'shildi",
    todayTitle: "Bugungi faollik", empty: "Bugun faollik belgilanmagan",
    emptyDesc: "Yugurdingizmi yoki piyoda yurdingizmi? Shu yerda belgilab qo'ying.",
    burned: "sarflandi", estimate: "Taxminan",
    names: {
      walking: "Piyoda yurish", running: "Yugurish", cycling: "Velosiped", swimming: "Suzish",
      "jump-rope": "Arg'amchi", hiit: "HIIT", football: "Futbol", basketball: "Basketbol",
      tennis: "Tennis", volleyball: "Voleybol", boxing: "Boks", dancing: "Raqs",
      yoga: "Yoga", stretching: "Cho'zilish", stairs: "Zinapoya", hiking: "Tog' yurish",
      gym: "Zalda mashq", custom: "Boshqa",
    },
  },

  equipment: {
    any: "Har qanday jihoz", gym: "Sport zali", "home-dumbbell": "Gantel", "home-none": "Jihozsiz", outdoor: "Ochiq havo",
  },
  muscleGroups: {
    all: "Barchasi", squat: "Oyoq", pushH: "Ko'krak", pullH: "Orqa", pushV: "Yelka", biceps: "Qo'l", core: "Qorin",
  },

  workout: {
    set: "Set", sets: "set", reps: "takror", weight: "og'irlik",
    rest: "Dam olish", restNow: "Dam oling", restDone: "Dam tugadi", skipRest: "O'tkazib yuborish", addTime: "+15s",
    target: "Maqsad", setsTitle: "Setlar", guideDesc: "Video va bajarish texnikasi",
    startSet: "Setni boshlash", setDone: "Set bajarildi", finish: "Mashqni yakunlash",
    dayProgress: "Kunlik progress", dayDone: "Kun yakunlandi 🎉",
    lastTime: "O'tgan safar", progressed: "Og'irlik oshirildi",
    bodyweight: "tana vazni", lightWeight: "yengil vazn",
    addSet: "Set qo'shish", removeSet: "Set kamaytirish",
    guide: "Ko'rsatma", howTo: "Bajarish tartibi", mistakes: "Tez uchraydigan xatolar",
    video: "Video ko'rsatma", videoMissing: "Bu mashq uchun video hali qo'shilmagan",
    openYoutube: "YouTube'da ochish", muscles: "Ishlaydigan mushaklar", equipment: "Jihoz",
    allDone: "Barcha setlar bajarildi", ofSets: "dan", restBetween: "Setlar orasida",
    exerciseDone: "Mashq yakunlandi 💪", saveFailed: "Saqlab bo'lmadi",
    tapSetToStart: "Setni bosib boshlang va bajargach belgilang",
  },

  profile: {
    title: "Profil", hello: "Salom", user: "Foydalanuvchi",
    age: "Yosh", height: "Bo'y", weight: "Vazn", streak: "Streak",
    editProfile: "Profilni tahrirlash", editProfileDesc: "Ism, rasm va tana ko'rsatkichlari",
    health: "Salomatlik ma'lumotlari", healthDesc: "Maqsad, rejalar va BMI",
    billing: "Karta va to'lovlar", billingDesc: "Kartalar va xaridlar tarixi",
    settings: "Ilova sozlamalari", settingsDesc: "Til, mavzu va bildirishnomalar",
    help: "Yordam", helpDesc: "Ko'p so'raladigan savollar",
    about: "Biz haqimizda", aboutDesc: "ZenFit haqida",
    offer: "Ommaviy oferta", offerDesc: "Foydalanish shartlari",
    logout: "Hisobdan chiqish", logoutConfirm: "Hisobdan chiqasizmi?",
    premium: "ZenFit Premium", premiumDesc: "Cheksiz AI skaner va AI trener",
    dailyTarget: "Kunlik me'yor",

    name: "Ism", namePlaceholder: "Ismingiz", gender: "Jins", male: "Erkak", female: "Ayol",
    photo: "Profil rasmi", changePhoto: "Rasmni o'zgartirish", removePhoto: "Rasmni olib tashlash",
    photoHint: "Kvadrat rasm eng yaxshi ko'rinadi",
    bodyMetrics: "Tana ko'rsatkichlari", activityLevel: "Kunlik faollik",
    activityLevels: {
      sedentary: "Deyarli harakatsiz", light: "Yengil faol", moderate: "O'rtacha faol",
      active: "Faol", very_active: "Juda faol",
    },
    targetsRecalc: "Me'yorlar qayta hisoblandi",

    goal: "Maqsad", goals: { lose: "Ozish", maintain: "Vaznni saqlash", gain: "Massa yig'ish" },
    level: "Tayyorgarlik darajasi",
    levels: { beginner: "Yangi boshlovchi", intermediate: "O'rta daraja", advanced: "Tajribali" },
    bmi: "Tana massa indeksi (BMI)",
    bmiCats: { under: "Vazn yetishmaydi", normal: "Me'yorda", over: "Ortiqcha vazn", obese: "Semizlik" },
    bmiHint: "BMI umumiy ko'rsatkich — mushak massasi yuqori bo'lsa yuqori chiqishi mumkin.",
    activePlans: "Faol rejalar", workoutPlan: "Mashq rejasi", dietPlan: "Ovqatlanish rejasi",
    noPlan: "Reja tuzilmagan", createPlan: "Reja tuzish",
    injuries: "Jarohat / cheklov", waterTarget: "Suv me'yori",

    cards: "Kartalar", addCard: "Karta qo'shish",
    cardsEmpty: "Karta biriktirilmagan",
    cardsEmptyDesc: "Karta to'lov provayderining xavfsiz sahifasida biriktiriladi — karta raqami ilovaga kiritilmaydi.",
    cardsSecurity: "Xavfsizlik uchun karta raqami ZenFit'da saqlanmaydi. Faqat oxirgi 4 raqam va provayder tokeni ko'rinadi.",
    purchases: "Xaridlar tarixi", purchasesEmpty: "Hali xarid qilinmagan",
    purchasesEmptyDesc: "Premium sotib olsangiz, cheklar shu yerda saqlanadi.",
    statusPaid: "To'landi", statusPending: "Kutilmoqda", statusFailed: "Bekor qilindi",
    subscription: "Obuna", freePlan: "Bepul reja", expires: "Amal qiladi",

    language: "Til", theme: "Mavzu",
    themes: { dark: "Qorong'i", light: "Yorug'", system: "Tizim bo'yicha" },
    notifications: "Bildirishnomalar",
    notifWorkout: "Mashq eslatmasi", notifWorkoutDesc: "Mashq kunlarida eslatib turadi",
    notifMeal: "Ovqat eslatmasi", notifMealDesc: "Ovqatni belgilashni unutmaslik uchun",
    notifWater: "Suv eslatmasi", notifWaterDesc: "Kun davomida suv ichishni eslatadi",
    notifTips: "Maslahat va yangiliklar", notifTipsDesc: "Haftalik maslahatlar va yangi imkoniyatlar",
    notifHint: "Bildirishnomalar Telegram bot orqali yuboriladi.",
    version: "Versiya",
  },

  premium: {
    choosePlan: "Rejani tanlang", payByCard: "Karta orqali to'lash", payTitle: "To'lov",
    card: "Karta", copyCard: "Karta raqamini nusxalash", copied: "Nusxalandi ✓",
    step1: "Yuqoridagi kartaga ko'rsatilgan summani o'tkazing.",
    step2: "To'lov chekining rasmini oling yoki skrinshot qiling.",
    step3: "Pastdagi tugma orqali chekni yuboring — admin tekshirib tasdiqlaydi.",
    sendReceipt: "Chek rasmini yuborish",
    sentTitle: "Chek yuborildi!",
    sentDesc: "Admin tekshirgach premium avtomatik faollashadi va sizga Telegram orqali xabar keladi. Odatda bu 1-2 soat ichida bo'ladi.",
    manualHint: "To'lov karta orqali amalga oshiriladi. Karta ma'lumotlaringiz ilovaga kiritilmaydi.",
    notReady: "To'lov hali sozlanmagan. Iltimos, keyinroq urinib ko'ring.",
    features: {
      unlimitedScan: { title: "Cheksiz AI skaner", desc: "Taom rasmini istagancha skanerlang" },
      unlimitedTrainer: { title: "Cheksiz AI trener", desc: "Suhbat limitisiz, istalgan vaqtda savol bering" },
      allPrograms: { title: "Barcha trener dasturlari", desc: "Top murabbiylarning tayyor rejalari" },
      analytics: { title: "Kengaytirilgan tahlil", desc: "Oylik progress va batafsil hisobotlar" },
      noAds: { title: "Reklamasiz tajriba", desc: "Yangi imkoniyatlardan birinchi bo'lib foydalanish" },
    },
  },

  help: {
    title: "Yordam",
    contact: "Savolingiz bormi?", contactDesc: "Telegram orqali bizga yozing",
    faq: [
      { q: "AI skaner qanday ishlaydi?", a: "Taom rasmini yuklaysiz, AI uni tanib, taxminiy kaloriya va makronutrientlarni hisoblab beradi. Bu taxminiy hisob — aniq o'lchov uchun tarozidan foydalaning." },
      { q: "Kaloriya me'yori qanday hisoblanadi?", a: "Mifflin-St Jeor formulasi bo'yicha: jins, yosh, bo'y, vazn va kunlik faollik darajangizdan asosiy almashinuv hisoblanadi, keyin maqsadingizga qarab defitsit yoki profitsit qo'shiladi." },
      { q: "Mashq og'irliklari qayerdan olinadi?", a: "Boshlang'ich og'irlik tana vazningiz va tajriba darajangizga qarab hisoblanadi, xavfsizlik uchun 0.8 koeffitsient qo'llanadi. Keyin har safar bajargan setlaringizga qarab asta oshib boradi." },
      { q: "Ma'lumotlarim xavfsizmi?", a: "Ma'lumotlaringiz shifrlangan ulanish orqali saqlanadi. Karta raqami ZenFit serverida umuman saqlanmaydi — to'lov provayderining xavfsiz sahifasida amalga oshiriladi." },
      { q: "Premium'ni qanday bekor qilaman?", a: "Obuna muddati tugaguncha amal qiladi va avtomatik uzaytirilmaydi. Savol bo'lsa qo'llab-quvvatlash xizmatiga yozing." },
    ],
  },

  about: {
    title: "Biz haqimizda",
    tagline: "Ovqatlanish va mashqni bitta AI orqali boshqaradigan shaxsiy hamroh.",
    body: "ZenFit — O'zbekistondagi foydalanuvchilar uchun yaratilgan sog'lom turmush tarzi ilovasi. Maqsadimiz — murabbiy va nutritsiolog xizmatini har kimga tushunarli va arzon qilish.",
    whatWeDo: "Nima qilamiz",
    features: [
      "Taom rasmidan kaloriya va makronutrientlarni aniqlash",
      "Tana ko'rsatkichlaringizga moslangan mashq va ovqatlanish rejasi",
      "Har bir mashq uchun video ko'rsatma va to'g'ri texnika",
      "Kun davomida savolga javob beradigan AI trener",
    ],
    contact: "Bog'lanish", telegram: "Telegram", version: "Versiya",
  },

  offer: {
    title: "Ommaviy oferta",
    intro: "Ushbu hujjat ZenFit ilovasidan foydalanish shartlarini belgilaydi. Ilovadan foydalanish orqali siz quyidagi shartlarga rozilik bildirasiz.",
    sections: [
      { h: "1. Xizmat haqida", p: "ZenFit — ovqatlanish va jismoniy mashqlarni kuzatish uchun mo'ljallangan axborot xizmati. Ilova tibbiy xizmat ko'rsatmaydi va tibbiy tashxis qo'ymaydi." },
      { h: "2. Tibbiy ogohlantirish", p: "Ilovadagi kaloriya me'yorlari, mashq rejalari va AI trener maslahatlari umumiy tavsiya xarakteriga ega. Surunkali kasallik, homiladorlik yoki jarohat holatida mashq va parhezni boshlashdan oldin shifokor bilan maslahatlashing." },
      { h: "3. Obuna va to'lov", p: "Premium obuna tanlangan muddatga beriladi va avtomatik uzaytirilmaydi. To'lov litsenziyalangan to'lov provayderlari (Payme, Click) orqali amalga oshiriladi. Karta ma'lumotlari ZenFit serverlarida saqlanmaydi." },
      { h: "4. Pulni qaytarish", p: "Obuna faollashtirilgandan so'ng 3 kun ichida xizmatdan foydalanilmagan bo'lsa, to'lovni qaytarish uchun qo'llab-quvvatlash xizmatiga murojaat qilishingiz mumkin." },
      { h: "5. Ma'lumotlar", p: "Kiritilgan ma'lumotlar faqat xizmatni ko'rsatish uchun ishlatiladi va uchinchi shaxslarga sotilmaydi. Hisobni o'chirishni so'rasangiz, ma'lumotlaringiz o'chiriladi." },
      { h: "6. Javobgarlik", p: "Foydalanuvchi kiritgan ma'lumotlarning to'g'riligi va mashqlarni bajarish xavfsizligi uchun javobgardir. ZenFit noto'g'ri kiritilgan ma'lumotlar natijasida yuzaga kelgan oqibatlar uchun javob bermaydi." },
    ],
    updated: "Oxirgi yangilanish",
  },
};

const ru = {
  common: {
    save: "Сохранить", cancel: "Отмена", close: "Закрыть", back: "Назад",
    delete: "Удалить", edit: "Изменить", add: "Добавить", done: "Готово",
    loading: "Загрузка…", error: "Ошибка", retry: "Повторить",
    saved: "Сохранено", deleted: "Удалено", soon: "Скоро",
    min: "мин", kcal: "ккал", kg: "кг", km: "км", cm: "см", none: "Нет",
    on: "Включено", off: "Выключено", optional: "необязательно",
  },
  nav: { home: "Главная", workouts: "Тренировки", scan: "Скан", trainer: "Тренер", profile: "Профиль" },

  home: {
    morning: "Доброе утро", day: "Добрый день", evening: "Добрый вечер", night: "Доброй ночи",
    remaining: "ккал осталось", over: "превышение", eaten: "Съедено", target: "Норма", burned: "Сожжено",
    protein: "Белки", carbs: "Углеводы", fat: "Жиры",
    water: "Вода", todayStatus: "Сегодня", meals: "Приёмы", workouts: "Тренировки", streak: "Серия",
    todayMeals: "Приёмы пищи сегодня", addMeal: "+ Добавить",
    noMeals: "Пока ничего не добавлено", noMealsDesc: "Отсканируйте блюдо или выберите из рецептов.",
    scanWithAi: "Сканировать с AI",
    qaScan: "AI Скан", qaRecipes: "Рецепты", qaProgress: "Прогресс", qaTrainer: "AI Тренер", qaActivity: "Активность",
    planNudge: "Составьте план тренировок", planNudgeDesc: "Недельный план с весами под вас",
    days: "дн", ta: "шт",
  },

  activity: {
    title: "Активность", subtitle: "Бег, ходьба и другие занятия",
    logTitle: "Отметить активность", pick: "Выберите вид активности",
    duration: "Длительность", distance: "Дистанция", intensity: "Интенсивность",
    light: "Лёгкая", moderate: "Средняя", vigorous: "Высокая",
    note: "Заметка", notePlaceholder: "Например: в парке",
    customName: "Название", customPlaceholder: "Например: настольный теннис",
    save: "Сохранить активность", saved: "Активность добавлена",
    todayTitle: "Активность сегодня", empty: "Сегодня активность не отмечена",
    emptyDesc: "Бегали или гуляли? Отметьте это здесь.",
    burned: "сожжено", estimate: "Примерно",
    names: {
      walking: "Ходьба", running: "Бег", cycling: "Велосипед", swimming: "Плавание",
      "jump-rope": "Скакалка", hiit: "HIIT", football: "Футбол", basketball: "Баскетбол",
      tennis: "Теннис", volleyball: "Волейбол", boxing: "Бокс", dancing: "Танцы",
      yoga: "Йога", stretching: "Растяжка", stairs: "Лестница", hiking: "Хайкинг",
      gym: "Зал", custom: "Другое",
    },
  },

  equipment: {
    any: "Любое оборудование", gym: "Спортзал", "home-dumbbell": "Гантели", "home-none": "Без оборудования", outdoor: "На улице",
  },
  muscleGroups: {
    all: "Все", squat: "Ноги", pushH: "Грудь", pullH: "Спина", pushV: "Плечи", biceps: "Руки", core: "Пресс",
  },

  workout: {
    set: "Подход", sets: "подх.", reps: "повт.", weight: "вес",
    rest: "Отдых", restNow: "Отдыхайте", restDone: "Отдых окончен", skipRest: "Пропустить", addTime: "+15с",
    target: "Цель", setsTitle: "Подходы", guideDesc: "Видео и техника выполнения",
    startSet: "Начать подход", setDone: "Подход выполнен", finish: "Завершить упражнение",
    dayProgress: "Прогресс дня", dayDone: "День завершён 🎉",
    lastTime: "В прошлый раз", progressed: "Вес увеличен",
    bodyweight: "свой вес", lightWeight: "лёгкий вес",
    addSet: "Добавить подход", removeSet: "Убрать подход",
    guide: "Инструкция", howTo: "Как выполнять", mistakes: "Частые ошибки",
    video: "Видео-инструкция", videoMissing: "Видео для этого упражнения пока не добавлено",
    openYoutube: "Открыть в YouTube", muscles: "Работающие мышцы", equipment: "Оборудование",
    allDone: "Все подходы выполнены", ofSets: "из", restBetween: "Между подходами",
    exerciseDone: "Упражнение завершено 💪", saveFailed: "Не удалось сохранить",
    tapSetToStart: "Нажмите на подход, чтобы начать, и отметьте после выполнения",
  },

  profile: {
    title: "Профиль", hello: "Привет", user: "Пользователь",
    age: "Возраст", height: "Рост", weight: "Вес", streak: "Серия",
    editProfile: "Редактировать профиль", editProfileDesc: "Имя, фото и параметры тела",
    health: "Данные о здоровье", healthDesc: "Цель, планы и ИМТ",
    billing: "Карты и платежи", billingDesc: "Карты и история покупок",
    settings: "Настройки приложения", settingsDesc: "Язык, тема и уведомления",
    help: "Помощь", helpDesc: "Частые вопросы",
    about: "О нас", aboutDesc: "О ZenFit",
    offer: "Публичная оферта", offerDesc: "Условия использования",
    logout: "Выйти из аккаунта", logoutConfirm: "Выйти из аккаунта?",
    premium: "ZenFit Premium", premiumDesc: "Безлимитный AI сканер и тренер",
    dailyTarget: "Дневная норма",

    name: "Имя", namePlaceholder: "Ваше имя", gender: "Пол", male: "Мужской", female: "Женский",
    photo: "Фото профиля", changePhoto: "Изменить фото", removePhoto: "Удалить фото",
    photoHint: "Лучше всего смотрится квадратное фото",
    bodyMetrics: "Параметры тела", activityLevel: "Дневная активность",
    activityLevels: {
      sedentary: "Малоподвижный", light: "Лёгкая активность", moderate: "Средняя активность",
      active: "Активный", very_active: "Очень активный",
    },
    targetsRecalc: "Нормы пересчитаны",

    goal: "Цель", goals: { lose: "Похудение", maintain: "Поддержание веса", gain: "Набор массы" },
    level: "Уровень подготовки",
    levels: { beginner: "Новичок", intermediate: "Средний", advanced: "Продвинутый" },
    bmi: "Индекс массы тела (ИМТ)",
    bmiCats: { under: "Недостаток веса", normal: "Норма", over: "Избыточный вес", obese: "Ожирение" },
    bmiHint: "ИМТ — общий показатель: при большой мышечной массе он может быть завышен.",
    activePlans: "Активные планы", workoutPlan: "План тренировок", dietPlan: "План питания",
    noPlan: "План не составлен", createPlan: "Составить план",
    injuries: "Травмы / ограничения", waterTarget: "Норма воды",

    cards: "Карты", addCard: "Добавить карту",
    cardsEmpty: "Карта не привязана",
    cardsEmptyDesc: "Карта привязывается на защищённой странице платёжного провайдера — номер карты в приложение не вводится.",
    cardsSecurity: "В целях безопасности номер карты не хранится в ZenFit. Видны только последние 4 цифры и токен провайдера.",
    purchases: "История покупок", purchasesEmpty: "Покупок пока нет",
    purchasesEmptyDesc: "После покупки Premium чеки будут храниться здесь.",
    statusPaid: "Оплачено", statusPending: "В обработке", statusFailed: "Отменено",
    subscription: "Подписка", freePlan: "Бесплатный план", expires: "Действует до",

    language: "Язык", theme: "Тема",
    themes: { dark: "Тёмная", light: "Светлая", system: "Как в системе" },
    notifications: "Уведомления",
    notifWorkout: "Напоминание о тренировке", notifWorkoutDesc: "Напомним в дни тренировок",
    notifMeal: "Напоминание о еде", notifMealDesc: "Чтобы не забыть отметить приём пищи",
    notifWater: "Напоминание о воде", notifWaterDesc: "Напомним пить воду в течение дня",
    notifTips: "Советы и новости", notifTipsDesc: "Еженедельные советы и новые возможности",
    notifHint: "Уведомления приходят через Telegram-бота.",
    version: "Версия",
  },

  premium: {
    choosePlan: "Выберите план", payByCard: "Оплатить картой", payTitle: "Оплата",
    card: "Карта", copyCard: "Скопировать номер карты", copied: "Скопировано ✓",
    step1: "Переведите указанную сумму на карту выше.",
    step2: "Сфотографируйте чек или сделайте скриншот.",
    step3: "Отправьте чек кнопкой ниже — администратор проверит и подтвердит.",
    sendReceipt: "Отправить чек",
    sentTitle: "Чек отправлен!",
    sentDesc: "После проверки премиум активируется автоматически, и вы получите уведомление в Telegram. Обычно это занимает 1–2 часа.",
    manualHint: "Оплата проходит переводом на карту. Данные вашей карты в приложение не вводятся.",
    notReady: "Оплата пока не настроена. Попробуйте позже.",
    features: {
      unlimitedScan: { title: "Безлимитный AI сканер", desc: "Сканируйте блюда без ограничений" },
      unlimitedTrainer: { title: "Безлимитный AI тренер", desc: "Задавайте вопросы в любое время без лимита" },
      allPrograms: { title: "Все программы тренировок", desc: "Готовые планы от топовых тренеров" },
      analytics: { title: "Расширенная аналитика", desc: "Месячный прогресс и подробные отчёты" },
      noAds: { title: "Без рекламы", desc: "Новые возможности раньше всех" },
    },
  },

  help: {
    title: "Помощь",
    contact: "Остались вопросы?", contactDesc: "Напишите нам в Telegram",
    faq: [
      { q: "Как работает AI сканер?", a: "Вы загружаете фото блюда, AI распознаёт его и оценивает калории и макронутриенты. Это оценка — для точности используйте весы." },
      { q: "Как рассчитывается норма калорий?", a: "По формуле Миффлина-Сан Жеора: из пола, возраста, роста, веса и уровня активности считается базовый обмен, затем добавляется дефицит или профицит под вашу цель." },
      { q: "Откуда берутся рабочие веса?", a: "Стартовый вес рассчитывается от вашей массы тела и уровня подготовки с коэффициентом безопасности 0.8. Дальше он растёт постепенно по вашим выполненным подходам." },
      { q: "Мои данные в безопасности?", a: "Данные передаются по защищённому соединению. Номер карты вообще не хранится на серверах ZenFit — оплата проходит на странице платёжного провайдера." },
      { q: "Как отменить Premium?", a: "Подписка действует до конца оплаченного срока и не продлевается автоматически. По вопросам напишите в поддержку." },
    ],
  },

  about: {
    title: "О нас",
    tagline: "Персональный помощник, который ведёт питание и тренировки через один AI.",
    body: "ZenFit — приложение для здорового образа жизни, созданное для пользователей в Узбекистане. Наша цель — сделать помощь тренера и нутрициолога понятной и доступной каждому.",
    whatWeDo: "Что мы делаем",
    features: [
      "Определение калорий и макронутриентов по фото блюда",
      "План тренировок и питания под ваши параметры",
      "Видео-инструкция и правильная техника для каждого упражнения",
      "AI тренер, который отвечает на вопросы в течение дня",
    ],
    contact: "Связаться", telegram: "Telegram", version: "Версия",
  },

  offer: {
    title: "Публичная оферта",
    intro: "Настоящий документ определяет условия использования приложения ZenFit. Используя приложение, вы соглашаетесь с приведёнными ниже условиями.",
    sections: [
      { h: "1. О сервисе", p: "ZenFit — информационный сервис для учёта питания и физической активности. Приложение не оказывает медицинских услуг и не ставит диагнозов." },
      { h: "2. Медицинское предупреждение", p: "Нормы калорий, планы тренировок и советы AI тренера носят общий рекомендательный характер. При хронических заболеваниях, беременности или травмах проконсультируйтесь с врачом перед началом тренировок и диеты." },
      { h: "3. Подписка и оплата", p: "Premium-подписка предоставляется на выбранный срок и не продлевается автоматически. Оплата проходит через лицензированных провайдеров (Payme, Click). Данные карты не хранятся на серверах ZenFit." },
      { h: "4. Возврат средств", p: "Если в течение 3 дней после активации подписки сервис не использовался, вы можете обратиться в поддержку для возврата платежа." },
      { h: "5. Данные", p: "Введённые данные используются только для оказания услуги и не продаются третьим лицам. По запросу об удалении аккаунта ваши данные будут удалены." },
      { h: "6. Ответственность", p: "Пользователь несёт ответственность за достоверность введённых данных и безопасность выполнения упражнений. ZenFit не отвечает за последствия, вызванные некорректно введёнными данными." },
    ],
    updated: "Последнее обновление",
  },
};

export const DICTS = { uz, ru, en };

function lookup(dict, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), dict);
}

/** Returns a translator bound to a language, falling back to Uzbek. */
export function translator(lang) {
  const dict = DICTS[lang] || DICTS.uz;
  return (path, vars) => {
    const value = lookup(dict, path) ?? lookup(DICTS.uz, path);
    if (value == null) return path;
    if (typeof value !== "string" || !vars) return value;
    return value.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
  };
}

const KEY = "zenfit_lang";

export function storedLanguage() {
  try {
    const v = localStorage.getItem(KEY);
    if (DICTS[v]) return v;
  } catch {
    /* private mode */
  }
  // Telegram tells us the client language before the profile has loaded.
  const tgLang = typeof window !== "undefined" ? window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code : null;
  if (tgLang === "ru") return "ru";
  if (tgLang && tgLang.startsWith("en")) return "en";
  return "uz";
}

export function persistLanguage(lang) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* private mode */
  }
}
