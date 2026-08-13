/**
 * Translations.
 *
 * Uzbek is the source language and the fallback: a missing Russian key falls
 * back to Uzbek rather than showing the raw key, so a gap degrades to a real
 * sentence. Look-ups take a dotted path — t("profile.healthData").
 *
 * Every screen is covered in all three languages. Core strings live here,
 * the later screens (onboarding, scan, recipes, chat, progress) in
 * i18n.screens.js, and each exercise's name, steps and mistakes in
 * data/exerciseText.js.
 */

import en from "./i18n.en.js";
import * as screens from "./i18n.screens.js";

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
    min: "daq", kcal: "kkal", kg: "kg", km: "km", cm: "sm", g: "g", none: "Yo'q",
    on: "Yoqilgan", off: "O'chirilgan", optional: "ixtiyoriy", day: "kun",
    connectFailed: "Ulanib bo'lmadi", connectFailedDesc: "Serverga ulanishda muammo yuz berdi.",
  },
  nav: { home: "Bosh", workouts: "Mashq", scan: "Skan", trainer: "Trener", profile: "Profil" },

  home: {
    morning: "Xayrli tong", day: "Xayrli kun", evening: "Xayrli kech", night: "Xayrli tun",
    remaining: "kkal qoldi", over: "ortiqcha", eaten: "Yeyildi", target: "Me'yor", burned: "Sarflandi",
    protein: "Oqsil", carbs: "Uglevod", fat: "Yog'",
    water: "Suv", todayStatus: "Bugungi holat", meals: "Ovqat", workouts: "Mashq", streak: "Streak",
    todayMeals: "Bugungi ovqatlar", addMeal: "+ Qo'shish", recent: "Yana qo'shish",
    noMeals: "Hali ovqat qo'shilmagan", noMealsDesc: "Taom rasmini skanerlang yoki retseptlardan tanlang.",
    scanWithAi: "AI bilan skanerlash",
    qaScan: "AI Skan", qaRecipes: "Retseptlar", qaProgress: "Progress", qaTrainer: "AI Trener", qaActivity: "Faollik",
    planNudge: "AI mashq rejasini tuzing", planNudgeDesc: "Vazningizga mos kg'lar bilan haftalik reja",
    days: "kun", ta: "ta",
    burnCapped: "Belgilangan mashqlar {raw} kkal beradi, lekin kunlik hisobga {cap} kkal qo'shildi — bir kunlik chegara.",
    burnNotCredited: "Sarflangan kaloriya kunlik me'yorga qo'shilmaydi — me'yor faollik darajangizga qarab allaqachon hisoblangan.",
    neatTitle: "Kunlik faollik savolini yangiladik",
    neatDesc: "Endi u faqat mashqsiz kundalik hayotni bildiradi — mashqlar belgilaganingizda alohida qo'shiladi. Darajangizni bir tekshirib chiqing.",
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
  muscles: {
    // Side keys are prefixed because one of the muscle groups is itself called
    // "back" — muscles.back has to mean the lats, not the rear view.
    sideFront: "Old tomon", sideBack: "Orqa tomon",
    figure: "Tana sxemasi — mushakni tanlash uchun bosing",
    chest: "Ko'krak", shoulders: "Yelka", biceps: "Bitsep", abs: "Qorin",
    quads: "Oyoq (old)", neck: "Bo'yin", back: "Orqa", triceps: "Trisep",
    glutes: "Dumba, son orqasi", calves: "Boldir",
    picked: "{n}/{max} tanlandi",
    noneHint: "Hech narsa tanlanmasa — muvozanatli reja tuziladi",
    title: "Qaysi mushakka urg'u?",
    desc: "Tanlanganlari bo'yicha haftalik reja tuziladi. Bo'sh qoldirsangiz, barchasi teng ishlanadi.",
    editTitle: "Urg'u",
    balanced: "Muvozanatli",
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

    planTitle: "AI Shaxsiy Reja",
    title: "Mashqlar", subtitlePlan: "AI shaxsiy dasturingiz", subtitleNoPlan: "Rejangizni tanlang",
    library: "Mashqlar bazasi", libraryAll: "Barcha mashqlarni ko'rish",
    libraryDesc: "Bajarish texnikasi, xatolar va videolar",
    librarySubtitle: "{count} ta mashq — texnika va video bilan",
    searchPlaceholder: "Mashq qidirish…",
    nothingFound: "Hech narsa topilmadi", nothingFoundDesc: "Filtr yoki qidiruv so'zini o'zgartirib ko'ring.",
    addToToday: "Bugungi mashqqa qo'shish", technique: "bajarish texnikasi",
    noPlan: "Mashq rejangiz yo'q",
    noPlanDesc: "AI vazningiz, tajribangiz va jihozingizga qarab haftalik reja tuzib beradi — og'irliklar kg'da ko'rsatiladi.",
    noPlanDescLocked: "Shaxsiy AI reja Premium xususiyati. Pastdagi tayyor dasturlardan birini bepul tanlashingiz ham mumkin.",
    createPlan: "AI reja tuzish", planReady: "AI reja tayyor 🚀",
    readyPrograms: "Yoki tayyor dasturlar", programsSoon: "Tayyor dasturlar tez orada — hozircha AI reja tuzing",
    programMeta: "{days} kun/hafta • {weeks} hafta",
    active: "Faol", planMeta: "Haftasiga {days} kun • {reps} takror • {rest} dam",
    weeklySchedule: "Haftalik jadval", dayN: "{n}-kun",
    restDay: "Dam olish", restDayDesc: "Mushaklarni tiklash va dam olish",
    exercisesCount: "{total} ta mashq • {done}/{total} bajarildi",
    done: "Bajarildi", start: "Boshlash",
    cardioTitle: "Kardio tavsiyasi",
    cardioFreq: "Haftasiga {n} marta, {min} daqiqa",
    cardioNote: {
      lose: "Ozish uchun eng samarali qo'shimcha — kaloriya sarfini oshiradi.",
      maintain: "Yurak-qon tomir salomatligi uchun haftalik minimum.",
      gain: "Massa yig'ish davrida yengil tut — bu kuch mashqiga xalaqit bermasin.",
    },
    logCardio: "Faollikni belgilash",
    aiTips: "AI maslahat", getTips: "Reja bo'yicha AI maslahat olish",
    tipsFailed: "AI maslahat bera olmadi", progression: "Og'irlikni oshirish", warmup: "Isinish",
    regenerate: "Rejani qayta tuzish", regenerateCta: "Qayta tuzish",
    regenerateDesc: "Haftalik kun soni yoki jihozni o'zgartiring — reja darhol qayta hisoblanadi.",
    perWeek: "Haftasiga", equipmentLabel: "Jihoz", planRegenerated: "Yangi reja tuzildi",
    eqShort: { "home-none": "Jihozsiz", "home-dumbbell": "Gantel", gym: "Sport zali", outdoor: "Ochiq havo" },
    rulesNote: {
      lose: "Yuqori takror + mashqdan keyin 15-20 daqiqa kardio qo'shing.",
      maintain: "Muvozanatli hajm — texnikaga e'tibor bering.",
      gain: "Og'irlikni har hafta asta oshirib boring.",
      beginner: "Yengil vazndan boshlang — oxirgi 2-3 takror qiyin, lekin bajarilishi mumkin bo'lsin.",
    },
  },

  /*
   * Keyed by the codes the backend's assessGoalSafety() returns. The figures in
   * {braces} arrive with the code, so the thresholds live in one place — the
   * engine — and never have to be kept in step across three languages.
   */
  safety: {
    adjustedTitle: "Maqsad o'zgartirildi",
    adjustedDesc: "Xavfsizlik uchun «{goal}» rejimiga o'tkazdik.",
    reasons: {
      lose_blocked_pregnancy:
        "Homiladorlik yoki emizish davrida vazn kamaytirish tavsiya etilmaydi. Kunlik normangiz +{kcal} kkal bilan hisoblanadi. Aniq ko'rsatma uchun shifokoringiz bilan maslahatlashing.",
      lose_blocked_underweight:
        "Tana vazni indeksingiz {bmi} — bu me'yordan past ({minBmi} dan kam). Sizning bo'yingizda sog'lom vazn {minKg} kg dan boshlanadi, shuning uchun ozish rejasini yoqmaymiz. «Vaznni saqlash» yoki «Massa yig'ish» ni tanlang, yoki shifokorga murojaat qiling.",
      lose_blocked_minor:
        "{minAge} yoshgacha kaloriya cheklovini mustaqil belgilash tavsiya etilmaydi. Ovqatlanish va mashg'ulotlarni kuzatib borishingiz mumkin, lekin vazn kamaytirish kerak bo'lsa shifokor yoki nutritsiolog bilan maslahatlashing.",
    },
    advisories: {
      pregnancy_surplus_applied:
        "Homiladorlik uchun kunlik normaga +{kcal} kkal qo'shildi va oqsil {proteinPerKg} g/kg gacha oshirildi.",
      age_minor_estimate:
        "{minAge} yoshgacha bo'lganlar uchun hisob-kitob taxminiy — formula kattalar uchun ishlab chiqilgan. Ko'rsatkichlarni shifokor bilan tekshiring.",
      age_senior_caution:
        "{age} yoshdan keyin kaloriya va oqsil me'yorlari taxminiy bo'ladi. Yangi ovqatlanish yoki mashg'ulot rejasini boshlashdan oldin shifokor bilan maslahatlashing.",
    },
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
    premium: "ZenFit Premium", premiumDesc: "Cheksiz AI skaner va AI trener", premiumTrial: "Premium (sinov muddati)",
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

  recipes: {
    planTitle: "AI kunlik ovqat rejasi", planThinking: "AI reja tuzmoqda…",
    planDesc: "Me'yoringizga mos 4 mahal ovqat — milliy taomlar bilan",
    planLocked: "Premium'ni faollashtiring va shaxsiy ovqat rejasi oling",
    planFailed: "Reja tuzib bo'lmadi",
  },

  /*
   * Suitability score (lib/foodFit.js). The verdicts are phrased as advice, not
   * as a verdict on the food — "bu sizga to'g'ri kelmaydi" is about this person
   * on this day, and the reasons underneath always say why.
   */
  fit: {
    title: "Sizga mosligi",
    verdict: {
      good: "Bugungi me'yoringizga mos keladi",
      ok: "Mumkin, lekin porsiyaga e'tibor bering",
      warn: "Bugun bu tavsiya qilinmaydi",
    },
    reason: {
      fitsWell: "Qolgan kaloriyangizga bemalol sig'adi",
      bigShare: "Kunlik me'yoringizning katta qismini oladi",
      overBudget: "Kunlik me'yoringizdan oshirib yuboradi",
      highProtein: "Oqsilga boy — mushak uchun foydali",
      proteinGap: "Bugungi oqsil yetishmovchiligingizni to'ldiradi",
      lowProtein: "Kaloriyasi ko'p, lekin oqsili deyarli yo'q",
      highFat: "Yog'i ko'p — kunlik yog' me'yoringizni tez to'ldiradi",
      processed: "Qayta ishlangan mahsulot — tez-tez iste'mol qilish tavsiya etilmaydi",
      goodForGain: "Massa yig'ish maqsadingiz uchun yaxshi tanlov",
    },
  },

  /* "Mahsulotlarim" — what is in the kitchen, not what was eaten. */
  pantry: {
    title: "Mahsulotlarim",
    subtitle: "Uyingizda bor mahsulotlarni belgilang",
    desc: "Belgilangan mahsulotlardan AI kunlik ovqatlanish rejasi tuzadi",
    open: "Mahsulotlarni tanlash",
    empty: "Hali mahsulot belgilanmagan",
    emptyDesc: "Uyingizda bor mahsulotlarni belgilang — AI faqat shulardan reja tuzadi.",
    selected: "{n} ta belgilandi",
    clear: "Tozalash",
    save: "Saqlash",
    saved: "Mahsulotlar saqlandi ✓",
    searchPlaceholder: "Mahsulot qidirish…",
    generate: "Shu mahsulotlardan reja tuzish",
    generateDesc: "Faqat siz belgilagan mahsulotlardan 4 mahallik kun tuziladi",
    generating: "Reja tuzilmoqda…",
    limit: "Ko'pi bilan {n} ta mahsulot belgilash mumkin",
    missingTitle: "Yetishmayotgan mahsulotlar",
    missingDesc: "Reja to'liq bo'lishi uchun bularni qo'shsangiz yaxshi bo'lardi:",
    fromPantry: "Sizdagi mahsulotlardan",
  },

  /* Pre-made meal plans — the free counterpart to the AI one. */
  dietPreset: {
    section: "Tayyor ovqatlanish rejalari",
    desc: "Porsiyalar sizning kunlik me'yoringizga moslashtiriladi",
    use: "Shu rejani ochish",
    scaled: "Porsiyalar {kcal} kkal me'yoringizga moslandi",
    clamped: "Bu reja maqsadingizga to'liq mos emas — me'yoringizga yaqinrog'ini tanlang",
    slots: { breakfast: "Nonushta", lunch: "Tushlik", dinner: "Kechki ovqat", snack: "Gazak" },
    names: {
      "balanced-uz": "Muvozanatli o'zbek menyusi",
      "lose-lowcal": "Ozish uchun yengil menyu",
      "gain-mass": "Massa yig'ish menyusi",
      budget: "Tejamkor menyu",
      highprotein: "Oqsilga boy menyu",
    },
    descs: {
      "balanced-uz": "Suli, shurpa, tovuq va grechka — kundalik oddiy mahsulotlardan muvozanatli kun.",
      "lose-lowcal": "Tvorog, mastava va oq baliq — to'q tutadigan, lekin yengil kun.",
      "gain-mass": "Ko'p kaloriya va oqsil — mashqdan keyin tiklanish uchun.",
      budget: "Yasmiq, kartoshka, tuxum va qatiq — eng arzon mahsulotlardan to'liq kun.",
      highprotein: "Tuxum, tovuq, losos va tvorog — oqsil me'yorini bemalol yopadi.",
    },
  },

  premium: {
    choosePlan: "Rejani tanlang", payByCard: "Karta orqali to'lash", payTitle: "To'lov",
    card: "Karta", copyCard: "Karta raqamini nusxalash", copied: "Nusxalandi ✓",
    step1: "Yuqoridagi kartaga ko'rsatilgan summani o'tkazing.",
    step2: "To'lov chekining skrinshotini oling.",
    step3: "Pastdagi tugma orqali Telegramda adminimizga yuboring va skrinshotni ilova qiling.",
    sendReceipt: "Telegramda adminga yuborish",
    telegramMessage: "Assalomu alaykum! Men premium obunasi uchun to'lov amalga oshirdim. Reja: {plan} — {amount} so'm. Tasdiqlab bersangiz.",
    sentTitle: "Telegram ochildi",
    sentDesc: "U yerda chekning skrinshotini adminimizga yuboring. Admin tasdiqlagach, premium avtomatik faollashadi va sizga Telegram orqali xabar keladi. Odatda bu 1-2 soat ichida bo'ladi.",
    manualHint: "To'lov karta orqali amalga oshiriladi. Karta ma'lumotlaringiz ilovaga kiritilmaydi.",
    notReady: "To'lov hali sozlanmagan. Iltimos, keyinroq urinib ko'ring.",
    trialCtaTitle: "3 kunlik bepul sinab ko'ring",
    trialCtaDesc: "Karta shart emas. 3 kundan so'ng avtomatik yakunlanadi — xohlasangiz shu paytda davom ettirasiz.",
    trialStart: "Bepul sinovni boshlash",
    trialStartedTitle: "Sinov boshlandi!",
    trialStartedDesc: "3 kun davomida barcha premium imkoniyatlardan bepul foydalanasiz. Muddat tugagach, oddiy rejaga qaytasiz.",
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
    min: "мин", kcal: "ккал", kg: "кг", km: "км", cm: "см", g: "г", none: "Нет",
    on: "Включено", off: "Выключено", optional: "необязательно", day: "день",
    connectFailed: "Не удалось подключиться", connectFailedDesc: "Не получилось связаться с сервером.",
  },
  nav: { home: "Главная", workouts: "Тренировки", scan: "Скан", trainer: "Тренер", profile: "Профиль" },

  home: {
    morning: "Доброе утро", day: "Добрый день", evening: "Добрый вечер", night: "Доброй ночи",
    remaining: "ккал осталось", over: "превышение", eaten: "Съедено", target: "Норма", burned: "Сожжено",
    protein: "Белки", carbs: "Углеводы", fat: "Жиры",
    water: "Вода", todayStatus: "Сегодня", meals: "Приёмы", workouts: "Тренировки", streak: "Серия",
    todayMeals: "Приёмы пищи сегодня", addMeal: "+ Добавить", recent: "Добавить снова",
    noMeals: "Пока ничего не добавлено", noMealsDesc: "Отсканируйте блюдо или выберите из рецептов.",
    scanWithAi: "Сканировать с AI",
    qaScan: "AI Скан", qaRecipes: "Рецепты", qaProgress: "Прогресс", qaTrainer: "AI Тренер", qaActivity: "Активность",
    planNudge: "Составьте план тренировок", planNudgeDesc: "Недельный план с весами под вас",
    days: "дн", ta: "шт",
    burnCapped: "Отмеченные тренировки дают {raw} ккал, но в дневной расчёт вошло {cap} ккал — это предел за сутки.",
    burnNotCredited: "Сожжённые калории не добавляются к дневной норме — норма уже рассчитана с учётом вашего уровня активности.",
    neatTitle: "Мы обновили вопрос о дневной активности",
    neatDesc: "Теперь он про жизнь без тренировок — сами тренировки добавляются отдельно, когда вы их отмечаете. Проверьте свой уровень.",
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
  muscles: {
    sideFront: "Спереди", sideBack: "Сзади",
    figure: "Схема тела — нажмите, чтобы выбрать мышцу",
    chest: "Грудь", shoulders: "Плечи", biceps: "Бицепс", abs: "Пресс",
    quads: "Ноги (перед)", neck: "Шея", back: "Спина", triceps: "Трицепс",
    glutes: "Ягодицы, бицепс бедра", calves: "Икры",
    picked: "Выбрано {n}/{max}",
    noneHint: "Ничего не выбрано — план будет сбалансированным",
    title: "На какие мышцы упор?",
    desc: "Недельный план построится вокруг выбранного. Оставьте пустым — нагрузка распределится равномерно.",
    editTitle: "Упор",
    balanced: "Сбалансированный",
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

    planTitle: "Персональный AI-план",
    title: "Тренировки", subtitlePlan: "Ваша персональная AI-программа", subtitleNoPlan: "Выберите план",
    library: "База упражнений", libraryAll: "Посмотреть все упражнения",
    libraryDesc: "Техника выполнения, ошибки и видео",
    librarySubtitle: "{count} упражнений — с техникой и видео",
    searchPlaceholder: "Поиск упражнения…",
    nothingFound: "Ничего не найдено", nothingFoundDesc: "Попробуйте другой фильтр или запрос.",
    addToToday: "Добавить в сегодняшнюю тренировку", technique: "техника выполнения",
    noPlan: "У вас нет плана тренировок",
    noPlanDesc: "AI составит недельный план по вашему весу, опыту и инвентарю — с весами в кг.",
    noPlanDescLocked: "Персональный AI-план — функция Premium. Можно бесплатно выбрать одну из готовых программ ниже.",
    createPlan: "Составить план с AI", planReady: "AI-план готов 🚀",
    readyPrograms: "Или готовые программы", programsSoon: "Готовые программы скоро — пока составьте AI-план",
    programMeta: "{days} дн/нед • {weeks} нед.",
    active: "Активен", planMeta: "{days} дн/нед • {reps} повт. • отдых {rest}",
    weeklySchedule: "План на неделю", dayN: "День {n}",
    restDay: "Отдых", restDayDesc: "Восстановление мышц и отдых",
    exercisesCount: "{total} упражнений • выполнено {done}/{total}",
    done: "Выполнено", start: "Начать",
    cardioTitle: "Рекомендация по кардио",
    cardioFreq: "{n} раза в неделю по {min} мин",
    cardioNote: {
      lose: "Самое эффективное дополнение для похудения — увеличивает расход калорий.",
      maintain: "Минимум в неделю для здоровья сердца и сосудов.",
      gain: "Держите лёгким на массонаборе — не должно мешать силовым.",
    },
    logCardio: "Отметить активность",
    aiTips: "Совет AI", getTips: "Получить совет AI по плану",
    tipsFailed: "AI не смог дать совет", progression: "Как повышать вес", warmup: "Разминка",
    regenerate: "Пересобрать план", regenerateCta: "Пересобрать",
    regenerateDesc: "Измените число дней или инвентарь — план пересчитается сразу.",
    perWeek: "В неделю", equipmentLabel: "Инвентарь", planRegenerated: "Новый план составлен",
    eqShort: { "home-none": "Без инвентаря", "home-dumbbell": "Гантели", gym: "Спортзал", outdoor: "На улице" },
    rulesNote: {
      lose: "Больше повторов + 15-20 минут кардио после тренировки.",
      maintain: "Сбалансированный объём — следите за техникой.",
      gain: "Каждую неделю понемногу повышайте вес.",
      beginner: "Начните с лёгкого веса — последние 2-3 повтора должны даваться тяжело, но выполнимо.",
    },
  },

  safety: {
    adjustedTitle: "Цель изменена",
    adjustedDesc: "Ради безопасности мы перевели вас в режим «{goal}».",
    reasons: {
      lose_blocked_pregnancy:
        "Во время беременности и кормления снижать вес не рекомендуется. Ваша норма рассчитана с прибавкой +{kcal} ккал. За точными указаниями обратитесь к своему врачу.",
      lose_blocked_underweight:
        "Ваш индекс массы тела {bmi} — это ниже нормы (меньше {minBmi}). При вашем росте здоровый вес начинается с {minKg} кг, поэтому план похудения мы не включаем. Выберите «Поддержание веса» или «Набор массы», либо обратитесь к врачу.",
      lose_blocked_minor:
        "До {minAge} лет самостоятельно ограничивать калории не рекомендуется. Вести дневник питания и тренировок можно, но если нужно снизить вес — посоветуйтесь с врачом или диетологом.",
    },
    advisories: {
      pregnancy_surplus_applied:
        "Для беременности к дневной норме добавлено +{kcal} ккал, а белок повышен до {proteinPerKg} г/кг.",
      age_minor_estimate:
        "До {minAge} лет расчёт приблизительный — формула выведена для взрослых. Проверьте показатели у врача.",
      age_senior_caution:
        "После {age} лет нормы калорий и белка становятся приблизительными. Перед началом новой диеты или тренировок посоветуйтесь с врачом.",
    },
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
    premium: "ZenFit Premium", premiumDesc: "Безлимитный AI сканер и тренер", premiumTrial: "Premium (пробный период)",
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

  recipes: {
    planTitle: "AI план питания на день", planThinking: "AI составляет план…",
    planDesc: "4 приёма пищи под вашу норму — с национальными блюдами",
    planLocked: "Активируйте Premium и получите персональный план питания",
    planFailed: "Не удалось составить план",
  },

  fit: {
    title: "Подходит ли вам",
    verdict: {
      good: "Подходит под вашу сегодняшнюю норму",
      ok: "Можно, но следите за порцией",
      warn: "Сегодня это не рекомендуется",
    },
    reason: {
      fitsWell: "Свободно укладывается в оставшиеся калории",
      bigShare: "Займёт большую часть дневной нормы",
      overBudget: "Выведет вас за дневную норму",
      highProtein: "Богато белком — полезно для мышц",
      proteinGap: "Закроет сегодняшнюю нехватку белка",
      lowProtein: "Много калорий, но белка почти нет",
      highFat: "Много жира — быстро исчерпает дневную норму жиров",
      processed: "Обработанный продукт — не стоит есть часто",
      goodForGain: "Хороший выбор для набора массы",
    },
  },

  pantry: {
    title: "Мои продукты",
    subtitle: "Отметьте продукты, которые есть у вас дома",
    desc: "AI составит дневной план питания только из отмеченных продуктов",
    open: "Выбрать продукты",
    empty: "Продукты ещё не отмечены",
    emptyDesc: "Отметьте то, что есть дома — AI составит план только из этого.",
    selected: "Отмечено: {n}",
    clear: "Очистить",
    save: "Сохранить",
    saved: "Продукты сохранены ✓",
    searchPlaceholder: "Поиск продукта…",
    generate: "Составить план из этих продуктов",
    generateDesc: "День из 4 приёмов пищи только из отмеченных вами продуктов",
    generating: "Составляем план…",
    limit: "Можно отметить не больше {n} продуктов",
    missingTitle: "Чего не хватает",
    missingDesc: "Для полноценного плана стоит докупить:",
    fromPantry: "Из ваших продуктов",
  },

  dietPreset: {
    section: "Готовые планы питания",
    desc: "Порции подстраиваются под вашу дневную норму",
    use: "Открыть план",
    scaled: "Порции подогнаны под вашу норму {kcal} ккал",
    clamped: "Этот план не совсем под вашу цель — выберите ближе к вашей норме",
    slots: { breakfast: "Завтрак", lunch: "Обед", dinner: "Ужин", snack: "Перекус" },
    names: {
      "balanced-uz": "Сбалансированное узбекское меню",
      "lose-lowcal": "Лёгкое меню для похудения",
      "gain-mass": "Меню для набора массы",
      budget: "Экономное меню",
      highprotein: "Меню с высоким белком",
    },
    descs: {
      "balanced-uz": "Овсянка, шурпа, курица и гречка — сбалансированный день из обычных продуктов.",
      "lose-lowcal": "Творог, мастава и белая рыба — сытный, но лёгкий день.",
      "gain-mass": "Много калорий и белка — для восстановления после тренировок.",
      budget: "Чечевица, картофель, яйца и катык — полный день из самых недорогих продуктов.",
      highprotein: "Яйца, курица, лосось и творог — легко закрывает норму белка.",
    },
  },

  premium: {
    choosePlan: "Выберите план", payByCard: "Оплатить картой", payTitle: "Оплата",
    card: "Карта", copyCard: "Скопировать номер карты", copied: "Скопировано ✓",
    step1: "Переведите указанную сумму на карту выше.",
    step2: "Сделайте скриншот чека об оплате.",
    step3: "Отправьте его администратору в Telegram кнопкой ниже и приложите скриншот.",
    sendReceipt: "Отправить админу в Telegram",
    telegramMessage: "Здравствуйте! Я оплатил(а) премиум подписку. План: {plan} — {amount} сум. Пожалуйста, подтвердите.",
    sentTitle: "Telegram открыт",
    sentDesc: "Отправьте там скриншот чека администратору. После подтверждения премиум активируется автоматически, и вы получите уведомление в Telegram. Обычно это занимает 1–2 часа.",
    manualHint: "Оплата проходит переводом на карту. Данные вашей карты в приложение не вводятся.",
    notReady: "Оплата пока не настроена. Попробуйте позже.",
    trialCtaTitle: "Попробуйте бесплатно 3 дня",
    trialCtaDesc: "Карта не нужна. Через 3 дня пробный период автоматически закончится — при желании сможете продлить.",
    trialStart: "Начать бесплатный пробный период",
    trialStartedTitle: "Пробный период начат!",
    trialStartedDesc: "В течение 3 дней вам доступны все премиум-функции бесплатно. По окончании вы вернётесь на бесплатный план.",
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

export const DICTS = {
  uz: { ...uz, ...screens.uz },
  ru: { ...ru, ...screens.ru },
  en: { ...en, ...screens.en },
};

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

/**
 * Whether a language was already stored when the app started.
 *
 * Read ONCE at module load, which is the only honest moment: boot() adopts the
 * server profile and writes its language through, so by the time Onboarding
 * mounts the key always exists — a fresh account would look like it had chosen
 * Uzbek when all that happened was the column default. Snapshotting at import
 * happens before any of that.
 */
const HAD_STORED_LANGUAGE = (() => {
  try {
    return Boolean(DICTS[localStorage.getItem(KEY)]);
  } catch {
    return false; // private mode — ask, it costs one tap
  }
})();

export const hasStoredLanguage = () => HAD_STORED_LANGUAGE;

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
