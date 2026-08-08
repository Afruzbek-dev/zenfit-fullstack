/**
 * Food catalogue.
 *
 * Two kinds of entry live here, because two kinds of thing get eaten:
 *
 *   kind: "dish"    — a cooked meal. Values are for one stated portion, since
 *                     nobody weighs a bowl of shurpa; the portion multiplier
 *                     (0.5× … 2×) is the honest control for these.
 *   kind: "product" — an ingredient or packaged item. Values are per 100 g,
 *                     which is how they are labelled and how they are weighed,
 *                     so these get a gram input instead.
 *
 * Macros are reference composition values (the same figures a nutrition label
 * or a food-composition table carries), not measurements of any one brand.
 * National dishes vary far more than packaged food — oil and meat quantity
 * differ per household — so those carry `approx: true` and the UI says so
 * rather than implying a precision the number does not have.
 *
 * Numbers are stored as [kcal, carbs, protein, fat] to keep 130 entries
 * readable; `macros()` unpacks them.
 */

/* Category ids are stable; the labels are looked up per language. */
export const CATEGORIES = ["all", "national", "meat", "fish", "dairy", "grain", "veg", "fruit", "nut", "sweet", "drink", "fast"];

const dish = (id, n, emoji, portionG, macros, opts = {}) => ({
  id, kind: "dish", n, emoji, portionG, macros, approx: true, ...opts,
});

const product = (id, n, emoji, cat, macros, servingG, opts = {}) => ({
  id, kind: "product", n, emoji, cat, macros, servingG, approx: false, ...opts,
});

/* ------------------------------------------------------------------ dishes */

const DISHES = [
  dish("osh", { uz: "Osh (palov)", ru: "Плов", en: "Plov (pilaf)" }, "🍚", 350, [480, 55, 24, 18], {
    cat: "national", uzbek: true, minutes: 90,
    note: {
      uz: "Uy retseptiga qarab 350-550 kcal oralig'ida bo'lishi mumkin — yog' va go'sht miqdoriga bog'liq.",
      ru: "В зависимости от рецепта — от 350 до 550 ккал: всё решает количество масла и мяса.",
      en: "Anywhere from 350 to 550 kcal depending on the recipe — oil and meat decide it.",
    },
    ingredients: {
      uz: ["Guruch 120g", "Mol yoki qo'y go'shti 100g", "Sabzi 100g", "Piyoz, sarimsoq, ziravorlar"],
      ru: ["Рис 120 г", "Говядина или баранина 100 г", "Морковь 100 г", "Лук, чеснок, специи"],
      en: ["Rice 120g", "Beef or lamb 100g", "Carrot 100g", "Onion, garlic, spices"],
    },
  }),
  dish("lagmon", { uz: "Qovurma lag'mon", ru: "Лагман (жареный)", en: "Fried lagman" }, "🍜", 400, [420, 45, 24, 14], {
    cat: "national", uzbek: true, minutes: 60,
    note: {
      uz: "Qo'lda tortilgan xamir va go'sht miqdoriga qarab ±80 kcal farq qilishi mumkin.",
      ru: "Из-за теста ручной тяжки и количества мяса возможна разница ±80 ккал.",
      en: "Hand-pulled noodles and the meat portion swing this by about ±80 kcal.",
    },
    ingredients: {
      uz: ["Lag'mon xamiri 150g", "Mol go'shti 100g", "Bolgar qalampiri, pomidor, sabzi"],
      ru: ["Лапша 150 г", "Говядина 100 г", "Болгарский перец, помидор, морковь"],
      en: ["Noodles 150g", "Beef 100g", "Pepper, tomato, carrot"],
    },
  }),
  dish("somsa", { uz: "Go'shtli somsa", ru: "Самса с мясом", en: "Meat samsa" }, "🥟", 120, [280, 26, 13, 16], {
    cat: "national", uzbek: true, minutes: 45,
    note: {
      uz: "Moyda qovurilgan versiyasi 350+ kcal bo'lishi mumkin — tandirdagisi yengilroq.",
      ru: "Жаренная в масле — 350+ ккал; тандырная легче.",
      en: "The deep-fried version runs past 350 kcal; the tandoor one is lighter.",
    },
    ingredients: {
      uz: ["Xamir 60g", "Mol/qo'y fars 50g", "Piyoz", "Ziravorlar"],
      ru: ["Тесто 60 г", "Фарш 50 г", "Лук", "Специи"],
      en: ["Pastry 60g", "Minced meat 50g", "Onion", "Spices"],
    },
  }),
  dish("manti", { uz: "Manti", ru: "Манты", en: "Manti" }, "🥟", 280, [380, 40, 20, 15], {
    cat: "national", uzbek: true, minutes: 90,
    note: {
      uz: "5-6 dona, qatiq bilan. Bug'da pishirilgani qovurilganidan yengilroq.",
      ru: "5-6 штук с катыком. На пару легче, чем жареные.",
      en: "5-6 pieces with yoghurt. Steamed is lighter than fried.",
    },
    ingredients: {
      uz: ["Xamir", "Mol fars yoki qovoq + go'sht", "Piyoz", "Qatiq"],
      ru: ["Тесто", "Фарш или тыква с мясом", "Лук", "Катык"],
      en: ["Dough", "Minced meat or pumpkin and meat", "Onion", "Yoghurt"],
    },
  }),
  dish("shurpa", { uz: "Shurpa", ru: "Шурпа", en: "Shurpa" }, "🍲", 350, [320, 20, 22, 16], {
    cat: "national", uzbek: true, minutes: 120,
    note: {
      uz: "Yog'siz go'sht bilan ~250 kcal, yog'li qo'y go'shti bilan 450+ kcal.",
      ru: "С постным мясом ~250 ккал, с жирной бараниной 450+ ккал.",
      en: "About 250 kcal with lean meat, past 450 with fatty lamb.",
    },
    ingredients: {
      uz: ["Suyakli go'sht 150g", "Kartoshka", "Sabzi", "Pomidor"],
      ru: ["Мясо на кости 150 г", "Картофель", "Морковь", "Помидор"],
      en: ["Bone-in meat 150g", "Potato", "Carrot", "Tomato"],
    },
  }),
  dish("mastava", { uz: "Mastava", ru: "Мастава", en: "Mastava" }, "🍜", 350, [290, 34, 15, 11], {
    cat: "national", uzbek: true, minutes: 60,
    note: {
      uz: "Guruch va go'sht miqdoriga qarab farq qiladi.",
      ru: "Зависит от количества риса и мяса.",
      en: "Varies with how much rice and meat go in.",
    },
    ingredients: {
      uz: ["Guruch 50g", "Mol go'shti 80g", "Kartoshka, sabzi, pomidor"],
      ru: ["Рис 50 г", "Говядина 80 г", "Картофель, морковь, помидор"],
      en: ["Rice 50g", "Beef 80g", "Potato, carrot, tomato"],
    },
  }),
  dish("chuchvara", { uz: "Chuchvara", ru: "Чучвара", en: "Chuchvara dumplings" }, "🥟", 300, [420, 48, 20, 16], {
    cat: "national", uzbek: true, minutes: 70,
    note: {
      uz: "Sho'rvada berilgani yengilroq, qovurilgani ~150 kcal og'irroq.",
      ru: "В бульоне легче, жареная примерно на 150 ккал тяжелее.",
      en: "Lighter in broth; fried adds roughly 150 kcal.",
    },
    ingredients: {
      uz: ["Xamir 150g", "Mol fars 80g", "Piyoz", "Qatiq yoki bulyon"],
      ru: ["Тесто 150 г", "Фарш 80 г", "Лук", "Катык или бульон"],
      en: ["Dough 150g", "Minced beef 80g", "Onion", "Yoghurt or broth"],
    },
  }),
  dish("dimlama", { uz: "Dimlama", ru: "Димлама", en: "Dimlama" }, "🍲", 350, [385, 32, 21, 19], {
    cat: "national", uzbek: true, minutes: 100,
    note: {
      uz: "Sabzavot ko'p bo'lgani uchun milliy taomlar orasida yengilroqlaridan.",
      ru: "Из-за большого количества овощей — одно из более лёгких национальных блюд.",
      en: "One of the lighter national dishes, thanks to all the vegetables.",
    },
    ingredients: {
      uz: ["Mol go'shti 120g", "Kartoshka, karam, sabzi, pomidor", "Piyoz, ko'katlar"],
      ru: ["Говядина 120 г", "Картофель, капуста, морковь, помидор", "Лук, зелень"],
      en: ["Beef 120g", "Potato, cabbage, carrot, tomato", "Onion, herbs"],
    },
  }),
  dish("kabob", { uz: "Shashlik (mol go'shti)", ru: "Шашлык (говядина)", en: "Beef shashlik" }, "🍢", 150, [330, 2, 30, 23], {
    cat: "national", uzbek: true, minutes: 40,
    note: {
      uz: "2 sixcha. Qo'y go'shtidan ~90 kcal og'irroq bo'ladi.",
      ru: "2 шампура. Из баранины примерно на 90 ккал тяжелее.",
      en: "Two skewers. Lamb runs about 90 kcal heavier.",
    },
    ingredients: {
      uz: ["Mol go'shti 150g", "Piyoz", "Ziravor, sirka"],
      ru: ["Говядина 150 г", "Лук", "Специи, уксус"],
      en: ["Beef 150g", "Onion", "Spices, vinegar"],
    },
  }),
  dish("norin", { uz: "Norin", ru: "Норин", en: "Norin" }, "🍝", 300, [430, 46, 26, 15], {
    cat: "national", uzbek: true, minutes: 120,
    note: {
      uz: "Qazi bilan tayyorlangani ancha yog'liroq bo'ladi.",
      ru: "С казы получается заметно жирнее.",
      en: "Made with qazi it comes out noticeably fattier.",
    },
    ingredients: {
      uz: ["Xamir 150g", "Qaynatilgan go'sht 120g", "Piyoz", "Bulyon"],
      ru: ["Тесто 150 г", "Отварное мясо 120 г", "Лук", "Бульон"],
      en: ["Dough 150g", "Boiled meat 120g", "Onion", "Broth"],
    },
  }),
  dish("tovuq-guruch", { uz: "Grilangan tovuq + guruch", ru: "Курица гриль с рисом", en: "Grilled chicken with rice" }, "🍗", 250, [420, 45, 40, 8], {
    cat: "meat", minutes: 30, approx: false,
    note: {
      uz: "Moysiz pishirilgan variant uchun barqaror qiymat.",
      ru: "Стабильное значение для варианта без масла.",
      en: "A stable figure for the no-oil version.",
    },
    ingredients: {
      uz: ["Tovuq ko'krak 150g", "Jigarrang guruch 100g (pishgan)", "Limon, ziravorlar"],
      ru: ["Куриная грудка 150 г", "Бурый рис 100 г (варёный)", "Лимон, специи"],
      en: ["Chicken breast 150g", "Brown rice 100g (cooked)", "Lemon, spices"],
    },
  }),
  dish("omlet-avokado", { uz: "Omlet + avokado", ru: "Омлет с авокадо", en: "Omelette with avocado" }, "🥑", 220, [390, 8, 21, 32], {
    cat: "dairy", minutes: 12, approx: false,
    note: {
      uz: "Kam uglevodli nonushta uchun mos.",
      ru: "Подходит для низкоуглеводного завтрака.",
      en: "Suits a low-carb breakfast.",
    },
    ingredients: {
      uz: ["Tuxum 3 dona", "Avokado 1/2 dona", "Zaytun moyi 1 choy qoshiq", "Ko'katlar"],
      ru: ["Яйца 3 шт", "Авокадо 1/2", "Оливковое масло 1 ч. л.", "Зелень"],
      en: ["3 eggs", "Half an avocado", "1 tsp olive oil", "Herbs"],
    },
  }),
  dish("baliq-sabzavot", { uz: "Pechda baliq + sabzavot", ru: "Рыба с овощами в духовке", en: "Baked fish with vegetables" }, "🐟", 380, [340, 14, 36, 15], {
    cat: "fish", minutes: 35, approx: false,
    note: {
      uz: "Losos bilan ~420 kcal, oq baliq bilan ~290 kcal.",
      ru: "С лососем ~420 ккал, с белой рыбой ~290 ккал.",
      en: "About 420 kcal with salmon, 290 with white fish.",
    },
    ingredients: {
      uz: ["Baliq filesi 180g", "Brokkoli, sabzi, qalampir 200g", "Zaytun moyi", "Limon"],
      ru: ["Филе рыбы 180 г", "Брокколи, морковь, перец 200 г", "Оливковое масло", "Лимон"],
      en: ["Fish fillet 180g", "Broccoli, carrot, pepper 200g", "Olive oil", "Lemon"],
    },
  }),
  dish("tvorog-asal", { uz: "Tvorog + asal", ru: "Творог с мёдом", en: "Cottage cheese with honey" }, "🥣", 165, [180, 10, 24, 5], {
    cat: "dairy", minutes: 2, approx: false,
    note: {
      uz: "Past yog'li tvorog uchun barqaror qiymat.",
      ru: "Стабильное значение для нежирного творога.",
      en: "A stable figure for low-fat curd cheese.",
    },
    ingredients: {
      uz: ["Tvorog (5%) 150g", "Asal 1 osh qoshiq"],
      ru: ["Творог 5% 150 г", "Мёд 1 ст. л."],
      en: ["Curd cheese 5% 150g", "1 tbsp honey"],
    },
  }),
  dish("qatiq-meva", { uz: "Qatiq + meva + yong'oq", ru: "Катык с фруктами и орехами", en: "Yoghurt with fruit and nuts" }, "🫐", 315, [260, 26, 12, 12], {
    cat: "dairy", minutes: 3, approx: false,
    note: {
      uz: "Shirinsiz tabiiy qatiq uchun. Shakarli yogurt bilan +80 kcal.",
      ru: "Для натурального катыка без сахара. С сладким йогуртом +80 ккал.",
      en: "For plain unsweetened yoghurt. Sweetened adds about 80 kcal.",
    },
    ingredients: {
      uz: ["Tabiiy qatiq 200g", "Meva 100g", "Yong'oq 15g"],
      ru: ["Натуральный катык 200 г", "Фрукты 100 г", "Орехи 15 г"],
      en: ["Plain yoghurt 200g", "Fruit 100g", "Nuts 15g"],
    },
  }),
];

/* ---------------------------------------------------------------- products */

const PRODUCTS = [
  /* -- Uzbek staples, so the default list is recognisably local ----------- */
  product("tandir-non", { uz: "Tandir non", ru: "Тандырная лепёшка", en: "Tandoor bread" }, "🍞", "grain", [270, 53, 8.5, 2.5], 100, { uzbek: true }),
  product("patir", { uz: "Patir non", ru: "Патыр", en: "Patir bread" }, "🥯", "grain", [330, 50, 8, 11], 100, { uzbek: true }),
  product("qatiq", { uz: "Qatiq", ru: "Катык", en: "Katyk (yoghurt)" }, "🥛", "dairy", [60, 4.5, 3.3, 3.2], 200, { uzbek: true }),
  product("suzma", { uz: "Suzma", ru: "Сузьма", en: "Suzma (strained yoghurt)" }, "🥣", "dairy", [130, 4, 12, 7], 100, { uzbek: true }),
  product("qaymoq", { uz: "Qaymoq", ru: "Каймак", en: "Kaymak (clotted cream)" }, "🧈", "dairy", [300, 3, 2.5, 32], 30, { uzbek: true }),
  product("kurt", { uz: "Qurt", ru: "Курт", en: "Qurt (dried curd)" }, "⚪", "dairy", [280, 10, 30, 13], 20, { uzbek: true }),
  product("ayron", { uz: "Ayron", ru: "Айран", en: "Ayran" }, "🥤", "drink", [40, 3, 2, 2], 250, { uzbek: true }),
  product("achchiq-chuchuk", { uz: "Achchiq-chuchuk salat", ru: "Ачик-чучук", en: "Achichuk salad" }, "🥗", "veg", [30, 5, 1, 0.2], 150, { uzbek: true }),
  product("halva", { uz: "Holva", ru: "Халва", en: "Halva" }, "🍬", "sweet", [510, 50, 12, 30], 40, { uzbek: true }),
  product("navvot", { uz: "Navvot", ru: "Навот", en: "Rock sugar" }, "🍯", "sweet", [390, 99, 0, 0], 15, { uzbek: true }),
  product("parvarda", { uz: "Parvarda", ru: "Парварда", en: "Parvarda sweets" }, "🍬", "sweet", [380, 95, 0.2, 0], 20, { uzbek: true }),
  product("ko-k-choy", { uz: "Ko'k choy (shakarsiz)", ru: "Зелёный чай без сахара", en: "Green tea, unsweetened" }, "🍵", "drink", [1, 0.2, 0, 0], 250, { uzbek: true }),

  /* -- meat and poultry --------------------------------------------------- */
  product("tovuq-kokrak", { uz: "Tovuq ko'krak (pishgan)", ru: "Куриная грудка (варёная)", en: "Chicken breast (cooked)" }, "🍗", "meat", [165, 0, 31, 3.6], 150),
  product("tovuq-son", { uz: "Tovuq son (pishgan)", ru: "Куриное бедро (варёное)", en: "Chicken thigh (cooked)" }, "🍗", "meat", [209, 0, 26, 11], 150),
  product("tovuq-qovurilgan", { uz: "Qovurilgan tovuq (teri bilan)", ru: "Жареная курица с кожей", en: "Fried chicken with skin" }, "🍗", "meat", [240, 0, 27, 14], 150),
  product("mol-goshti", { uz: "Mol go'shti (yog'siz, pishgan)", ru: "Говядина постная (варёная)", en: "Lean beef (cooked)" }, "🥩", "meat", [250, 0, 26, 15], 150),
  product("mol-farsh", { uz: "Mol farshi (pishgan)", ru: "Говяжий фарш (жареный)", en: "Ground beef (cooked)" }, "🥩", "meat", [254, 0, 26, 17], 120),
  product("qoy-goshti", { uz: "Qo'y go'shti (pishgan)", ru: "Баранина (варёная)", en: "Lamb (cooked)" }, "🍖", "meat", [294, 0, 25, 21], 150),
  product("jigar", { uz: "Mol jigari", ru: "Говяжья печень", en: "Beef liver" }, "🥩", "meat", [175, 5, 27, 5], 120),
  product("kolbasa", { uz: "Pishgan kolbasa", ru: "Варёная колбаса", en: "Boiled sausage" }, "🌭", "meat", [300, 3, 12, 27], 50),
  product("sosiska", { uz: "Sosiska", ru: "Сосиски", en: "Frankfurters" }, "🌭", "meat", [270, 3, 11, 24], 100),
  product("vetchina", { uz: "Vetchina", ru: "Ветчина", en: "Ham" }, "🥓", "meat", [145, 1.5, 21, 6], 50),

  /* -- fish --------------------------------------------------------------- */
  product("losos", { uz: "Losos (semga)", ru: "Лосось", en: "Salmon" }, "🐟", "fish", [208, 0, 20, 13], 150),
  product("tunets", { uz: "Tunets (suvda, konserva)", ru: "Тунец в собственном соку", en: "Tuna in water" }, "🐟", "fish", [116, 0, 26, 1], 100),
  product("skumbriya", { uz: "Skumbriya", ru: "Скумбрия", en: "Mackerel" }, "🐟", "fish", [205, 0, 19, 14], 150),
  product("oq-baliq", { uz: "Oq baliq (sudak)", ru: "Судак", en: "Pike perch" }, "🐟", "fish", [92, 0, 19, 1.2], 150),
  product("karp", { uz: "Zog'ora baliq (karp)", ru: "Карп", en: "Carp" }, "🐟", "fish", [127, 0, 18, 5.6], 150),
  product("krevetka", { uz: "Krevetka", ru: "Креветки", en: "Shrimp" }, "🍤", "fish", [99, 0.2, 24, 0.3], 100),

  /* -- eggs and dairy ------------------------------------------------------ */
  product("tuxum", { uz: "Tuxum (qaynatilgan)", ru: "Яйцо варёное", en: "Boiled egg" }, "🥚", "dairy", [155, 1.1, 13, 11], 50),
  product("tuxum-oqi", { uz: "Tuxum oqi", ru: "Яичный белок", en: "Egg white" }, "🥚", "dairy", [52, 0.7, 11, 0.2], 33),
  product("sut25", { uz: "Sut 2.5%", ru: "Молоко 2,5%", en: "Milk 2.5%" }, "🥛", "dairy", [52, 4.8, 3, 2.5], 250),
  product("kefir", { uz: "Kefir 1%", ru: "Кефир 1%", en: "Kefir 1%" }, "🥛", "dairy", [40, 4, 3, 1], 250),
  product("tvorog5", { uz: "Tvorog 5%", ru: "Творог 5%", en: "Curd cheese 5%" }, "🧀", "dairy", [121, 3, 17, 5], 150),
  product("tvorog9", { uz: "Tvorog 9%", ru: "Творог 9%", en: "Curd cheese 9%" }, "🧀", "dairy", [169, 3, 16, 9], 150),
  product("grek-yogurt", { uz: "Yunon yogurti (shirinsiz)", ru: "Греческий йогурт без сахара", en: "Greek yoghurt, plain" }, "🥣", "dairy", [59, 3.6, 10, 0.4], 170),
  product("pishloq", { uz: "Qattiq pishloq", ru: "Твёрдый сыр", en: "Hard cheese" }, "🧀", "dairy", [356, 1.3, 25, 28], 30),
  product("mozzarella", { uz: "Mosarella", ru: "Моцарелла", en: "Mozzarella" }, "🧀", "dairy", [280, 3, 22, 20], 50),
  product("sariyog", { uz: "Sariyog'", ru: "Сливочное масло", en: "Butter" }, "🧈", "dairy", [717, 0.1, 0.9, 81], 10),
  product("smetana", { uz: "Smetana 20%", ru: "Сметана 20%", en: "Sour cream 20%" }, "🥣", "dairy", [206, 3.4, 2.8, 20], 30),

  /* -- grains, bread, potato ---------------------------------------------- */
  product("oq-guruch", { uz: "Oq guruch (pishgan)", ru: "Белый рис (варёный)", en: "White rice (cooked)" }, "🍚", "grain", [130, 28, 2.7, 0.3], 150),
  product("jigarrang-guruch", { uz: "Jigarrang guruch (pishgan)", ru: "Бурый рис (варёный)", en: "Brown rice (cooked)" }, "🍚", "grain", [123, 26, 2.7, 1], 150),
  product("grechka", { uz: "Grechka (pishgan)", ru: "Гречка (варёная)", en: "Buckwheat (cooked)" }, "🥣", "grain", [92, 20, 3.4, 0.6], 150),
  product("suli", { uz: "Suli yormasi (quruq)", ru: "Овсяные хлопья (сухие)", en: "Oats (dry)" }, "🥣", "grain", [389, 66, 17, 7], 50),
  product("suli-botqa", { uz: "Suli bo'tqasi (suvda)", ru: "Овсянка на воде", en: "Porridge on water" }, "🥣", "grain", [71, 12, 2.5, 1.5], 250),
  product("makaron", { uz: "Makaron (pishgan)", ru: "Макароны (варёные)", en: "Pasta (cooked)" }, "🍝", "grain", [131, 25, 5, 1.1], 200),
  product("oq-non", { uz: "Oq non", ru: "Белый хлеб", en: "White bread" }, "🍞", "grain", [265, 49, 9, 3.2], 50),
  product("qora-non", { uz: "Qora non", ru: "Чёрный хлеб", en: "Rye bread" }, "🍞", "grain", [250, 48, 8, 3.3], 50),
  product("bulgur", { uz: "Bulg'ur (pishgan)", ru: "Булгур (варёный)", en: "Bulgur (cooked)" }, "🥣", "grain", [83, 19, 3, 0.2], 150),
  product("kartoshka", { uz: "Kartoshka (qaynatilgan)", ru: "Картофель варёный", en: "Boiled potato" }, "🥔", "grain", [87, 20, 2, 0.1], 200),
  product("fri", { uz: "Kartoshka fri", ru: "Картофель фри", en: "French fries" }, "🍟", "fast", [312, 41, 3.4, 15], 120),
  product("noxat", { uz: "No'xat (pishgan)", ru: "Нут (варёный)", en: "Chickpeas (cooked)" }, "🫘", "grain", [164, 27, 9, 2.6], 150),
  product("loviya", { uz: "Loviya (pishgan)", ru: "Фасоль (варёная)", en: "Beans (cooked)" }, "🫘", "grain", [127, 23, 9, 0.5], 150),
  product("yasmiq", { uz: "Yasmiq (pishgan)", ru: "Чечевица (варёная)", en: "Lentils (cooked)" }, "🫘", "grain", [116, 20, 9, 0.4], 150),
  product("tofu", { uz: "Tofu", ru: "Тофу", en: "Tofu" }, "🧊", "grain", [76, 1.9, 8, 4.8], 100),

  /* -- vegetables ---------------------------------------------------------- */
  product("pomidor", { uz: "Pomidor", ru: "Помидор", en: "Tomato" }, "🍅", "veg", [18, 3.9, 0.9, 0.2], 120),
  product("bodring", { uz: "Bodring", ru: "Огурец", en: "Cucumber" }, "🥒", "veg", [15, 3.6, 0.7, 0.1], 120),
  product("sabzi", { uz: "Sabzi", ru: "Морковь", en: "Carrot" }, "🥕", "veg", [41, 10, 0.9, 0.2], 100),
  product("piyoz", { uz: "Piyoz", ru: "Лук", en: "Onion" }, "🧅", "veg", [40, 9, 1.1, 0.1], 80),
  product("karam", { uz: "Oq karam", ru: "Белокочанная капуста", en: "White cabbage" }, "🥬", "veg", [25, 6, 1.3, 0.1], 150),
  product("brokkoli", { uz: "Brokkoli", ru: "Брокколи", en: "Broccoli" }, "🥦", "veg", [34, 7, 2.8, 0.4], 150),
  product("qalampir", { uz: "Bolgar qalampiri", ru: "Болгарский перец", en: "Bell pepper" }, "🫑", "veg", [31, 6, 1, 0.3], 120),
  product("baqlajon", { uz: "Baqlajon", ru: "Баклажан", en: "Aubergine" }, "🍆", "veg", [25, 6, 1, 0.2], 150),
  product("qovoq", { uz: "Qovoq", ru: "Кабачок", en: "Courgette" }, "🥒", "veg", [16, 3.4, 1.2, 0.2], 150),
  product("oshqovoq", { uz: "Oshqovoq", ru: "Тыква", en: "Pumpkin" }, "🎃", "veg", [26, 6.5, 1, 0.1], 150),
  product("ismaloq", { uz: "Ismaloq", ru: "Шпинат", en: "Spinach" }, "🥬", "veg", [23, 3.6, 2.9, 0.4], 100),
  product("salat", { uz: "Ko'k salat", ru: "Салат листовой", en: "Lettuce" }, "🥬", "veg", [15, 2.9, 1.4, 0.2], 80),
  product("turp", { uz: "Turp", ru: "Редис", en: "Radish" }, "🥕", "veg", [16, 3.4, 0.7, 0.1], 100),
  product("sarimsoq", { uz: "Sarimsoq", ru: "Чеснок", en: "Garlic" }, "🧄", "veg", [149, 33, 6.4, 0.5], 10),
  product("zamburug", { uz: "Zamburug' (shampinyon)", ru: "Шампиньоны", en: "Mushrooms" }, "🍄", "veg", [22, 3.3, 3.1, 0.3], 150),

  /* -- fruit --------------------------------------------------------------- */
  product("olma", { uz: "Olma", ru: "Яблоко", en: "Apple" }, "🍎", "fruit", [52, 14, 0.3, 0.2], 180),
  product("banan", { uz: "Banan", ru: "Банан", en: "Banana" }, "🍌", "fruit", [89, 23, 1.1, 0.3], 120),
  product("uzum", { uz: "Uzum", ru: "Виноград", en: "Grapes" }, "🍇", "fruit", [69, 18, 0.7, 0.2], 150),
  product("qovun", { uz: "Qovun", ru: "Дыня", en: "Melon" }, "🍈", "fruit", [34, 8, 0.8, 0.2], 200),
  product("tarvuz", { uz: "Tarvuz", ru: "Арбуз", en: "Watermelon" }, "🍉", "fruit", [30, 8, 0.6, 0.2], 300),
  product("shaftoli", { uz: "Shaftoli", ru: "Персик", en: "Peach" }, "🍑", "fruit", [39, 10, 0.9, 0.3], 150),
  product("orik", { uz: "O'rik", ru: "Абрикос", en: "Apricot" }, "🍑", "fruit", [48, 11, 1.4, 0.4], 100),
  product("anor", { uz: "Anor", ru: "Гранат", en: "Pomegranate" }, "🍎", "fruit", [83, 19, 1.7, 1.2], 150),
  product("nok", { uz: "Nok", ru: "Груша", en: "Pear" }, "🍐", "fruit", [57, 15, 0.4, 0.1], 180),
  product("apelsin", { uz: "Apelsin", ru: "Апельсин", en: "Orange" }, "🍊", "fruit", [47, 12, 0.9, 0.1], 150),
  product("qulupnay", { uz: "Qulupnay", ru: "Клубника", en: "Strawberry" }, "🍓", "fruit", [32, 8, 0.7, 0.3], 150),
  product("xurmo", { uz: "Xurmo (quritilgan)", ru: "Финики сушёные", en: "Dried dates" }, "🌴", "fruit", [282, 75, 2.5, 0.4], 40),
  product("mayiz", { uz: "Mayiz", ru: "Изюм", en: "Raisins" }, "🍇", "fruit", [299, 79, 3.1, 0.5], 40),
  product("quruq-orik", { uz: "Quritilgan o'rik", ru: "Курага", en: "Dried apricots" }, "🍑", "fruit", [241, 63, 3.4, 0.5], 40),
  product("avokado", { uz: "Avokado", ru: "Авокадо", en: "Avocado" }, "🥑", "fruit", [160, 9, 2, 15], 100),

  /* -- nuts, seeds, fats --------------------------------------------------- */
  product("yongoq", { uz: "Yong'oq", ru: "Грецкий орех", en: "Walnuts" }, "🌰", "nut", [654, 14, 15, 65], 30),
  product("bodom", { uz: "Bodom", ru: "Миндаль", en: "Almonds" }, "🌰", "nut", [579, 22, 21, 50], 30),
  product("yeryongoq", { uz: "Yeryong'oq", ru: "Арахис", en: "Peanuts" }, "🥜", "nut", [567, 16, 26, 49], 30),
  product("pista", { uz: "Pista", ru: "Фисташки", en: "Pistachios" }, "🥜", "nut", [560, 28, 20, 45], 30),
  product("kungaboqar-urugi", { uz: "Kungaboqar urug'i", ru: "Семечки подсолнуха", en: "Sunflower seeds" }, "🌻", "nut", [584, 20, 21, 51], 30),
  product("yeryongoq-moyi", { uz: "Yeryong'oq moyi (pastasi)", ru: "Арахисовая паста", en: "Peanut butter" }, "🥜", "nut", [588, 20, 25, 50], 20),
  product("zaytun-moyi", { uz: "Zaytun moyi", ru: "Оливковое масло", en: "Olive oil" }, "🫒", "nut", [884, 0, 0, 100], 10),
  product("kungaboqar-moyi", { uz: "Kungaboqar moyi", ru: "Подсолнечное масло", en: "Sunflower oil" }, "🌻", "nut", [884, 0, 0, 100], 10),
  product("asal", { uz: "Asal", ru: "Мёд", en: "Honey" }, "🍯", "sweet", [304, 82, 0.3, 0], 20),

  /* -- drinks -------------------------------------------------------------- */
  product("qora-kofe", { uz: "Qora kofe (shakarsiz)", ru: "Чёрный кофе без сахара", en: "Black coffee" }, "☕", "drink", [2, 0, 0.3, 0], 200),
  product("kola", { uz: "Coca-Cola", ru: "Coca-Cola", en: "Coca-Cola" }, "🥤", "drink", [42, 10.6, 0, 0], 330),
  product("apelsin-sharbat", { uz: "Apelsin sharbati", ru: "Апельсиновый сок", en: "Orange juice" }, "🧃", "drink", [45, 10, 0.7, 0.2], 250),
  product("energetik", { uz: "Energetik ichimlik", ru: "Энергетик", en: "Energy drink" }, "🥫", "drink", [45, 11, 0, 0], 250),
  product("protein-kukun", { uz: "Protein kukuni", ru: "Протеиновый порошок", en: "Whey protein powder" }, "💪", "drink", [375, 8, 78, 4], 30),

  /* -- fast food ----------------------------------------------------------- */
  product("gamburger", { uz: "Gamburger", ru: "Гамбургер", en: "Hamburger" }, "🍔", "fast", [295, 30, 17, 12], 110),
  product("chizburger", { uz: "Chizburger", ru: "Чизбургер", en: "Cheeseburger" }, "🍔", "fast", [303, 27, 16, 15], 120),
  product("pitsa", { uz: "Pitsa (Margarita)", ru: "Пицца «Маргарита»", en: "Pizza margherita" }, "🍕", "fast", [266, 33, 11, 10], 120),
  product("lavash", { uz: "Lavash (tovuqli)", ru: "Лаваш с курицей", en: "Chicken lavash wrap" }, "🌯", "fast", [215, 20, 12, 10], 250),
  product("shaurma", { uz: "Shaurma", ru: "Шаурма", en: "Shawarma" }, "🌯", "fast", [230, 18, 13, 12], 250),
  product("hot-dog", { uz: "Hot-dog", ru: "Хот-дог", en: "Hot dog" }, "🌭", "fast", [290, 27, 11, 15], 100),
  product("nagets", { uz: "Nagets", ru: "Наггетсы", en: "Chicken nuggets" }, "🍗", "fast", [296, 16, 15, 20], 100),

  /* -- sweets -------------------------------------------------------------- */
  product("sut-shokolad", { uz: "Sutli shokolad", ru: "Молочный шоколад", en: "Milk chocolate" }, "🍫", "sweet", [535, 59, 7.6, 30], 30),
  product("qora-shokolad", { uz: "Qora shokolad 70%", ru: "Тёмный шоколад 70%", en: "Dark chocolate 70%" }, "🍫", "sweet", [598, 46, 7.8, 43], 30),
  product("muzqaymoq", { uz: "Muzqaymoq", ru: "Мороженое", en: "Ice cream" }, "🍦", "sweet", [207, 24, 3.5, 11], 100),
  product("pechenye", { uz: "Pechenye", ru: "Печенье", en: "Biscuits" }, "🍪", "sweet", [480, 64, 6, 22], 30),
  product("tort", { uz: "Tort (kremli)", ru: "Торт с кремом", en: "Cream cake" }, "🍰", "sweet", [370, 45, 4.5, 19], 100),
  product("shakar", { uz: "Shakar", ru: "Сахар", en: "Sugar" }, "🧂", "sweet", [387, 100, 0, 0], 10),
];

/**
 * Local food leads. Sort is stable, so the authored order survives inside each
 * group — which is what makes the first screenful (before "show more") land on
 * national dishes and Uzbek staples rather than on whatever happened to be
 * typed first.
 */
export const FOODS = [...DISHES, ...PRODUCTS].sort(
  (a, b) => Number(Boolean(b.uzbek)) - Number(Boolean(a.uzbek))
);

/** [kcal, carbs, protein, fat] → named fields, scaled by `factor`. */
export function macros(food, factor = 1) {
  const [kcal, carbs, protein, fat] = food.macros;
  return {
    kcal: Math.round(kcal * factor),
    carbs: Math.round(carbs * factor),
    protein: Math.round(protein * factor),
    fat: Math.round(fat * factor),
  };
}

/** What one default serving costs — the figure shown in the list. */
export const servingMacros = (food) =>
  food.kind === "dish" ? macros(food) : macros(food, food.servingG / 100);

export const foodName = (food, lang) => food.n[lang] || food.n.uz;

/**
 * Search runs across all three names on purpose: people type "tvorog" on a
 * Russian keyboard, "creatine" in English and "guruch" in Uzbek regardless of
 * which language the interface happens to be in.
 */
export function filterFoods(category, search) {
  const q = search.trim().toLowerCase();
  return FOODS.filter((f) => {
    if (category !== "all" && f.cat !== category) return false;
    if (!q) return true;
    return Object.values(f.n).some((name) => name.toLowerCase().includes(q));
  });
}

export const FOOD_BY_ID = Object.fromEntries(FOODS.map((f) => [f.id, f]));
