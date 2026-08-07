/**
 * Exercise library.
 *
 * Every `youtubeId` below was verified against YouTube's oEmbed endpoint (video
 * exists, title matches the movement) and checked for `playableInEmbed`, so the
 * in-app player never lands on a dead or embed-blocked video. An exercise with
 * no id falls back to a YouTube search built from `youtubeQuery`.
 *
 * `bw` = fraction of bodyweight used as the beginner starting load, per the
 * AI trainer spec. Intermediate/advanced multipliers are applied in the engine.
 */

const YOUTUBE_IDS = {
  "barbell-back-squat": "iZTxa8NJH2g",
  "leg-press": "nDh_BlnLCGc",
  "goblet-squat": "MxsFDhcyFyE",
  "bodyweight-squat": "PNKgSbWA8g8",
  "bulgarian-split-squat": "bwhl_9jN_3o",
  "walking-lunge": "DlhojghkaQ0",
  "barbell-deadlift": "ZaTM37cfiDs",
  "romanian-deadlift": "_oyxCn2iSjU",
  "glute-bridge": "PhTDzR0TpZs",
  "db-romanian-deadlift": "hu3jRvTc_po",
  "barbell-bench-press": "hWbUlkb5Ms4",
  "incline-db-press": "8iPEnn-ltC8",
  "push-up": "14D-2c9kvVw",
  "db-floor-press": "k8fvMnz42-g",
  "barbell-row": "phVtqawIgbk",
  "seated-cable-row": "7o2oolbmzeI",
  "db-one-arm-row": "q65uDGJ9ZPs",
  "inverted-row": "KOaCM1HMwU0",
  "overhead-press": "_RlRDWO2jfg",
  "db-shoulder-press": "qEwKCR5JCog",
  "pike-push-up": "XckEEwa1BPI",
  "lat-pulldown": "SALxEARiMkw",
  "doorway-row": "Ow4KlswOrhU",
  plank: "v25dawSzRTM",
  "mountain-climber": "fpmWW6iXfes",
  "bicycle-crunch": "Iwyvozckjak",
  "barbell-curl": "QZEqB6wUPxQ",
  "db-curl": "ICAXJVmOJik",
  "triceps-pushdown": "vB5OHsJ3EME",
  "bench-dip": "4ua3MzaU0QU",
  "lateral-raise": "3VcKaXpzqRo",
  "face-pull": "8686PLZB_1Q",
  "standing-calf-raise": "n-5T_oYc1oU",
  "machine-shoulder-press": "Gkk-6q7Rq-s",
  "preacher-curl": "xjqBJexFDcw",
  "overhead-triceps-extension": "b_r_LW4HEcM",
  "cable-lateral-raise": "xrBcuPNTxLg",
  "cable-crunch": "dkGwcfo9zto",
  "seated-calf-raise": "FsqE-g1C5fk",
};

/** Technique videos for the cardio activities on the home screen. */
export const ACTIVITY_VIDEOS = {
  running: "_kGESn8ArrU",
  "jump-rope": "kDOGb9C5kp0",
};

const ex = (o) => ({ type: "isolation", ...o, youtubeId: YOUTUBE_IDS[o.id] ?? null });

export const EXERCISES = [
  /* ---------------- squat pattern ---------------- */
  ex({
    id: "barbell-back-squat", name: "Shtanga bilan cho'kkalash", nameEn: "Barbell back squat",
    muscle: "Oyoq (kvadritseps, dumba)", equipment: "gym", pattern: "squat", type: "compound", bw: 0.4,
    youtubeQuery: "barbell back squat proper form",
    steps: [
      "Shtangani yelka orqasidagi trapetsiya mushagiga qo'ying, qo'llar simmetrik ushlasin.",
      "Oyoqlarni yelka kengligida, oyoq uchlarini biroz tashqariga qarating.",
      "Nafas oling, qorinni tarang qiling va dumbani orqaga surgan holda pastga tushing.",
      "Son yerga parallel bo'lguncha tushing (tizza og'rimasa, pastroq ham mumkin).",
      "Tovon orqali yerga bosib, nafas chiqarib yuqoriga turing.",
    ],
    mistakes: ["Tizza ichkariga qiyshayishi", "Tovon yerdan ko'tarilishi", "Belni yumaloqlash", "Juda tez tushish"],
  }),
  ex({
    id: "leg-press", name: "Leg press (trenajyor)", nameEn: "Leg press machine",
    muscle: "Oyoq (kvadritseps)", equipment: "gym", pattern: "squat", type: "compound",
    youtubeQuery: "leg press machine proper form",
    steps: ["Kursiga to'liq yotib, belni tayanchga tekkizing.", "Oyoqlarni platformada yelka kengligida joylashtiring.", "Tizzani 90 gradusgacha buking.", "Tovon orqali itaring, tizzani oxirigacha qotirmang."],
    mistakes: ["Tizzani to'liq to'g'rilab qotirish", "Belni kursidan uzish", "Juda katta vazn bilan yarim amplituda"],
  }),
  ex({
    id: "goblet-squat", name: "Goblet cho'kkalash", nameEn: "Goblet squat",
    muscle: "Oyoq, qorin", equipment: "home-dumbbell", pattern: "squat", type: "compound",
    youtubeQuery: "goblet squat dumbbell form",
    steps: ["Gantelni ikki qo'l bilan ko'krak oldida ushlang.", "Oyoq yelka kengligida turing.", "Tik holatda pastga tushing, tirsak tizza ichiga tegsin.", "Tovon orqali turing."],
    mistakes: ["Oldinga engashib ketish", "Gantelni pastga tushirib yuborish"],
  }),
  ex({
    id: "bodyweight-squat", name: "Oddiy cho'kkalash", nameEn: "Bodyweight squat",
    muscle: "Oyoq, dumba", equipment: "home-none", pattern: "squat", type: "compound",
    youtubeQuery: "bodyweight squat proper form beginner",
    steps: ["Oyoqlar yelka kengligida, qo'llar oldinga uzatilgan.", "Dumbani orqaga surib pastga tushing.", "Son parallel bo'lguncha tushing.", "Tovon orqali turing va yuqorida dumbani siqing."],
    mistakes: ["Tizza oyoq uchidan juda oldinga chiqishi", "Bel yumaloqlanishi"],
  }),
  ex({
    id: "bulgarian-split-squat", name: "Bolgar split cho'kkalash", nameEn: "Bulgarian split squat",
    muscle: "Oyoq, dumba", equipment: "home-dumbbell", pattern: "squat", type: "compound",
    youtubeQuery: "bulgarian split squat form",
    steps: ["Orqa oyoq uchini stul yoki skameykaga qo'ying.", "Old oyoqni bir qadam oldinga joylashtiring.", "Vertikal pastga tushing, old tizza 90 gradus bo'lsin.", "Old oyoq tovoni orqali turing."],
    mistakes: ["Juda qisqa qadam olish", "Tanani oldinga tashlash", "Muvozanatni yo'qotish"],
  }),
  ex({
    id: "walking-lunge", name: "Yurib vipad (lunge)", nameEn: "Walking lunge",
    muscle: "Oyoq, dumba", equipment: "home-none", pattern: "squat", type: "compound",
    youtubeQuery: "walking lunge proper form",
    steps: ["Tik turing, bir oyoq bilan oldinga katta qadam tashlang.", "Ikkala tizza 90 gradus bo'lguncha pastga tushing.", "Old oyoq tovoni orqali turib, ikkinchi oyoq bilan qadam tashlang."],
    mistakes: ["Orqa tizza yerga urilishi", "Tanani oldinga engashtirish"],
  }),

  /* ---------------- hinge pattern ---------------- */
  ex({
    id: "barbell-deadlift", name: "Stanovoy tortish (deadlift)", nameEn: "Barbell deadlift",
    muscle: "Orqa, dumba, son orqasi", equipment: "gym", pattern: "hinge", type: "compound", bw: 0.6,
    youtubeQuery: "barbell deadlift proper form",
    steps: [
      "Oyoqlar chanoq kengligida, shtanga oyoq o'rtasi ustida.",
      "Chanoqni orqaga surib engashing, belni TO'G'RI ushlang.",
      "Shtangani yelka kengligida ushlang, yelkani biroz orqaga torting.",
      "Oyoq bilan yerni itargandek qilib turing, shtanga oyoqqa yaqin harakatlansin.",
      "Yuqorida dumbani siqing, orqaga egilmang.",
    ],
    mistakes: ["Belni yumaloqlash (eng xavfli xato)", "Shtangani tanadan uzoqlashtirish", "Yuqorida orqaga egilish", "Tizza bilan boshlash"],
  }),
  ex({
    id: "romanian-deadlift", name: "Rumin tortishi (RDL)", nameEn: "Romanian deadlift",
    muscle: "Son orqasi, dumba", equipment: "gym", pattern: "hinge", type: "compound", bw: 0.45,
    youtubeQuery: "romanian deadlift RDL form",
    steps: ["Shtangani tik turib ushlang.", "Tizzani yengil bukib qotiring.", "Chanoqni orqaga surib, shtangani son bo'ylab pastga tushiring.", "Son orqasida cho'zilish sezilganda to'xtang va chanoqni oldinga surib turing."],
    mistakes: ["Tizzani ortiqcha bukish (cho'kkalashga aylanadi)", "Belni yumaloqlash", "Juda pastga tushish"],
  }),
  ex({
    id: "glute-bridge", name: "Dumba ko'prigi (glute bridge)", nameEn: "Glute bridge",
    muscle: "Dumba, son orqasi", equipment: "home-none", pattern: "hinge", type: "compound",
    kneeFriendly: true,
    youtubeQuery: "glute bridge exercise form",
    steps: ["Chalqancha yoting, tizzani buking, tovon dumbaga yaqin.", "Tovon orqali bosib chanoqni yuqoriga ko'taring.", "Yuqorida 1-2 soniya dumbani siqing.", "Sekin pastga tushiring, dumba yerga tegmasin."],
    mistakes: ["Bel bilan ko'tarish (dumba emas)", "Juda tez harakat", "Yuqorida siqmaslik"],
  }),
  ex({
    id: "db-romanian-deadlift", name: "Gantel bilan RDL", nameEn: "Dumbbell Romanian deadlift",
    muscle: "Son orqasi, dumba", equipment: "home-dumbbell", pattern: "hinge", type: "compound",
    youtubeQuery: "dumbbell romanian deadlift form",
    steps: ["Ikki qo'lda gantel, tik turing.", "Tizzani yengil bukib qotiring.", "Chanoqni orqaga surib gantellarni son bo'ylab tushiring.", "Cho'zilish sezilganda chanoq bilan turing."],
    mistakes: ["Belni yumaloqlash", "Gantelni tanadan uzoqlashtirish"],
  }),

  /* ---------------- horizontal push ---------------- */
  ex({
    id: "barbell-bench-press", name: "Yotib shtanga ko'tarish", nameEn: "Barbell bench press",
    muscle: "Ko'krak, trisep, old yelka", equipment: "gym", pattern: "pushH", type: "compound", bw: 0.32,
    youtubeQuery: "barbell bench press proper form",
    steps: [
      "Skameykaga yoting, ko'z shtanga ostida bo'lsin.",
      "Shtangani yelkadan biroz keng ushlang.",
      "Kurak suyaklarini birlashtirib qotiring, oyoq yerda mahkam.",
      "Nafas olib shtangani ko'krak o'rtasiga nazorat bilan tushiring.",
      "Nafas chiqarib itaring, tirsak 45 gradus burchakda harakatlansin.",
    ],
    mistakes: ["Shtangani ko'krakka urish", "Tirsakni 90 gradus yoyish (yelkaga zarar)", "Dumbani skameykadan uzish", "Yordamchisiz maksimal vazn"],
  }),
  ex({
    id: "incline-db-press", name: "Qiya gantel ko'tarish", nameEn: "Incline dumbbell press",
    muscle: "Yuqori ko'krak", equipment: "gym", pattern: "pushH", type: "compound",
    youtubeQuery: "incline dumbbell press form",
    steps: ["Skameykani 30-45 gradusga qo'ying.", "Gantellarni ko'krak yon tomonida ushlang.", "Yuqoriga itaring, gantellar tepada yaqinlashsin.", "Nazorat bilan pastga tushiring."],
    mistakes: ["Burchakni juda tik qo'yish (yelkaga o'tadi)", "Gantellarni bir-biriga urish"],
  }),
  ex({
    id: "push-up", name: "Push-up (otjimaniya)", nameEn: "Push up",
    muscle: "Ko'krak, trisep, qorin", equipment: "home-none", pattern: "pushH", type: "compound",
    youtubeQuery: "push up proper form beginner",
    steps: ["Taxta holatida turing, qo'llar yelkadan biroz keng.", "Tana boshdan tovongacha to'g'ri chiziq.", "Ko'krak yerga yaqinlashguncha tushing.", "Yerni itarib yuqoriga chiqing."],
    mistakes: ["Chanoqni pastga tushirish", "Dumbani yuqoriga ko'tarish", "Yarim amplituda", "Boshni oldinga cho'zish"],
  }),
  ex({
    id: "db-floor-press", name: "Yerda gantel ko'tarish", nameEn: "Dumbbell floor press",
    muscle: "Ko'krak, trisep", equipment: "home-dumbbell", pattern: "pushH", type: "compound",
    youtubeQuery: "dumbbell floor press form",
    steps: ["Yerda chalqancha yoting, tizza bukilgan.", "Gantellarni ko'krak yonida ushlang.", "Tirsak yerga tekguncha tushiring.", "Yuqoriga itaring."],
    mistakes: ["Tirsakni yerga urish", "Tez harakat"],
  }),

  /* ---------------- horizontal pull ---------------- */
  ex({
    id: "barbell-row", name: "Engashib shtanga tortish", nameEn: "Bent over barbell row",
    muscle: "Orqa (keng mushak), bitsep", equipment: "gym", pattern: "pullH", type: "compound", bw: 0.32,
    youtubeQuery: "bent over barbell row form",
    steps: ["Chanoqni orqaga surib 45 gradus engashing, bel to'g'ri.", "Shtangani yelka kengligida ushlang.", "Shtangani qorin pastiga torting, tirsak tanaga yaqin.", "Kuraklarni birlashtiring, sekin tushiring."],
    mistakes: ["Belni yumaloqlash", "Tanani tebratib tortish", "Tirsakni yoyib yuborish"],
  }),
  ex({
    id: "seated-cable-row", name: "O'tirib blok tortish", nameEn: "Seated cable row",
    muscle: "Orqa, bitsep", equipment: "gym", pattern: "pullH", type: "compound",
    backFriendly: true,
    youtubeQuery: "seated cable row proper form",
    steps: ["O'tirib oyoqni tayanchga qo'ying, tizza yengil bukilgan.", "Tutqichni ushlab belni to'g'ri qiling.", "Tutqichni qoringa torting, kuraklarni birlashtiring.", "Nazorat bilan qaytaring."],
    mistakes: ["Tanani orqaga tashlab tortish", "Yelkani ko'tarish"],
  }),
  ex({
    id: "db-one-arm-row", name: "Bir qo'lda gantel tortish", nameEn: "One arm dumbbell row",
    muscle: "Orqa, bitsep", equipment: "home-dumbbell", pattern: "pullH", type: "compound",
    youtubeQuery: "one arm dumbbell row form",
    steps: ["Bir tizza va qo'lni skameykaga qo'ying.", "Ikkinchi qo'lda gantel osilgan holda.", "Gantelni yon qovurg'aga torting, tirsak tanaga yaqin.", "Sekin tushiring."],
    mistakes: ["Tanani burash", "Tirsakni yoyish", "Yelkani ko'tarish"],
  }),
  ex({
    id: "inverted-row", name: "Stol ostida tortilish", nameEn: "Inverted row table",
    muscle: "Orqa, bitsep", equipment: "home-none", pattern: "pullH", type: "compound",
    youtubeQuery: "inverted row at home table",
    steps: ["Mustahkam stol chetini ushlab ostiga yoting.", "Tana to'g'ri chiziq, tovon yerda.", "Ko'krakni stolga torting.", "Sekin tushing."],
    mistakes: ["Chanoqni pastga tushirish", "Yarim amplituda"],
  }),

  /* ---------------- vertical push ---------------- */
  ex({
    id: "overhead-press", name: "Turgan holda shtanga siqish", nameEn: "Standing overhead press",
    muscle: "Yelka, trisep", equipment: "gym", pattern: "pushV", type: "compound", bw: 0.2,
    youtubeQuery: "standing overhead press barbell form",
    steps: ["Shtangani ko'krak yuqorisida yelka kengligida ushlang.", "Qorin va dumbani tarang qiling.", "Boshdan yuqoriga itaring, bosh biroz orqaga suriladi.", "Tepada shtanga bosh ustida bo'lsin, nazorat bilan tushiring."],
    mistakes: ["Belni orqaga egish", "Shtangani oldindan aylantirmaslik", "Oyoq bilan turtki berish (bu push press)"],
  }),
  ex({
    id: "db-shoulder-press", name: "Gantel bilan yelka siqish", nameEn: "Dumbbell shoulder press",
    muscle: "Yelka, trisep", equipment: "home-dumbbell", pattern: "pushV", type: "compound",
    youtubeQuery: "dumbbell shoulder press form",
    steps: ["O'tirib yoki turib gantellarni yelka balandligida ushlang.", "Yuqoriga itaring.", "Nazorat bilan yelka balandligiga tushiring."],
    mistakes: ["Belni egish", "Juda pastga tushirish"],
  }),
  ex({
    id: "pike-push-up", name: "Pike push-up", nameEn: "Pike push up",
    muscle: "Yelka, trisep", equipment: "home-none", pattern: "pushV", type: "compound",
    youtubeQuery: "pike push up shoulder form",
    steps: ["Taxta holatidan chanoqni yuqoriga ko'taring (V shakl).", "Boshni qo'llar orasiga pastga tushiring.", "Yuqoriga itaring."],
    mistakes: ["Chanoqni pastga tushirish", "Bo'yinni siqish"],
  }),

  /* ---------------- vertical pull ---------------- */
  ex({
    bodyweight: true, id: "pull-up", name: "Turnikda tortilish", nameEn: "Pull up",
    muscle: "Orqa (keng mushak), bitsep", equipment: "gym", pattern: "pullV", type: "compound",
    youtubeQuery: "pull up proper form beginner",
    steps: ["Turnikni yelkadan keng ushlang.", "Kuraklarni pastga tushiring.", "Iyak turnikdan oshguncha torting.", "Sekin to'liq pastga tushing."],
    mistakes: ["Tebranib tortilish", "Yarim amplituda", "Yelkani quloqqa ko'tarish"],
  }),
  ex({
    id: "lat-pulldown", name: "Yuqori blok tortish", nameEn: "Lat pulldown",
    muscle: "Orqa, bitsep", equipment: "gym", pattern: "pullV", type: "compound",
    youtubeQuery: "lat pulldown proper form",
    steps: ["O'tirib sonni tayanch ostiga qo'ying.", "Tutqichni keng ushlang.", "Ko'krak yuqorisiga torting, tanani biroz orqaga eging.", "Nazorat bilan qaytaring."],
    mistakes: ["Bo'yin orqasiga tortish (xavfli)", "Tanani ortiqcha tebratish"],
  }),
  ex({
    id: "doorway-row", name: "Eshik ramkasida tortilish", nameEn: "Doorway row bodyweight",
    muscle: "Orqa, bitsep", equipment: "home-none", pattern: "pullV", type: "compound",
    youtubeQuery: "doorway row bodyweight back exercise",
    steps: ["Mustahkam eshik ramkasini ushlang.", "Tanani orqaga tashlab qo'llarni to'g'rilang.", "O'zingizni ramkaga torting."],
    mistakes: ["Beqaror eshikdan foydalanish", "Belni egish"],
  }),

  /* ---------------- core ---------------- */
  ex({
    id: "plank", name: "Plank (taxta)", nameEn: "Plank",
    muscle: "Qorin, bel", equipment: "home-none", pattern: "core", isTime: true,
    youtubeQuery: "plank proper form core",
    steps: ["Tirsak yelka ostida, bilak yerda.", "Tana boshdan tovongacha to'g'ri chiziq.", "Qorin va dumbani tarang qiling.", "Nafasni ushlamang, muntazam nafas oling."],
    mistakes: ["Chanoqni ko'tarish yoki tushirish", "Nafasni ushlab turish", "Boshni pastga tashlash"],
  }),
  ex({
    bodyweight: true, id: "hanging-leg-raise", name: "Osilib oyoq ko'tarish", nameEn: "Hanging leg raise",
    muscle: "Pastki qorin", equipment: "gym", pattern: "core",
    youtubeQuery: "hanging leg raise form",
    steps: ["Turnikda osiling.", "Chanoqni biroz orqaga burab oyoqni ko'taring.", "Oyoq gorizontal bo'lguncha ko'taring.", "Sekin tushiring, tebranmang."],
    mistakes: ["Tebranish", "Faqat son bilan ko'tarish"],
  }),
  ex({
    id: "mountain-climber", name: "Mountain climber", nameEn: "Mountain climber",
    muscle: "Qorin, kardio", equipment: "home-none", pattern: "core", isTime: true,
    youtubeQuery: "mountain climbers proper form",
    steps: ["Taxta holatida turing.", "Tizzani navbat bilan ko'krakka torting.", "Tempni tez, chanoqni barqaror ushlang."],
    mistakes: ["Chanoqni yuqoriga ko'tarish", "Qo'l yelkadan uzoqlashishi"],
  }),
  ex({
    id: "bicycle-crunch", name: "Velosiped crunch", nameEn: "Bicycle crunch",
    muscle: "Qiya qorin", equipment: "home-none", pattern: "core",
    youtubeQuery: "bicycle crunch proper form",
    steps: ["Chalqancha yotib qo'lni bosh orqasiga qo'ying.", "Qarama-qarshi tirsak va tizzani yaqinlashtiring.", "Navbat bilan almashtiring."],
    mistakes: ["Bo'yinni qo'l bilan tortish", "Juda tez, nazoratsiz harakat"],
  }),

  /* ---------------- arms & delts ---------------- */
  ex({
    id: "barbell-curl", name: "Shtanga bilan bitsep", nameEn: "Barbell biceps curl",
    muscle: "Bitsep", equipment: "gym", pattern: "biceps",
    youtubeQuery: "barbell biceps curl form",
    steps: ["Tik turib shtangani yelka kengligida pastdan ushlang.", "Tirsakni tanaga yopishtiring.", "Shtangani yuqoriga buking.", "Sekin tushiring."],
    mistakes: ["Tanani tebratish", "Tirsakni oldinga surish"],
  }),
  ex({
    id: "db-curl", name: "Gantel bilan bitsep", nameEn: "Dumbbell biceps curl",
    muscle: "Bitsep", equipment: "home-dumbbell", pattern: "biceps",
    youtubeQuery: "dumbbell biceps curl form",
    steps: ["Ikki qo'lda gantel, tik turing.", "Tirsakni qotirib gantelni yuqoriga buking.", "Yuqorida bitsepni siqing.", "Sekin tushiring."],
    mistakes: ["Tebranish", "Yarim amplituda"],
  }),
  ex({
    id: "triceps-pushdown", name: "Blokda trisep", nameEn: "Triceps pushdown cable",
    muscle: "Trisep", equipment: "gym", pattern: "triceps",
    youtubeQuery: "triceps pushdown cable form",
    steps: ["Yuqori blok tutqichini ushlang.", "Tirsakni tanaga yopishtiring.", "Qo'lni pastga to'g'rilang.", "Sekin qaytaring."],
    mistakes: ["Tirsakni tanadan uzoqlashtirish", "Tana bilan bosish"],
  }),
  ex({
    id: "bench-dip", name: "Skameykada dip", nameEn: "Bench dips triceps",
    muscle: "Trisep", equipment: "home-none", pattern: "triceps",
    youtubeQuery: "bench dips triceps form",
    steps: ["Stul chetiga qo'l bilan tayaning.", "Chanoqni oldinga surib pastga tushing.", "Tirsak 90 gradus bo'lguncha tushing.", "Itarib yuqoriga chiqing."],
    mistakes: ["Yelkani juda pastga tushirish", "Tirsakni yoyish"],
  }),
  ex({
    id: "lateral-raise", name: "Yon tomonga ko'tarish", nameEn: "Dumbbell lateral raise",
    muscle: "O'rta yelka", equipment: "home-dumbbell", pattern: "delts",
    shoulderFriendly: true,
    youtubeQuery: "dumbbell lateral raise form",
    steps: ["Ikki qo'lda yengil gantel, tik turing.", "Tirsakni yengil bukib yon tomonga ko'taring.", "Yelka balandligida to'xtang.", "Sekin tushiring."],
    mistakes: ["Juda og'ir vazn olish", "Tanani tebratish", "Yelka balandligidan yuqori ko'tarish"],
  }),
  ex({
    id: "face-pull", name: "Face pull", nameEn: "Face pull cable",
    muscle: "Orqa yelka, trapetsiya", equipment: "gym", pattern: "delts",
    shoulderFriendly: true,
    youtubeQuery: "face pull proper form",
    steps: ["Blokni yuz balandligiga qo'ying.", "Arqonni ushlab yuzga torting.", "Tirsak yuqorida, kuraklarni birlashtiring.", "Sekin qaytaring."],
    mistakes: ["Juda og'ir vazn", "Tirsakni pastga tushirish"],
  }),
  ex({
    id: "standing-calf-raise", name: "Boldir ko'tarish", nameEn: "Standing calf raise",
    muscle: "Boldir", equipment: "home-none", pattern: "calves",
    youtubeQuery: "standing calf raise form",
    steps: ["Zinapoya chetida oyoq uchida turing.", "Tovonni imkon qadar pastga tushiring.", "Oyoq uchida yuqoriga ko'taring.", "Yuqorida 1 soniya ushlang."],
    mistakes: ["Tez sakrash", "Yarim amplituda"],
  }),

  /* -------- gym alternates, so repeated split days rotate properly -------- */
  ex({
    id: "machine-shoulder-press", name: "Trenajyorda yelka siqish", nameEn: "Machine shoulder press",
    muscle: "Yelka, trisep", equipment: "gym", pattern: "pushV", type: "compound",
    youtubeQuery: "machine shoulder press form",
    steps: ["Kursini tutqich yelka balandligida bo'ladigan qilib sozlang.", "Belni tayanchga tekkizing.", "Yuqoriga itaring, tirsakni oxirigacha qotirmang.", "Nazorat bilan qaytaring."],
    mistakes: ["Kursi balandligini noto'g'ri sozlash", "Belni tayanchdan uzish"],
  }),
  ex({
    id: "preacher-curl", name: "Skamyada bitsep (preacher)", nameEn: "Preacher curl",
    muscle: "Bitsep", equipment: "gym", pattern: "biceps",
    youtubeQuery: "preacher curl form",
    steps: ["Tirsakni qiya taxtaga to'liq qo'ying.", "Vaznni yuqoriga buking.", "Yuqorida siqing.", "Sekin, to'liq pastga tushiring."],
    mistakes: ["Tirsakni taxtadan uzish", "Pastda tez tashlab yuborish"],
  }),
  ex({
    id: "overhead-triceps-extension", name: "Bosh ortida trisep", nameEn: "Overhead triceps extension",
    muscle: "Trisep", equipment: "gym", pattern: "triceps",
    youtubeQuery: "overhead triceps extension form",
    steps: ["Vaznni bosh ortida ikki qo'lda ushlang.", "Tirsakni qulog'ingizga yaqin qotiring.", "Qo'lni yuqoriga to'g'rilang.", "Sekin pastga tushiring."],
    mistakes: ["Tirsakni yon tomonga yoyish", "Belni orqaga egish"],
  }),
  ex({
    id: "cable-lateral-raise", name: "Blokda yon ko'tarish", nameEn: "Cable lateral raise",
    muscle: "O'rta yelka", equipment: "gym", pattern: "delts",
    shoulderFriendly: true,
    youtubeQuery: "cable lateral raise form",
    steps: ["Pastki blokni qarama-qarshi qo'l bilan ushlang.", "Tirsakni yengil bukib yon tomonga ko'taring.", "Yelka balandligida to'xtang.", "Sekin tushiring."],
    mistakes: ["Juda og'ir vazn olish", "Tana bilan turtki berish"],
  }),
  ex({
    id: "cable-crunch", name: "Blokda qorin (cable crunch)", nameEn: "Cable crunch abs",
    muscle: "Qorin", equipment: "gym", pattern: "core",
    youtubeQuery: "cable crunch abs form",
    steps: ["Yuqori blok oldida tiz cho'king.", "Arqonni bosh yonida ushlang.", "Qorin bilan tanani pastga buking.", "Sekin qaytaring."],
    mistakes: ["Qo'l bilan tortish", "Chanoqni harakatlantirish"],
  }),
  ex({
    id: "seated-calf-raise", name: "O'tirib boldir ko'tarish", nameEn: "Seated calf raise machine",
    muscle: "Boldir", equipment: "gym", pattern: "calves",
    youtubeQuery: "seated calf raise machine form",
    steps: ["Tizzani tayanch ostiga qo'ying.", "Oyoq uchini platformaga qo'ying.", "Tovonni pastga tushiring, keyin yuqoriga ko'taring.", "Yuqorida 1 soniya ushlang."],
    mistakes: ["Yarim amplituda", "Juda tez harakat"],
  }),
];

export const EX_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

/** Grouped for the library screen. */
export const MUSCLE_GROUPS = [
  { id: "all", label: "Barchasi" },
  { id: "squat", label: "Oyoq" },
  { id: "pushH", label: "Ko'krak" },
  { id: "pullH", label: "Orqa" },
  { id: "pushV", label: "Yelka" },
  { id: "biceps", label: "Qo'l" },
  { id: "core", label: "Qorin" },
];

export const EQUIPMENT_LABELS = {
  gym: "Sport zali",
  "home-dumbbell": "Gantel",
  "home-none": "Jihozsiz",
  outdoor: "Ochiq havo",
};

export function filterExercises({ group = "all", equipment = null, search = "" } = {}) {
  const q = search.trim().toLowerCase();
  return EXERCISES.filter((e) => {
    if (group !== "all") {
      const armGroup = group === "biceps" && ["biceps", "triceps", "delts"].includes(e.pattern);
      if (!armGroup && e.pattern !== group) return false;
    }
    if (equipment && e.equipment !== equipment) return false;
    if (q && !`${e.name} ${e.nameEn} ${e.muscle}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function youtubeSearchUrl(exercise) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.youtubeQuery || exercise.nameEn)}`;
}
