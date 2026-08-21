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
 * Numbers are stored as [kcal, carbs, protein, fat] to keep the list readable;
 * `macros()` unpacks them.
 *
 * The four figures should reconcile at 4/4/9 kcal per gram. Fruit and vegetables
 * are the honest exception: composition tables count fibre as carbohydrate, and
 * fibre yields almost nothing, so spinach and mushrooms overshoot by a quarter
 * and are still right. Anywhere else a mismatch is a typo.
 */

import { PRODUCT_COMPOSITION } from "./foodComposition.js";

/* Category ids are stable; the labels are looked up per language. */
export const CATEGORIES = ["all", "national", "meat", "fish", "dairy", "grain", "veg", "fruit", "nut", "oil", "sweet", "drink", "fast"];

const dish = (id, n, emoji, portionG, macros, opts = {}) => ({
  id, kind: "dish", n, emoji, portionG, macros, approx: true, ...opts,
});

// Products get their benefit/harm read from the shared lookup by default —
// one line here beats spreading a `composition` field across 100+ literal
// calls. `opts` can still override it, though nothing currently does.
const product = (id, n, emoji, cat, macros, servingG, opts = {}) => ({
  id, kind: "product", n, emoji, cat, macros, servingG, approx: false,
  composition: PRODUCT_COMPOSITION[id], ...opts,
});

/* ------------------------------------------------------------------ dishes */

const DISHES = [
  dish("osh", { uz: "Osh (palov)", ru: "Плов", en: "Plov (pilaf)" }, "🍚", 350, [730, 73, 30, 36], {
    cat: "national", uzbek: true, minutes: 90,
    note: {
      uz: "Bir tovoq (350 g). Uy retseptiga qarab 600-850 kcal oralig'ida — yog' va go'sht miqdoriga bog'liq.",
      ru: "Одна тарелка (350 г). В зависимости от рецепта — от 600 до 850 ккал: всё решает количество масла и мяса.",
      en: "One plate (350g). Anywhere from 600 to 850 kcal depending on the recipe — oil and meat decide it.",
    },
    composition: {
      benefits: {
        uz: ["Guruch uzoq quvvat beruvchi uglevod beradi"],
        ru: ["Рис даёт долгую энергию за счёт углеводов"],
        en: ["Rice gives slow-release, long-lasting energy"],
      },
      harms: {
        uz: ["Qozonda erigan yog' miqdori yuqori bo'lishi mumkin", "Katta porsiya kaloriya jihatdan zich"],
        ru: ["В казане может быть много растопленного жира", "Большая порция калорийно очень плотная"],
        en: ["Can carry a lot of rendered oil from the pot", "A full plate is calorie-dense"],
      },
    },
    ingredients: {
      uz: ["Guruch 120g", "Mol yoki qo'y go'shti 100g", "Sabzi 100g", "Piyoz, sarimsoq, ziravorlar"],
      ru: ["Рис 120 г", "Говядина или баранина 100 г", "Морковь 100 г", "Лук, чеснок, специи"],
      en: ["Rice 120g", "Beef or lamb 100g", "Carrot 100g", "Onion, garlic, spices"],
    },
    steps: {
      uz: [
        "Go'shtni bo'laklab, qozonda moyda qizartiring.",
        "Piyozni qo'shib oltin rangga chiqquncha qovuring.",
        "To'g'ralgan sabzini soling, 10 daqiqa dimlang — bu zirvak.",
        "Suv quyib, tuz-ziravor solib 30-40 daqiqa qaynating.",
        "Yuvilgan guruchni tekis yoyib soling, suv sathi barmoq bo'g'imicha bo'lsin.",
        "Kuchsiz otashda qopqoqni yopib 20-25 daqiqa dimlang, keyin aralashtirib tovoqqa oling.",
      ],
      ru: [
        "Нарежьте мясо и обжарьте в казане на масле.",
        "Добавьте лук, жарьте до золотистого цвета.",
        "Положите нарезанную морковь, тушите 10 минут — это зирвак.",
        "Залейте водой, посолите и поперчите, варите 30-40 минут.",
        "Промытый рис выложите ровным слоем, воды должно быть на палец выше.",
        "Накройте крышкой, томите на слабом огне 20-25 минут, затем перемешайте и подавайте.",
      ],
      en: [
        "Cut the meat into pieces and brown it in oil in a large pot.",
        "Add the onion and fry until golden.",
        "Add the chopped carrot and cook for 10 minutes — this is the zirvak base.",
        "Add water, salt and spices, simmer for 30-40 minutes.",
        "Spread the washed rice evenly on top; water should sit a finger's width above it.",
        "Cover and steam on low heat for 20-25 minutes, then mix through and serve.",
      ],
    },
  }),
  dish("lagmon", { uz: "Qovurma lag'mon", ru: "Лагман (жареный)", en: "Fried lagman" }, "🍜", 400, [700, 76, 32, 29], {
    cat: "national", uzbek: true, minutes: 60,
    note: {
      uz: "Qovurilgani — xamir yog'da qoviriladi. Sho'rvali lag'mon shu portsiyada ~250 kcal yengilroq.",
      ru: "Жареный — лапша обжаривается в масле. Суповой лагман в той же порции примерно на 250 ккал легче.",
      en: "The fried version — the noodles go through oil. Soup lagman is about 250 kcal lighter at the same portion.",
    },
    composition: {
      benefits: {
        uz: ["Sabzavot va oqsil bir tovoqda birga"],
        ru: ["Овощи и белок в одной тарелке"],
        en: ["Vegetables and protein together in one bowl"],
      },
      harms: {
        uz: ["Qovurishda ishlatilgan moy kaloriyani oshiradi"],
        ru: ["Масло при жарке заметно повышает калорийность"],
        en: ["The frying oil adds a real amount of fat"],
      },
    },
    ingredients: {
      uz: ["Lag'mon xamiri 150g", "Mol go'shti 100g", "Bolgar qalampiri, pomidor, sabzi"],
      ru: ["Лапша 150 г", "Говядина 100 г", "Болгарский перец, помидор, морковь"],
      en: ["Noodles 150g", "Beef 100g", "Pepper, tomato, carrot"],
    },
    steps: {
      uz: [
        "Go'shtni ingichka bo'laklab, qaynoq moyda tez qovuring.",
        "Piyoz, sabzi, bolgar qalampirini qo'shib 5 daqiqa qovuring.",
        "Pomidor va ziravorlarni solib, sous quyuqlashguncha qaynating.",
        "Lag'monni alohida qozonda qaynatib, suvini to'kib tashlang.",
        "Tayyor lag'monni sousga solib aralashtiring va issiq holida bering.",
      ],
      ru: [
        "Нарежьте мясо тонкими полосками и быстро обжарьте на сильном огне.",
        "Добавьте лук, морковь и болгарский перец, жарьте 5 минут.",
        "Положите помидоры и специи, тушите до загустения соуса.",
        "Отдельно отварите лапшу, слейте воду.",
        "Смешайте лапшу с соусом и подавайте горячим.",
      ],
      en: [
        "Slice the meat thin and sear it quickly in hot oil.",
        "Add onion, carrot and bell pepper, fry for 5 minutes.",
        "Add tomato and spices, simmer until the sauce thickens.",
        "Boil the noodles separately and drain.",
        "Toss the noodles through the sauce and serve hot.",
      ],
    },
  }),
  dish("somsa", { uz: "Go'shtli somsa", ru: "Самса с мясом", en: "Meat samsa" }, "🥟", 150, [405, 32, 16, 23], {
    cat: "national", uzbek: true, minutes: 45,
    note: {
      uz: "Bitta tandir somsasi (~150 g). Qatlamali xamirdan tayyorlangani yog'liroq bo'ladi.",
      ru: "Одна тандырная самса (~150 г). Из слоёного теста получается жирнее.",
      en: "One tandoor samsa (~150g). Made with puff pastry it comes out fattier.",
    },
    composition: {
      benefits: {
        uz: [],
        ru: [],
        en: [],
      },
      harms: {
        uz: ["Qatlamali xamir to'yingan yog'ga boy", "Kichik porsiyada ham tuz miqdori yuqori"],
        ru: ["Слоёное тесто богато насыщенным жиром", "Даже маленькая порция содержит много соли"],
        en: ["Puff pastry is high in saturated fat", "High in salt even for a small piece"],
      },
    },
    ingredients: {
      uz: ["Xamir 60g", "Mol/qo'y fars 50g", "Piyoz", "Ziravorlar"],
      ru: ["Тесто 60 г", "Фарш 50 г", "Лук", "Специи"],
      en: ["Pastry 60g", "Minced meat 50g", "Onion", "Spices"],
    },
    steps: {
      uz: [
        "Farsga mayda to'g'ralgan piyoz, tuz va ziravor qo'shib aralashtiring.",
        "Xamirni yupqa yoyib, kvadrat bo'laklarga bo'ling.",
        "Har biriga fars qo'yib, uchburchak yoki to'rtburchak qilib yoping.",
        "Tandirning devoriga yopishtirib yoki pechda 200°C da 25-30 daqiqa toblang.",
        "Qizarib chiqqach oling va biroz sovutib xizmat qiling.",
      ],
      ru: [
        "Смешайте фарш с мелко нарезанным луком, солью и специями.",
        "Раскатайте тесто тонко и нарежьте квадратами.",
        "На каждый положите фарш и защипните в треугольник или квадрат.",
        "Выпекайте в тандыре или в духовке при 200°C 25-30 минут.",
        "Достаньте, когда подрумянятся, и подавайте слегка остывшими.",
      ],
      en: [
        "Mix the minced meat with finely chopped onion, salt and spices.",
        "Roll the dough thin and cut it into squares.",
        "Spoon filling onto each square and seal into a triangle or pocket.",
        "Bake in a tandoor or oven at 200°C (400°F) for 25-30 minutes.",
        "Remove once golden and let cool slightly before serving.",
      ],
    },
  }),
  dish("manti", { uz: "Manti", ru: "Манты", en: "Manti" }, "🥟", 280, [655, 62, 31, 31], {
    cat: "national", uzbek: true, minutes: 90,
    note: {
      uz: "3 dona (~90 g dan). Qovoqli manti go'shtlisidan ~150 kcal yengilroq.",
      ru: "3 штуки (по ~90 г). Тыквенные манты примерно на 150 ккал легче мясных.",
      en: "3 pieces (~90g each). Pumpkin manti run about 150 kcal lighter than meat.",
    },
    composition: {
      benefits: {
        uz: ["Bug'da pishgani uchun qo'shimcha yog' ishlatilmaydi"],
        ru: ["Готовится на пару — жир дополнительно не добавляется"],
        en: ["Steamed, so no extra oil goes in during cooking"],
      },
      harms: {
        uz: ["Xamir ulushi uglevodni sezilarli oshiradi"],
        ru: ["Доля теста заметно повышает углеводы"],
        en: ["The dough share adds a good amount of carbs"],
      },
    },
    ingredients: {
      uz: ["Xamir", "Mol fars yoki qovoq + go'sht", "Piyoz", "Qatiq"],
      ru: ["Тесто", "Фарш или тыква с мясом", "Лук", "Катык"],
      en: ["Dough", "Minced meat or pumpkin and meat", "Onion", "Yoghurt"],
    },
    steps: {
      uz: [
        "Farsga mayda to'g'ralgan piyoz va ziravor aralashtiring.",
        "Xamirni yupqa doiralarga bo'ling, o'rtasiga fars qo'ying.",
        "Chetlarini yig'ib, tag qismi ochiq qolmasligiga ishonch hosil qilib yoping.",
        "Manti qozonining har qavatiga moylab, mantilarni bir-biriga tegmasdan tering.",
        "Qopqog'ini yopib 40-45 daqiqa bug'da pishiring.",
        "Qatiq yoki sarimsoqli sous bilan issiq holida bering.",
      ],
      ru: [
        "Смешайте фарш с мелко нарезанным луком и специями.",
        "Раскатайте тесто тонкими кружками, в центр положите фарш.",
        "Соберите края и защипните, чтобы дно оставалось закрытым.",
        "Смажьте ярусы мантоварки маслом и разложите манты, не касаясь друг друга.",
        "Накройте крышкой и готовьте на пару 40-45 минут.",
        "Подавайте горячими с катыком или чесночным соусом.",
      ],
      en: [
        "Mix the minced meat with finely chopped onion and spices.",
        "Roll the dough into thin rounds and spoon filling into the centre.",
        "Gather the edges and pinch shut so the base stays sealed.",
        "Oil each tier of the steamer and arrange the manti without touching.",
        "Cover and steam for 40-45 minutes.",
        "Serve hot with yoghurt or a garlic sauce.",
      ],
    },
  }),
  dish("shurpa", { uz: "Shurpa", ru: "Шурпа", en: "Shurpa" }, "🍲", 350, [320, 20, 22, 16], {
    cat: "national", uzbek: true, minutes: 120,
    note: {
      uz: "Yog'siz go'sht bilan ~250 kcal, yog'li qo'y go'shti bilan 450+ kcal.",
      ru: "С постным мясом ~250 ккал, с жирной бараниной 450+ ккал.",
      en: "About 250 kcal with lean meat, past 450 with fatty lamb.",
    },
    composition: {
      benefits: {
        uz: ["Sabzavotli, sug'oruvchi issiq taom"],
        ru: ["Овощной, наваристый горячий суп"],
        en: ["Vegetable-rich, warming hot soup"],
      },
      harms: {
        uz: ["Yog'li go'sht tanlansa kaloriya tez oshadi"],
        ru: ["С жирным мясом калорийность быстро растёт"],
        en: ["Calories climb fast if the meat cut is fatty"],
      },
    },
    ingredients: {
      uz: ["Suyakli go'sht 150g", "Kartoshka", "Sabzi", "Pomidor"],
      ru: ["Мясо на кости 150 г", "Картофель", "Морковь", "Помидор"],
      en: ["Bone-in meat 150g", "Potato", "Carrot", "Tomato"],
    },
    steps: {
      uz: [
        "Suyakli go'shtni sovuq suvga solib qaynating, ko'pigini olib turing.",
        "Qaynagach otashni pasaytirib 1.5-2 soat sekin qaynating.",
        "Yirik to'g'ralgan kartoshka, sabzi va pomidorni qo'shing.",
        "Tuz-ziravor solib, sabzavotlar yumshaguncha yana 20-25 daqiqa qaynating.",
        "Ko'katlar sepib, issiq holida likopchaga soling.",
      ],
      ru: [
        "Залейте мясо на кости холодной водой и доведите до кипения, снимая пену.",
        "После закипания убавьте огонь и варите 1.5-2 часа на медленном огне.",
        "Добавьте крупно нарезанные картофель, морковь и помидор.",
        "Посолите, поперчите и варите ещё 20-25 минут до мягкости овощей.",
        "Посыпьте зеленью и подавайте горячей.",
      ],
      en: [
        "Cover the bone-in meat with cold water and bring to a boil, skimming the foam.",
        "Once boiling, lower the heat and simmer gently for 1.5-2 hours.",
        "Add roughly chopped potato, carrot and tomato.",
        "Season and simmer another 20-25 minutes until the vegetables are soft.",
        "Sprinkle with herbs and serve hot.",
      ],
    },
  }),
  dish("mastava", { uz: "Mastava", ru: "Мастава", en: "Mastava" }, "🍜", 350, [290, 34, 15, 11], {
    cat: "national", uzbek: true, minutes: 60,
    note: {
      uz: "Guruch va go'sht miqdoriga qarab farq qiladi.",
      ru: "Зависит от количества риса и мяса.",
      en: "Varies with how much rice and meat go in.",
    },
    composition: {
      benefits: {
        uz: ["Guruch va sabzavot birga, sho'rvasi yengil"],
        ru: ["Рис и овощи вместе, суп получается лёгким"],
        en: ["Rice and vegetables together in a light broth"],
      },
      harms: {
        uz: ["Tuz miqdoriga e'tibor bering"],
        ru: ["Обратите внимание на количество соли"],
        en: ["Watch the salt — broths run high"],
      },
    },
    ingredients: {
      uz: ["Guruch 50g", "Mol go'shti 80g", "Kartoshka, sabzi, pomidor"],
      ru: ["Рис 50 г", "Говядина 80 г", "Картофель, морковь, помидор"],
      en: ["Rice 50g", "Beef 80g", "Potato, carrot, tomato"],
    },
    steps: {
      uz: [
        "Go'shtni mayda to'g'rab moyda qovuring.",
        "Piyoz va sabzini qo'shib 5 daqiqa qovuring.",
        "Suv quyib qaynating, kartoshka va pomidorni soling.",
        "Yuvilgan guruchni qo'shib, tuz-ziravor bilan yumshaguncha 20-25 daqiqa qaynating.",
        "Ko'katlar sepib issiq holida bering.",
      ],
      ru: [
        "Мелко нарежьте мясо и обжарьте на масле.",
        "Добавьте лук и морковь, жарьте 5 минут.",
        "Залейте водой, доведите до кипения, добавьте картофель и помидор.",
        "Всыпьте промытый рис, посолите и варите 20-25 минут до готовности.",
        "Посыпьте зеленью и подавайте горячим.",
      ],
      en: [
        "Finely dice the meat and brown it in oil.",
        "Add onion and carrot, fry for 5 minutes.",
        "Add water, bring to a boil, then add potato and tomato.",
        "Stir in washed rice, season, and simmer 20-25 minutes until tender.",
        "Sprinkle with herbs and serve hot.",
      ],
    },
  }),
  dish("chuchvara", { uz: "Chuchvara", ru: "Чучвара", en: "Chuchvara dumplings" }, "🥟", 300, [420, 48, 20, 16], {
    cat: "national", uzbek: true, minutes: 70,
    note: {
      uz: "Sho'rvada berilgani yengilroq, qovurilgani ~150 kcal og'irroq.",
      ru: "В бульоне легче, жареная примерно на 150 ккал тяжелее.",
      en: "Lighter in broth; fried adds roughly 150 kcal.",
    },
    composition: {
      benefits: {
        uz: ["Qaynatilgani uchun qo'shimcha yog' talab qilmaydi"],
        ru: ["Отварной вариант не требует дополнительного жира"],
        en: ["Boiled version needs no extra added fat"],
      },
      harms: {
        uz: ["Qovurib berilsa yog' miqdori sezilarli oshadi"],
        ru: ["В жареном виде жирность заметно выше"],
        en: ["Frying it adds a noticeable amount of fat"],
      },
    },
    ingredients: {
      uz: ["Xamir 150g", "Mol fars 80g", "Piyoz", "Qatiq yoki bulyon"],
      ru: ["Тесто 150 г", "Фарш 80 г", "Лук", "Катык или бульон"],
      en: ["Dough 150g", "Minced beef 80g", "Onion", "Yoghurt or broth"],
    },
    steps: {
      uz: [
        "Farsga mayda to'g'ralgan piyoz, tuz va murch qo'shing.",
        "Xamirni yupqa yoyib, mayda kvadratlarga bo'ling.",
        "Har biriga ozgina fars qo'yib, chuchvara shaklida yoping.",
        "Qaynayotgan tuzli suvga yoki bulyonga solib 8-10 daqiqa qaynating.",
        "Suzib oling, qatiq bilan yoki bulyonning o'zida issiq holida bering.",
      ],
      ru: [
        "Смешайте фарш с мелко нарезанным луком, солью и перцем.",
        "Раскатайте тесто тонко и нарежьте небольшими квадратами.",
        "На каждый положите немного фарша и защипните в форме чучвары.",
        "Отварите в кипящей подсоленной воде или бульоне 8-10 минут.",
        "Откиньте на дуршлаг и подавайте горячими с катыком или в бульоне.",
      ],
      en: [
        "Mix the minced meat with finely chopped onion, salt and pepper.",
        "Roll the dough thin and cut into small squares.",
        "Place a little filling on each and pinch into a small dumpling.",
        "Boil in salted water or broth for 8-10 minutes.",
        "Drain and serve hot with yoghurt, or straight in the broth.",
      ],
    },
  }),
  dish("dimlama", { uz: "Dimlama", ru: "Димлама", en: "Dimlama" }, "🍲", 350, [385, 32, 21, 19], {
    cat: "national", uzbek: true, minutes: 100,
    note: {
      uz: "Sabzavot ko'p bo'lgani uchun milliy taomlar orasida yengilroqlaridan.",
      ru: "Из-за большого количества овощей — одно из более лёгких национальных блюд.",
      en: "One of the lighter national dishes, thanks to all the vegetables.",
    },
    composition: {
      benefits: {
        uz: ["Sabzavot ulushi yuqori, qo'shimcha yog' deyarli ishlatilmaydi"],
        ru: ["Высокая доля овощей, масла добавляется по минимуму"],
        en: ["High vegetable share, barely any added oil"],
      },
      harms: {
        uz: ["Go'sht qavati baribir asosiy kaloriyani beradi"],
        ru: ["Слой мяса всё равно даёт основную калорийность"],
        en: ["The meat layer still carries most of the calories"],
      },
    },
    ingredients: {
      uz: ["Mol go'shti 120g", "Kartoshka, karam, sabzi, pomidor", "Piyoz, ko'katlar"],
      ru: ["Говядина 120 г", "Картофель, капуста, морковь, помидор", "Лук, зелень"],
      en: ["Beef 120g", "Potato, cabbage, carrot, tomato", "Onion, herbs"],
    },
    steps: {
      uz: [
        "Qozon tagiga moy surtib, go'shtni bir qavat qilib yoying.",
        "Ustiga piyoz, so'ng karam, sabzi, kartoshka va pomidorni qavat-qavat tering.",
        "Har qavatga ozgina tuz-ziravor sepib boring — aralashtirmang.",
        "Qopqog'ini zich yopib, kuchsiz otashda 1.5 soat dimlang.",
        "Qavatlarni buzmasdan likopchaga oling, ko'kat sepib bering.",
      ],
      ru: [
        "Смажьте дно казана маслом и выложите слой мяса.",
        "Сверху слоями выложите лук, капусту, морковь, картофель и помидор.",
        "Каждый слой слегка посолите и приправьте — не перемешивайте.",
        "Плотно накройте крышкой и томите на слабом огне 1.5 часа.",
        "Аккуратно переложите слоями на блюдо и посыпьте зеленью.",
      ],
      en: [
        "Oil the bottom of the pot and lay down a layer of meat.",
        "Layer onion, then cabbage, carrot, potato and tomato on top.",
        "Lightly season each layer — do not stir.",
        "Cover tightly and simmer on low heat for 1.5 hours.",
        "Lift out keeping the layers intact and finish with herbs.",
      ],
    },
  }),
  dish("kabob", { uz: "Shashlik (mol go'shti)", ru: "Шашлык (говядина)", en: "Beef shashlik" }, "🍢", 150, [330, 2, 30, 23], {
    cat: "national", uzbek: true, minutes: 40,
    note: {
      uz: "2 sixcha. Qo'y go'shtidan ~90 kcal og'irroq bo'ladi.",
      ru: "2 шампура. Из баранины примерно на 90 ккал тяжелее.",
      en: "Two skewers. Lamb runs about 90 kcal heavier.",
    },
    composition: {
      benefits: {
        uz: ["Yuqori sifatli oqsil, yog'ining ko'pi cho'g'ga tomchilaydi"],
        ru: ["Качественный белок, часть жира стекает на угли"],
        en: ["Quality protein — a good share of fat drips onto the coals"],
      },
      harms: {
        uz: ["Marinadda tuz miqdori yuqori bo'lishi mumkin"],
        ru: ["В маринаде может быть много соли"],
        en: ["The marinade can carry a lot of salt"],
      },
    },
    ingredients: {
      uz: ["Mol go'shti 150g", "Piyoz", "Ziravor, sirka"],
      ru: ["Говядина 150 г", "Лук", "Специи, уксус"],
      en: ["Beef 150g", "Onion", "Spices, vinegar"],
    },
    steps: {
      uz: [
        "Go'shtni bir xilda bo'laklab, halqa qilib to'g'ralgan piyoz bilan aralashtiring.",
        "Tuz, ziravor va bir oz sirka qo'shib, kamida 1-2 soat marinadga qo'ying.",
        "Bo'laklarni sixga zich qilib tering.",
        "Cho'g' ustida har tarafini aylantirib 12-15 daqiqa pishiring.",
        "Halqa piyoz va yangi sabzavot bilan issiq holida bering.",
      ],
      ru: [
        "Нарежьте мясо равными кусками и смешайте с луком, нарезанным кольцами.",
        "Добавьте соль, специи и немного уксуса, маринуйте минимум 1-2 часа.",
        "Плотно нанижите куски на шампур.",
        "Жарьте над углями, переворачивая, 12-15 минут.",
        "Подавайте горячим с луком и свежими овощами.",
      ],
      en: [
        "Cut the meat into even pieces and mix with onion rings.",
        "Add salt, spices and a splash of vinegar, marinate for at least 1-2 hours.",
        "Thread the pieces tightly onto skewers.",
        "Grill over coals, turning regularly, for 12-15 minutes.",
        "Serve hot with onion rings and fresh vegetables.",
      ],
    },
  }),
  dish("norin", { uz: "Norin", ru: "Норин", en: "Norin" }, "🍝", 300, [560, 62, 29, 22], {
    cat: "national", uzbek: true, minutes: 120,
    note: {
      uz: "Qazi bilan tayyorlangani ancha yog'liroq bo'ladi.",
      ru: "С казы получается заметно жирнее.",
      en: "Made with qazi it comes out noticeably fattier.",
    },
    composition: {
      benefits: {
        uz: ["Go'shti qaynatilgan, qo'shimcha yog'da qovurilmaydi"],
        ru: ["Мясо отварное, дополнительно на масле не жарится"],
        en: ["The meat is boiled, not fried in extra oil"],
      },
      harms: {
        uz: ["Xamir ulushi katta bo'lgani uchun uglevod yuqori"],
        ru: ["Большая доля теста даёт много углеводов"],
        en: ["A large dough share means high carbs"],
      },
    },
    ingredients: {
      uz: ["Xamir 150g", "Qaynatilgan go'sht 120g", "Piyoz", "Bulyon"],
      ru: ["Тесто 150 г", "Отварное мясо 120 г", "Лук", "Бульон"],
      en: ["Dough 150g", "Boiled meat 120g", "Onion", "Broth"],
    },
    steps: {
      uz: [
        "Go'shtni suvda yumshaguncha 1.5-2 soat qaynating, bulyonni saqlab qo'ying.",
        "Sovigach go'shtni mayda tolalarga ajrating.",
        "Xamirni yupqa yoyib, keng lentalarga kesib qaynatib oling.",
        "Xamirni go'sht bilan aralashtirib, ustiga yupqa halqa qilib to'g'ralgan piyoz soling.",
        "Bulyonni qaynatib piyoz ustiga quying — halqalar shu tarzda pishadi.",
        "Likopchaga solib, issiq bulyon bilan alohida bering.",
      ],
      ru: [
        "Отварите мясо до мягкости 1.5-2 часа, бульон сохраните.",
        "Остывшее мясо разберите на мелкие волокна.",
        "Раскатайте тесто тонко, нарежьте широкими лентами и отварите.",
        "Смешайте лапшу с мясом, сверху выложите тонко нарезанные кольца лука.",
        "Залейте лук кипящим бульоном — так кольца слегка проварятся.",
        "Разложите по тарелкам и подавайте с горячим бульоном отдельно.",
      ],
      en: [
        "Boil the meat until tender, 1.5-2 hours, and keep the broth.",
        "Once cool, shred the meat into fine strands.",
        "Roll the dough thin, cut into wide ribbons and boil.",
        "Mix the noodles with the meat, then top with thinly sliced onion rings.",
        "Pour boiling broth over the onion so the rings soften slightly.",
        "Plate it up and serve with hot broth on the side.",
      ],
    },
  }),
  dish("tovuq-guruch", { uz: "Grilangan tovuq + guruch", ru: "Курица гриль с рисом", en: "Grilled chicken with rice" }, "🍗", 250, [370, 26, 49, 6], {
    cat: "meat", minutes: 30, approx: false,
    note: {
      uz: "Moysiz pishirilgan variant uchun barqaror qiymat.",
      ru: "Стабильное значение для варианта без масла.",
      en: "A stable figure for the no-oil version.",
    },
    composition: {
      benefits: {
        uz: ["Yog'siz oqsil va murakkab uglevod balansi", "Yuqori to'yimlilik, past yog'"],
        ru: ["Баланс нежирного белка и сложных углеводов", "Хорошо насыщает при низком жире"],
        en: ["Balanced lean protein and complex carbs", "Filling with very little fat"],
      },
      harms: {
        uz: [],
        ru: [],
        en: [],
      },
    },
    ingredients: {
      uz: ["Tovuq ko'krak 150g", "Jigarrang guruch 100g (pishgan)", "Limon, ziravorlar"],
      ru: ["Куриная грудка 150 г", "Бурый рис 100 г (варёный)", "Лимон, специи"],
      en: ["Chicken breast 150g", "Brown rice 100g (cooked)", "Lemon, spices"],
    },
    steps: {
      uz: [
        "Tovuq ko'krakni limon sharbati va ziravorlarda 15 daqiqa marinadga qo'ying.",
        "Grill yoki tovada (moysiz yoki ozgina moy bilan) har tarafini 6-7 daqiqadan pishiring.",
        "Jigarrang guruchni ko'rsatmaga ko'ra qaynatib oling.",
        "Tovuqni bo'laklab, guruch yoniga qo'ying, limon bo'lagi bilan bering.",
      ],
      ru: [
        "Замаринуйте куриную грудку в лимонном соке со специями 15 минут.",
        "Обжарьте на гриле или сковороде (без масла или с малым количеством) по 6-7 минут с каждой стороны.",
        "Отварите бурый рис по инструкции на упаковке.",
        "Нарежьте курицу, выложите рядом с рисом и подавайте с долькой лимона.",
      ],
      en: [
        "Marinate the chicken breast in lemon juice and spices for 15 minutes.",
        "Grill or pan-sear (dry or with a touch of oil) 6-7 minutes per side.",
        "Cook the brown rice according to the package.",
        "Slice the chicken, plate it beside the rice, and serve with a lemon wedge.",
      ],
    },
  }),
  dish("omlet-avokado", { uz: "Omlet + avokado", ru: "Омлет с авокадо", en: "Omelette with avocado" }, "🥑", 220, [390, 8, 21, 32], {
    cat: "dairy", minutes: 12, approx: false,
    note: {
      uz: "Kam uglevodli nonushta uchun mos.",
      ru: "Подходит для низкоуглеводного завтрака.",
      en: "Suits a low-carb breakfast.",
    },
    composition: {
      benefits: {
        uz: ["Avokadodan sog'lom yog', tuxumdan to'liq oqsil"],
        ru: ["Полезные жиры из авокадо, полноценный белок из яиц"],
        en: ["Healthy fat from avocado, complete protein from eggs"],
      },
      harms: {
        uz: ["Kaloriya jihatdan zich — porsiyani nazorat qiling"],
        ru: ["Калорийно плотное — контролируйте порцию"],
        en: ["Calorie-dense — keep an eye on portion size"],
      },
    },
    ingredients: {
      uz: ["Tuxum 3 dona", "Avokado 1/2 dona", "Zaytun moyi 1 choy qoshiq", "Ko'katlar"],
      ru: ["Яйца 3 шт", "Авокадо 1/2", "Оливковое масло 1 ч. л.", "Зелень"],
      en: ["3 eggs", "Half an avocado", "1 tsp olive oil", "Herbs"],
    },
    steps: {
      uz: [
        "Tuxumlarni tuz bilan chayqating.",
        "Tovada zaytun moyini qizdirib, tuxumni quyib past otashda pishiring.",
        "Avokadoni bo'laklab omlet yoniga qo'ying.",
        "Ko'kat sepib darhol xizmat qiling.",
      ],
      ru: [
        "Взбейте яйца с щепоткой соли.",
        "Разогрейте оливковое масло на сковороде и вылейте яйца, готовьте на медленном огне.",
        "Нарежьте авокадо дольками и выложите рядом с омлетом.",
        "Посыпьте зеленью и подавайте сразу.",
      ],
      en: [
        "Whisk the eggs with a pinch of salt.",
        "Heat the olive oil in a pan, pour in the eggs and cook over low heat.",
        "Slice the avocado and plate it alongside the omelette.",
        "Sprinkle with herbs and serve right away.",
      ],
    },
  }),
  dish("baliq-sabzavot", { uz: "Pechda baliq + sabzavot", ru: "Рыба с овощами в духовке", en: "Baked fish with vegetables" }, "🐟", 380, [340, 14, 36, 15], {
    cat: "fish", minutes: 35, approx: false,
    note: {
      uz: "Losos bilan ~420 kcal, oq baliq bilan ~290 kcal.",
      ru: "С лососем ~420 ккал, с белой рыбой ~290 ккал.",
      en: "About 420 kcal with salmon, 290 with white fish.",
    },
    composition: {
      benefits: {
        uz: ["Omega-3 (losos bilan) va sabzavot tolasi birga"],
        ru: ["Омега-3 (с лососем) вместе с клетчаткой овощей"],
        en: ["Omega-3s (with salmon) alongside vegetable fibre"],
      },
      harms: {
        uz: [],
        ru: [],
        en: [],
      },
    },
    ingredients: {
      uz: ["Baliq filesi 180g", "Brokkoli, sabzi, qalampir 200g", "Zaytun moyi", "Limon"],
      ru: ["Филе рыбы 180 г", "Брокколи, морковь, перец 200 г", "Оливковое масло", "Лимон"],
      en: ["Fish fillet 180g", "Broccoli, carrot, pepper 200g", "Olive oil", "Lemon"],
    },
    steps: {
      uz: [
        "Pechni 200°C ga qizdiring.",
        "Baliq filesini tuz, murch va limon sharbati bilan ishqalang.",
        "Sabzavotlarni bo'laklab, zaytun moyida aralashtiring.",
        "Baliq va sabzavotlarni qog'ozga solib, 20-25 daqiqa pishiring.",
        "Ustidan limon siqib issiq holida bering.",
      ],
      ru: [
        "Разогрейте духовку до 200°C.",
        "Натрите рыбное филе солью, перцем и лимонным соком.",
        "Нарежьте овощи и смешайте с оливковым маслом.",
        "Выложите рыбу и овощи на противень с бумагой, запекайте 20-25 минут.",
        "Сбрызните лимоном и подавайте горячим.",
      ],
      en: [
        "Preheat the oven to 200°C (400°F).",
        "Rub the fish fillet with salt, pepper and lemon juice.",
        "Chop the vegetables and toss with olive oil.",
        "Arrange fish and vegetables on a lined tray and bake 20-25 minutes.",
        "Squeeze fresh lemon over the top and serve hot.",
      ],
    },
  }),
  dish("tvorog-asal", { uz: "Tvorog + asal", ru: "Творог с мёдом", en: "Cottage cheese with honey" }, "🥣", 165, [225, 17, 25, 7], {
    cat: "dairy", minutes: 2, approx: false,
    note: {
      uz: "Past yog'li tvorog uchun barqaror qiymat.",
      ru: "Стабильное значение для нежирного творога.",
      en: "A stable figure for low-fat curd cheese.",
    },
    composition: {
      benefits: {
        uz: ["Yuqori oqsil va kaltsiy manbai"],
        ru: ["Источник белка и кальция"],
        en: ["High in protein and calcium"],
      },
      harms: {
        uz: ["Asal qo'shimcha shakar qo'shadi"],
        ru: ["Мёд добавляет свободный сахар"],
        en: ["Honey adds free sugar to the total"],
      },
    },
    ingredients: {
      uz: ["Tvorog (5%) 150g", "Asal 1 osh qoshiq"],
      ru: ["Творог 5% 150 г", "Мёд 1 ст. л."],
      en: ["Curd cheese 5% 150g", "1 tbsp honey"],
    },
    steps: {
      uz: ["Tvorogni likopchaga soling.", "Ustidan asal quying va aralashtiring."],
      ru: ["Выложите творог в тарелку.", "Полейте мёдом и перемешайте."],
      en: ["Spoon the curd cheese into a bowl.", "Drizzle with honey and stir through."],
    },
  }),
  dish("qatiq-meva", { uz: "Qatiq + meva + yong'oq", ru: "Катык с фруктами и орехами", en: "Yoghurt with fruit and nuts" }, "🫐", 315, [260, 26, 12, 12], {
    cat: "dairy", minutes: 3, approx: false,
    note: {
      uz: "Shirinsiz tabiiy qatiq uchun. Shakarli yogurt bilan +80 kcal.",
      ru: "Для натурального катыка без сахара. С сладким йогуртом +80 ккал.",
      en: "For plain unsweetened yoghurt. Sweetened adds about 80 kcal.",
    },
    composition: {
      benefits: {
        uz: ["Probiotik qatiq va yong'oqdan sog'lom yog'"],
        ru: ["Пробиотики из катыка и полезный жир из орехов"],
        en: ["Probiotics from the yoghurt, healthy fat from the nuts"],
      },
      harms: {
        uz: ["Shirin meva ulushi shakarni oshiradi"],
        ru: ["Доля сладких фруктов повышает сахар"],
        en: ["The fruit share raises the natural sugar"],
      },
    },
    ingredients: {
      uz: ["Tabiiy qatiq 200g", "Meva 100g", "Yong'oq 15g"],
      ru: ["Натуральный катык 200 г", "Фрукты 100 г", "Орехи 15 г"],
      en: ["Plain yoghurt 200g", "Fruit 100g", "Nuts 15g"],
    },
    steps: {
      uz: ["Qatiqni likopchaga soling.", "Mevani bo'laklab, yong'oq bilan ustidan sepib bering."],
      ru: ["Выложите катык в тарелку.", "Нарежьте фрукты и посыпьте орехами сверху."],
      en: ["Spoon the yoghurt into a bowl.", "Slice the fruit and scatter the nuts on top."],
    },
  }),

  /**
   * Diet-style recipes: simple whole-food dishes built for a calorie/macro
   * target rather than a household tradition — the Mob Kitchen school of
   * cooking (few ingredients, quick steps, protein-forward) rather than the
   * national dishes above. `cat` is never "national" and `uzbek` is never
   * set for these, so the diet-plan builder and preset plans can prefer them
   * over the heavier, harder-to-portion national dishes.
   */
  dish("tuna-loviya-salat", { uz: "Tunets va loviya salati", ru: "Салат с тунцом и стручковой фасолью", en: "Tuna and green bean salad" }, "🥗", 300, [280, 13, 29, 12], {
    cat: "fish", minutes: 15, approx: false,
    note: {
      uz: "Konservadagi tunets suvda bo'lsa yengilroq, moyda bo'lsa ~40 kcal ko'proq.",
      ru: "Тунец в собственном соку легче, в масле — примерно на 40 ккал больше.",
      en: "Tuna in water is lighter; tuna in oil runs about 40 kcal more.",
    },
    composition: {
      benefits: {
        uz: ["Yog'siz oqsil va tolali sabzavot birga", "Omega-3 yog' kislotalari bor"],
        ru: ["Постный белок вместе с клетчаткой овощей", "Содержит омега-3 жирные кислоты"],
        en: ["Lean protein paired with fibre-rich vegetables", "Carries omega-3 fatty acids"],
      },
      harms: {
        uz: ["Konserva tunetsda tuz miqdori yuqori bo'lishi mumkin"],
        ru: ["В консервированном тунце может быть много соли"],
        en: ["Canned tuna can be high in added sodium"],
      },
    },
    ingredients: {
      uz: ["Tunets (suvda, konserva) 100g", "Yashil loviya 150g", "Pomidor 50g", "Zaytun moyi 1 osh qoshiq", "Limon sharbati"],
      ru: ["Тунец в собственном соку 100 г", "Стручковая фасоль 150 г", "Помидор 50 г", "Оливковое масло 1 ст. л.", "Лимонный сок"],
      en: ["Tuna in water 100g", "Green beans 150g", "Tomato 50g", "1 tbsp olive oil", "Lemon juice"],
    },
    steps: {
      uz: [
        "Loviyani qaynoq suvda 5-6 daqiqa qaynatib, sovuq suvda sovuting.",
        "Tunetsning suvini to'kib, yirik bo'laklarga ajrating.",
        "Loviya, tunets va bo'laklangan pomidorni idishga soling.",
        "Zaytun moyi va limon sharbati bilan aralashtirib darhol xizmat qiling.",
      ],
      ru: [
        "Отварите фасоль в кипятке 5-6 минут, затем остудите в холодной воде.",
        "Слейте жидкость с тунца и разомните крупными кусками.",
        "Выложите фасоль, тунец и нарезанный помидор в миску.",
        "Заправьте оливковым маслом и лимонным соком, подавайте сразу.",
      ],
      en: [
        "Boil the green beans for 5-6 minutes, then cool in cold water.",
        "Drain the tuna and break it into large flakes.",
        "Combine the beans, tuna and chopped tomato in a bowl.",
        "Dress with olive oil and lemon juice and serve right away.",
      ],
    },
  }),
  dish("noxat-salat", { uz: "O'rta yer dengizi noxat salati", ru: "Средиземноморский салат из нута", en: "Mediterranean chickpea salad" }, "🫘", 380, [440, 48, 19, 20], {
    cat: "grain", minutes: 15, approx: false,
    note: {
      uz: "Pishloq o'rniga suzma qo'yilsa taxminan 60 kcal kamayadi.",
      ru: "Если заменить сыр на сузьму — калорийность снижается примерно на 60 ккал.",
      en: "Swap the cheese for suzma and it comes down by about 60 kcal.",
    },
    composition: {
      benefits: {
        uz: ["No'xat o'simlik oqsili va tolaga boy", "Uzoq to'yimlilik beradi"],
        ru: ["Нут богат растительным белком и клетчаткой", "Хорошо насыщает надолго"],
        en: ["Chickpeas bring plant protein and fibre", "Keeps you full for longer"],
      },
      harms: {
        uz: ["Pishloq tuz va to'yingan yog' qo'shadi"],
        ru: ["Сыр добавляет соль и насыщенный жир"],
        en: ["The cheese adds salt and saturated fat"],
      },
    },
    ingredients: {
      uz: ["No'xat (pishgan) 150g", "Bodring 100g", "Pomidor 80g", "Yumshoq pishloq 30g", "Zaytun moyi 1 osh qoshiq", "Limon sharbati"],
      ru: ["Нут варёный 150 г", "Огурец 100 г", "Помидор 80 г", "Мягкий сыр 30 г", "Оливковое масло 1 ст. л.", "Лимонный сок"],
      en: ["Cooked chickpeas 150g", "Cucumber 100g", "Tomato 80g", "Soft cheese 30g", "1 tbsp olive oil", "Lemon juice"],
    },
    steps: {
      uz: [
        "No'xatni suvini to'kib, idishga soling.",
        "Bodring va pomidorni mayda kublab qo'shing.",
        "Pishloqni maydalab ustiga sepib, zaytun moyi va limon bilan aralashtiring.",
        "Darhol yoki 20 daqiqa sovutib xizmat qiling.",
      ],
      ru: [
        "Слейте жидкость с нута и переложите в миску.",
        "Нарежьте огурец и помидор мелкими кубиками, добавьте к нуту.",
        "Раскрошите сыр сверху, заправьте оливковым маслом и лимонным соком.",
        "Подавайте сразу или после 20 минут в холодильнике.",
      ],
      en: [
        "Drain the chickpeas and tip them into a bowl.",
        "Dice the cucumber and tomato and add them in.",
        "Crumble the cheese on top, then dress with olive oil and lemon.",
        "Serve right away, or chill for 20 minutes first.",
      ],
    },
  }),
  dish("tovuq-salat-orash", { uz: "Salat bargida tovuq", ru: "Курица в листьях салата", en: "Chicken lettuce wraps" }, "🥬", 280, [320, 6, 48, 11], {
    cat: "meat", minutes: 20, approx: false,
    note: {
      uz: "Non yoki lavash ishlatilmagani uchun oddiy lavashdan ~150 kcal yengilroq.",
      ru: "Без лаваша получается примерно на 150 ккал легче обычной шаурмы.",
      en: "No wrap or bread — about 150 kcal lighter than a regular lavash.",
    },
    composition: {
      benefits: {
        uz: ["Non o'rniga salat bargi — uglevodi juda past", "Yuqori oqsil, yengil taom"],
        ru: ["Лист салата вместо лаваша — очень мало углеводов", "Высокий белок, лёгкое блюдо"],
        en: ["Lettuce instead of bread keeps carbs very low", "High protein, light overall"],
      },
      harms: { uz: [], ru: [], en: [] },
    },
    ingredients: {
      uz: ["Tovuq ko'krak 150g", "Ko'k salat bargi 8 dona", "Sabzi, bodring (julienne) 80g", "Soya sousi, kunjut moyi"],
      ru: ["Куриная грудка 150 г", "Листья салата 8 шт", "Морковь, огурец соломкой 80 г", "Соевый соус, кунжутное масло"],
      en: ["Chicken breast 150g", "8 lettuce leaves", "Julienned carrot and cucumber 80g", "Soy sauce, sesame oil"],
    },
    steps: {
      uz: [
        "Tovuq ko'krakni tuzlab, tovada yoki grilda har tarafini 6-7 daqiqadan pishiring.",
        "Sovigach ingichka tilimlarga to'g'rang.",
        "Har bir salat bargiga tovuq va sabzavot julienne joylashtiring.",
        "Ustiga ozgina soya sousi va kunjut moyi tomizib, o'rab xizmat qiling.",
      ],
      ru: [
        "Посолите куриную грудку и обжарьте на сковороде или гриле по 6-7 минут с каждой стороны.",
        "Остывшую грудку нарежьте тонкими полосками.",
        "На каждый лист салата выложите курицу и овощи соломкой.",
        "Сбрызните соевым соусом и кунжутным маслом, сверните и подавайте.",
      ],
      en: [
        "Salt the chicken breast and pan-sear or grill 6-7 minutes per side.",
        "Once cool, slice it into thin strips.",
        "Fill each lettuce leaf with chicken and the julienned vegetables.",
        "Drizzle with soy sauce and sesame oil, wrap and serve.",
      ],
    },
  }),
  dish("mol-sabzavot-qovurma", { uz: "Mol go'shti va sabzavot qovurma", ru: "Говядина с овощами вок", en: "Beef and vegetable stir-fry" }, "🥩", 400, [450, 17, 50, 21], {
    cat: "meat", minutes: 20, approx: false,
    note: {
      uz: "Farsh o'rniga bo'lakli yog'siz go'sht ishlatilgani uchun kamroq yog'li.",
      ru: "Используется нежирное мясо кусочками, а не фарш — поэтому менее жирное.",
      en: "Made with lean cubed meat rather than mince, so it runs leaner.",
    },
    composition: {
      benefits: {
        uz: ["Yog'siz go'shtdan yuqori sifatli oqsil", "Brokkolidan C vitamini va tola"],
        ru: ["Качественный белок из постной говядины", "Витамин C и клетчатка из брокколи"],
        en: ["Quality protein from lean beef", "Vitamin C and fibre from the broccoli"],
      },
      harms: {
        uz: ["Kuchli otashda qovurish uchun moy miqdorini nazorat qiling"],
        ru: ["При жарке на сильном огне следите за количеством масла"],
        en: ["Keep an eye on the oil — high-heat searing tempts more than needed"],
      },
    },
    ingredients: {
      uz: ["Mol go'shti (yog'siz) 150g", "Brokkoli 150g", "Bolgar qalampiri 100g", "Sarimsoq, moy 1 osh qoshiq"],
      ru: ["Говядина постная 150 г", "Брокколи 150 г", "Болгарский перец 100 г", "Чеснок, масло 1 ст. л."],
      en: ["Lean beef 150g", "Broccoli 150g", "Bell pepper 100g", "Garlic, 1 tbsp oil"],
    },
    steps: {
      uz: [
        "Go'shtni ingichka tilimlab, qaynoq moyda 3-4 daqiqa tez qovuring.",
        "Sarimsoqni qo'shib 30 soniya qovuring.",
        "Brokkoli va qalampirni solib, kuchli otashda 4-5 daqiqa aralashtirib qovuring.",
        "Tuz-murch solib, sabzavot xiroz qarsillagan holida darhol xizmat qiling.",
      ],
      ru: [
        "Нарежьте мясо тонкими полосками и быстро обжарьте на сильном огне 3-4 минуты.",
        "Добавьте чеснок и жарьте 30 секунд.",
        "Положите брокколи и перец, жарьте на сильном огне 4-5 минут, помешивая.",
        "Посолите, поперчите и подавайте, пока овощи ещё слегка хрустящие.",
      ],
      en: [
        "Slice the beef thin and sear it fast over high heat, 3-4 minutes.",
        "Add the garlic and cook for 30 seconds.",
        "Add the broccoli and pepper, stir-fry over high heat 4-5 minutes.",
        "Season and serve while the vegetables are still a little crisp.",
      ],
    },
  }),
  dish("yasmiq-shorva", { uz: "Yasmiq sho'rva", ru: "Чечевичный суп", en: "Lentil vegetable soup" }, "🍲", 400, [350, 51, 19, 9], {
    cat: "grain", minutes: 35, approx: false,
    note: {
      uz: "Butunlay o'simlik mahsulotlaridan — vegetarian taom.",
      ru: "Полностью растительное блюдо — подходит вегетарианцам.",
      en: "Fully plant-based — works for a vegetarian day.",
    },
    composition: {
      benefits: {
        uz: ["Yasmiq o'simlik oqsili va tolaga juda boy", "Temir manbai"],
        ru: ["Чечевица богата растительным белком и клетчаткой", "Источник железа"],
        en: ["Lentils are rich in plant protein and fibre", "A good source of iron"],
      },
      harms: { uz: [], ru: [], en: [] },
    },
    ingredients: {
      uz: ["Yasmiq (quruq) 100g", "Sabzi 80g", "Pomidor 80g", "Piyoz, sarimsoq", "Zaytun moyi 1 osh qoshiq"],
      ru: ["Чечевица сухая 100 г", "Морковь 80 г", "Помидор 80 г", "Лук, чеснок", "Оливковое масло 1 ст. л."],
      en: ["Dry lentils 100g", "Carrot 80g", "Tomato 80g", "Onion, garlic", "1 tbsp olive oil"],
    },
    steps: {
      uz: [
        "Piyoz va sabzini mayda to'g'rab zaytun moyida 4-5 daqiqa qovuring.",
        "Yasmiqni yuvib qo'shing, ustiga suv quyib qaynating.",
        "Pomidor va sarimsoqni solib, kuchsiz otashda 20-25 daqiqa qaynating.",
        "Tuz-ziravor solib, yasmiq yumshaguncha pishirib issiq holida bering.",
      ],
      ru: [
        "Мелко нарежьте лук и морковь, обжарьте на оливковом масле 4-5 минут.",
        "Добавьте промытую чечевицу, залейте водой и доведите до кипения.",
        "Положите помидор и чеснок, варите на слабом огне 20-25 минут.",
        "Посолите и приправьте, варите до мягкости чечевицы и подавайте горячим.",
      ],
      en: [
        "Finely chop the onion and carrot, fry in olive oil for 4-5 minutes.",
        "Add the rinsed lentils, cover with water and bring to a boil.",
        "Add the tomato and garlic, simmer gently for 20-25 minutes.",
        "Season and cook until the lentils are soft, then serve hot.",
      ],
    },
  }),
  dish("tuxum-oqi-ismaloq", { uz: "Tuxum oqi va ismaloq", ru: "Яичные белки со шпинатом", en: "Egg white and spinach scramble" }, "🍳", 250, [145, 7, 22, 4], {
    cat: "dairy", minutes: 10, approx: false,
    note: {
      uz: "Faqat oqi ishlatilgani uchun to'liq tuxumga nisbatan yog'i ancha kam.",
      ru: "Используются только белки — жира заметно меньше, чем в цельных яйцах.",
      en: "Whites only, so the fat comes in well below whole eggs.",
    },
    composition: {
      benefits: {
        uz: ["Deyarli yog'siz, yuqori sifatli oqsil", "Ismaloqdan temir va vitamin K"],
        ru: ["Почти без жира, качественный белок", "Железо и витамин K из шпината"],
        en: ["Almost fat-free, high-quality protein", "Iron and vitamin K from the spinach"],
      },
      harms: { uz: [], ru: [], en: [] },
    },
    ingredients: {
      uz: ["Tuxum oqi 5 dona", "Ismaloq 100g", "Pomidor 50g", "Zaytun moyi spreyi"],
      ru: ["Яичные белки 5 шт", "Шпинат 100 г", "Помидор 50 г", "Спрей оливкового масла"],
      en: ["5 egg whites", "Spinach 100g", "Tomato 50g", "Olive oil spray"],
    },
    steps: {
      uz: [
        "Tovani ozgina zaytun moyi bilan qizdiring.",
        "Ismaloqni solib, so'lguncha 1-2 daqiqa qovuring.",
        "Tuxum oqini quyib, tuz sepib past otashda aralashtirib pishiring.",
        "Bo'lakli pomidor bilan darhol xizmat qiling.",
      ],
      ru: [
        "Разогрейте сковороду с небольшим количеством оливкового масла.",
        "Добавьте шпинат и обжарьте 1-2 минуты до увядания.",
        "Влейте яичные белки, посолите и готовьте на слабом огне, помешивая.",
        "Подавайте сразу с нарезанным помидором.",
      ],
      en: [
        "Heat a pan with a light spray of olive oil.",
        "Add the spinach and cook 1-2 minutes until wilted.",
        "Pour in the egg whites, season, and cook on low heat, stirring.",
        "Serve right away with the chopped tomato.",
      ],
    },
  }),
  dish("tungi-suli", { uz: "Tungi suli bo'tqasi", ru: "Овсянка на ночь", en: "Overnight oats with berries" }, "🥣", 320, [350, 48, 15, 12], {
    cat: "grain", minutes: 5, approx: false,
    note: {
      uz: "Kechqurun tayyorlab, muzlatgichda tunab qoldiriladi — ertalab tayyor bo'ladi.",
      ru: "Готовится вечером и настаивается в холодильнике всю ночь — утром готово.",
      en: "Made the night before and left in the fridge — ready by morning.",
    },
    composition: {
      benefits: {
        uz: ["Suli tolasi xolesterinni pasaytirishga yordam beradi", "Tayyorlash oson, ertalab shoshilmaydi"],
        ru: ["Клетчатка овса помогает снижать холестерин", "Готовится заранее — утром не нужно спешить"],
        en: ["Oat fibre helps lower cholesterol", "Prepped ahead, so mornings stay unhurried"],
      },
      harms: {
        uz: ["Shirin qo'shimchalar (asal, mayiz) qo'shsangiz shakar oshadi"],
        ru: ["Если добавить мёд или изюм — сахар заметно вырастет"],
        en: ["Sweet add-ins like honey or raisins push the sugar up"],
      },
    },
    ingredients: {
      uz: ["Suli yormasi 50g", "Kefir yoki sut 150g", "Qulupnay 100g", "Yong'oq 10g"],
      ru: ["Овсяные хлопья 50 г", "Кефир или молоко 150 г", "Клубника 100 г", "Орехи 10 г"],
      en: ["Rolled oats 50g", "Kefir or milk 150g", "Strawberries 100g", "Nuts 10g"],
    },
    steps: {
      uz: [
        "Suli yormasini idishga solib, kefir yoki sut bilan aralashtiring.",
        "Ustini yopib, muzlatgichda kamida 6 soat yoki tun bo'yi qoldiring.",
        "Ertalab bo'laklangan qulupnay va yong'oq bilan bezab xizmat qiling.",
      ],
      ru: [
        "Смешайте овсяные хлопья с кефиром или молоком в банке.",
        "Накройте и уберите в холодильник минимум на 6 часов или на ночь.",
        "Утром украсьте нарезанной клубникой и орехами и подавайте.",
      ],
      en: [
        "Mix the oats with kefir or milk in a jar.",
        "Cover and refrigerate for at least 6 hours, or overnight.",
        "In the morning, top with sliced strawberries and nuts and serve.",
      ],
    },
  }),
  dish("krevetka-qovurma", { uz: "Krevetka va sabzavot qovurma", ru: "Креветки с овощами вок", en: "Shrimp and vegetable stir-fry" }, "🍤", 390, [330, 12, 52, 9], {
    cat: "fish", minutes: 15, approx: false,
    note: {
      uz: "Krevetka tez pishadi — ortiqcha pishirilsa qattiqlashib qoladi.",
      ru: "Креветки готовятся быстро — при переготовке становятся резиновыми.",
      en: "Shrimp cook fast — overcook them and they turn rubbery.",
    },
    composition: {
      benefits: {
        uz: ["Juda yog'siz, yuqori sifatli dengiz oqsili", "Tez tayyorlanadi"],
        ru: ["Очень нежирный, качественный морской белок", "Готовится быстро"],
        en: ["Very lean, high-quality seafood protein", "Cooks in minutes"],
      },
      harms: {
        uz: ["Krevetkada xolesterin miqdori boshqa go'shtlarga nisbatan yuqoriroq"],
        ru: ["В креветках холестерина больше, чем в другом мясе"],
        en: ["Shrimp carries more cholesterol than most other meats"],
      },
    },
    ingredients: {
      uz: ["Krevetka (tozalangan) 200g", "Brokkoli 100g", "Bolgar qalampiri 80g", "Sarimsoq, moy 1 osh qoshiq"],
      ru: ["Креветки очищенные 200 г", "Брокколи 100 г", "Болгарский перец 80 г", "Чеснок, масло 1 ст. л."],
      en: ["Peeled shrimp 200g", "Broccoli 100g", "Bell pepper 80g", "Garlic, 1 tbsp oil"],
    },
    steps: {
      uz: [
        "Sarimsoqni qaynoq moyda 30 soniya qovuring.",
        "Brokkoli va qalampirni solib 3-4 daqiqa kuchli otashda qovuring.",
        "Krevetkani qo'shib, pushti rangga kirguncha 2-3 daqiqa qovuring.",
        "Tuz-murch solib darhol issiq holida xizmat qiling.",
      ],
      ru: [
        "Обжарьте чеснок на горячем масле 30 секунд.",
        "Добавьте брокколи и перец, жарьте на сильном огне 3-4 минуты.",
        "Положите креветки и жарьте 2-3 минуты до розового цвета.",
        "Посолите, поперчите и сразу подавайте горячим.",
      ],
      en: [
        "Fry the garlic in hot oil for 30 seconds.",
        "Add the broccoli and pepper, stir-fry over high heat 3-4 minutes.",
        "Add the shrimp and cook 2-3 minutes until pink.",
        "Season and serve hot right away.",
      ],
    },
  }),

  dish("shakarsiz-limonad", { uz: "Shakarsiz limonad", ru: "Лимонад без сахара", en: "Sugar-free lemonade" }, "🍋", 1000, [95, 25, 1, 0], {
    cat: "drink", minutes: 10, approx: true,
    note: {
      uz: "1 litrlik partiya — muzlatkichda 3 kungacha turadi, kerak paytda quyib ichishingiz mumkin.",
      ru: "Партия на 1 литр — хранится в холодильнике до 3 дней, наливайте по стакану по мере надобности.",
      en: "Makes a 1-litre batch — keeps in the fridge up to 3 days, pour a glass whenever you like.",
    },
    composition: {
      benefits: {
        uz: ["Qandli ichimliklarga arzon va shakarsiz muqobil", "Asal miqdori juda oz — deyarli erkin ichish mumkin"],
        ru: ["Дешёвая и без сахара альтернатива сладким напиткам", "Мёда совсем немного — можно пить почти свободно"],
        en: ["A cheap, sugar-free stand-in for soda", "Only a trace of honey — close to a free-calorie drink"],
      },
      harms: { uz: [], ru: [], en: [] },
    },
    ingredients: {
      uz: ["Limon 1 dona", "Asal 1 osh qoshiq", "Suv 1 litr", "Muz"],
      ru: ["Лимон 1 шт", "Мёд 1 ст. л.", "Вода 1 л", "Лёд"],
      en: ["1 lemon", "1 tbsp honey", "1 litre water", "Ice"],
    },
    steps: {
      uz: [
        "Limonni bo'laklarga bo'lib, asal va suv bilan blenderga soling.",
        "1 daqiqa yaxshilab aralashtiring, so'ng suzgichdan o'tkazing.",
        "Muzli idishga quying va sovutib ichishga tayyor.",
        "Qolganini muzlatkichda saqlang — 3 kungacha yaroqli.",
      ],
      ru: [
        "Порежьте лимон дольками и положите в блендер вместе с мёдом и водой.",
        "Взбивайте 1 минуту, затем процедите через сито.",
        "Разлейте по стаканам со льдом — готово к употреблению.",
        "Остаток храните в холодильнике — годен до 3 дней.",
      ],
      en: [
        "Cut the lemon into pieces and blend with the honey and water.",
        "Blend for 1 minute, then strain through a sieve.",
        "Pour over ice and it's ready to drink.",
        "Keep the rest refrigerated — good for up to 3 days.",
      ],
    },
  }),
  dish("vazn-oshirish-kokteyli", { uz: "Vazn oshirish kokteyli", ru: "Коктейль для набора веса", en: "Weight-gain smoothie" }, "🥤", 480, [480, 50, 20, 16], {
    cat: "drink", minutes: 5, approx: true,
    note: {
      uz: "Massa yig'ish davrida nonushta o'rniga yoki mashqdan keyin ichish uchun qulay — bitta stakanda ancha kaloriya.",
      ru: "Удобно пить вместо завтрака или после тренировки в период набора массы — много калорий в одном стакане.",
      en: "Good as a breakfast swap or post-workout during a bulk — a lot of calories in one glass.",
    },
    composition: {
      benefits: {
        uz: ["Banan va suli sekin ajraladigan energiya beradi", "Chia va yeryong'oq ezmasi sog'lom yog' qo'shadi"],
        ru: ["Банан и овсянка дают энергию с медленным высвобождением", "Чиа и арахисовая паста добавляют полезные жиры"],
        en: ["Banana and oats give slow-release energy", "Chia and peanut butter add healthy fats"],
      },
      harms: {
        uz: ["Kaloriyasi zich — ozish davrida bir stakan kunlik me'yorning katta qismini yeb qo'yadi"],
        ru: ["Калорийно плотный — во время похудения один стакан съедает большую часть дневной нормы"],
        en: ["Calorie-dense — during a cut, one glass eats up a large share of the daily budget"],
      },
    },
    ingredients: {
      uz: ["Yog'li sut 300 ml", "Banan 1 dona", "Suli yormasi 40 g", "Chia urug'i 1 osh qoshiq", "Yeryong'oq ezmasi 1 choy qoshiq", "Shakarsiz kakao 1 choy qoshiq"],
      ru: ["Жирное молоко 300 мл", "Банан 1 шт", "Овсяные хлопья 40 г", "Семена чиа 1 ст. л.", "Арахисовая паста 1 ч. л.", "Какао без сахара 1 ч. л."],
      en: ["Whole milk 300ml", "1 banana", "Oats 40g", "1 tbsp chia seeds", "1 tsp peanut butter", "1 tsp unsweetened cocoa"],
    },
    steps: {
      uz: ["Barcha masalliqlarni blenderga soling.", "Silliq bo'lguncha 1 daqiqa aralashtiring.", "Darhol ichishga tayyor."],
      ru: ["Положите все ингредиенты в блендер.", "Взбивайте 1 минуту до однородности.", "Готово к употреблению сразу."],
      en: ["Put all the ingredients in a blender.", "Blend for 1 minute until smooth.", "Ready to drink right away."],
    },
  }),
  dish("suvli-tovuq-kokragi", { uz: "Suvli va yumshoq tovuq ko'kragi", ru: "Сочная куриная грудка", en: "Juicy pan-seared chicken breast" }, "🍗", 500, [630, 2, 114, 18], {
    cat: "meat", minutes: 30, approx: true,
    note: {
      uz: "Xom vaznga hisoblangan (500g). Marinatsiya vaqti tayyorlash vaqtiga kirmagan.",
      ru: "Расчёт на сырой вес (500 г). Время маринования не входит во время готовки.",
      en: "Calculated on raw weight (500g). Marinating time is not counted in the prep time.",
    },
    composition: {
      benefits: {
        uz: ["Yuqori oqsil, juda past uglevod — kesish davri uchun ideal", "Zaytun moyi miqdori minimal, ortiqcha yog' yo'q"],
        ru: ["Высокий белок, почти нет углеводов — идеально для сушки", "Оливкового масла минимум, лишнего жира нет"],
        en: ["High protein, almost no carbs — ideal for a cut", "Barely any added oil, no excess fat"],
      },
      harms: { uz: [], ru: [], en: [] },
    },
    ingredients: {
      uz: ["Tovuq ko'kragi 500g", "Shakarsiz soya sousi 1 osh qoshiq", "Paprika 1 choy qoshiq", "Tuz, murch", "Zaytun moyi 1 choy qoshiq (5g)"],
      ru: ["Куриная грудка 500 г", "Соевый соус без сахара 1 ст. л.", "Паприка 1 ч. л.", "Соль, перец", "Оливковое масло 1 ч. л. (5 г)"],
      en: ["Chicken breast 500g", "1 tbsp sugar-free soy sauce", "1 tsp paprika", "Salt, pepper", "1 tsp (5g) olive oil"],
    },
    steps: {
      uz: [
        "Tovuqni sous, paprika va murch bilan aralashtirib, 20 daqiqa (yoki 1 kun oldin) marinatsiya qiling.",
        "Qizigan tovada baland olovda har ikki tomonini qizartirib pishiring.",
        "Tuzni pishirish jarayonida qo'shing.",
        "Pishgach 5 daqiqa dam bering — shu payt ichidagi shirasi saqlanadi.",
      ],
      ru: [
        "Смешайте курицу с соусом, паприкой и перцем, оставьте мариноваться 20 минут (или на ночь).",
        "Обжарьте на разогретой сковороде на сильном огне с двух сторон.",
        "Посолите уже во время жарки.",
        "Дайте отдохнуть 5 минут после готовки — так сок останется внутри.",
      ],
      en: [
        "Mix the chicken with the sauce, paprika and pepper, marinate 20 minutes (or overnight).",
        "Sear both sides in a hot pan over high heat.",
        "Add salt while it cooks.",
        "Rest for 5 minutes after cooking so the juices stay in.",
      ],
    },
  }),
  dish("tvorogdan-grek-yogurt", { uz: "Tvorogdan uy grek yogurti", ru: "Домашний греческий йогурт из творога", en: "Homemade Greek-style yogurt from curd cheese" }, "🥣", 350, [300, 7, 34, 15], {
    cat: "dairy", minutes: 5, approx: true,
    note: {
      uz: "Muzlatkichda 4 kungacha turadi — bir marta tayyorlab, haftaga yetkazish mumkin.",
      ru: "Хранится в холодильнике до 4 дней — можно приготовить один раз на несколько дней.",
      en: "Keeps in the fridge up to 4 days — make it once and it covers several days.",
    },
    composition: {
      benefits: {
        uz: ["Sotib olinadigan grek yogurtidan arzon va oqsili yuqoriroq", "Qo'shimcha shakarsiz — faqat sut va tvorogning tabiiy tarkibi"],
        ru: ["Дешевле покупного греческого йогурта и больше белка", "Без добавленного сахара — только натуральный состав творога и молока"],
        en: ["Cheaper than store-bought Greek yogurt, and higher in protein", "No added sugar — just curd cheese and milk"],
      },
      harms: { uz: [], ru: [], en: [] },
    },
    ingredients: {
      uz: ["Tvorog 5% 200g", "Sut 150 ml", "Zaytun moyi 1 choy qoshiq (5g)"],
      ru: ["Творог 5% 200 г", "Молоко 150 мл", "Оливковое масло 1 ч. л. (5 г)"],
      en: ["Curd cheese (5% fat) 200g", "Milk 150ml", "1 tsp (5g) olive oil"],
    },
    steps: {
      uz: [
        "Barcha masalliqlarni blender yoki chopperga solib, silliq massa hosil bo'lguncha aralashtiring.",
        "Qopqoqli idishga solib, muzlatkichga qo'ying.",
        "4 kungacha saqlash mumkin.",
      ],
      ru: [
        "Взбейте все ингредиенты блендером до однородной массы.",
        "Переложите в банку с крышкой и уберите в холодильник.",
        "Хранится до 4 дней.",
      ],
      en: ["Blend everything together until smooth.", "Transfer to a lidded container and refrigerate.", "Keeps for up to 4 days."],
    },
  }),
  dish("fit-mayonez", { uz: "Loviyadan fit sous (mayonez o'rniga)", ru: "Фит-соус из фасоли (вместо майонеза)", en: "Bean-based fit sauce (a mayo swap)" }, "🥫", 20, [29, 3, 1, 1], {
    cat: "oil", minutes: 10, approx: true,
    note: {
      uz: "20 g (taxminan 1 osh qoshiq) uchun hisoblangan. Xuddi shu miqdor oddiy mayonezda ~140 kkal bo'ladi.",
      ru: "Расчёт на 20 г (примерно 1 ст. л.). Столько же обычного майонеза — это ~140 ккал.",
      en: "Calculated per 20g (about 1 tbsp). The same amount of regular mayo runs about 140 kcal.",
    },
    composition: {
      benefits: {
        uz: ["Oddiy mayonezdan bir necha baravar kam kaloriya", "Loviya tolasi va oqsili bor — mayonezda esa deyarli hech narsa yo'q"],
        ru: ["В несколько раз меньше калорий, чем в обычном майонезе", "Даёт клетчатку и белок из фасоли — в майонезе их почти нет"],
        en: ["A fraction of regular mayo's calories", "Carries fibre and protein from the beans — plain mayo has almost none"],
      },
      harms: { uz: [], ru: [], en: [] },
    },
    ingredients: {
      uz: ["Pishirilgan loviya 400 ml (yoki konserva)", "Zaytun moyi 4 osh qoshiq", "Olma sirkasi yoki limon sharbati 1 osh qoshiq", "Tuz 5g", "Suv 100-150 ml"],
      ru: ["Варёная фасоль 400 мл (или консервированная)", "Оливковое масло 4 ст. л.", "Яблочный уксус или лимонный сок 1 ст. л.", "Соль 5 г", "Вода 100-150 мл"],
      en: ["Cooked beans 400ml (or canned)", "4 tbsp olive oil", "1 tbsp apple cider vinegar or lemon juice", "Salt 5g", "Water 100-150ml"],
    },
    steps: {
      uz: [
        "Barcha masalliqlarni blenderga solib, silliq konsistensiya hosil bo'lguncha aralashtiring.",
        "Qopqoqli idishga soling.",
        "Muzlatkichda 5 kungacha saqlash mumkin.",
      ],
      ru: ["Взбейте все ингредиенты блендером до гладкой консистенции.", "Переложите в банку с крышкой.", "Хранится в холодильнике до 5 дней."],
      en: ["Blend everything until smooth.", "Transfer to a lidded jar.", "Keeps in the fridge for up to 5 days."],
    },
  }),
  dish("fit-pankek", { uz: "Oqsilga boy fit pankek", ru: "Протеиновые панкейки", en: "High-protein pancakes" }, "🥞", 250, [730, 52, 69, 27], {
    cat: "dairy", minutes: 15, approx: true,
    note: {
      uz: "Butun tayyorlangan partiya (bir necha pankek) uchun hisoblangan.",
      ru: "Расчёт на всю приготовленную порцию (несколько панкейков).",
      en: "Calculated for the whole cooked batch (several pancakes).",
    },
    composition: {
      benefits: {
        uz: ["Bitta nonushtada 69g oqsil — kunlik me'yorning katta qismi", "Tuxum, tvorog va protein — uchta to'liq oqsil manbai birga"],
        ru: ["69 г белка в одном завтраке — большая часть дневной нормы", "Яйца, творог и протеин — три полноценных источника белка сразу"],
        en: ["69g of protein in one breakfast — a large share of the daily target", "Eggs, curd cheese and protein powder — three complete protein sources at once"],
      },
      harms: {
        uz: ["Kaloriyasi yuqori — kichik porsiyaga bo'lib yeyish tavsiya etiladi"],
        ru: ["Калорийность высокая — лучше разделить на порции поменьше"],
        en: ["Calorie-heavy — best split into smaller portions"],
      },
    },
    ingredients: {
      uz: ["Tuxum 4 dona", "Suli yormasi 70g", "Tvorog 50g", "Xamirturush kukuni (razrixlitel) 3g", "Protein kukuni 1 porsiya", "Suv 30 ml"],
      ru: ["Яйца 4 шт", "Овсяные хлопья 70 г", "Творог 50 г", "Разрыхлитель 3 г", "Протеин 1 порция", "Вода 30 мл"],
      en: ["4 eggs", "Oats 70g", "Curd cheese 50g", "Baking powder 3g", "1 scoop protein powder", "Water 30ml"],
    },
    steps: {
      uz: [
        "Tuxum, suli, tvorog va xamirturushni blenderda silliq bo'lguncha aralashtiring.",
        "Qizigan tavada har bir pankekni ikki tomonlama pishiring.",
        "Protein kukunini suv bilan quyuq sous holiga keltiring.",
        "Tayyor pankeklar ustiga surtib xizmat qiling.",
      ],
      ru: [
        "Взбейте блендером яйца, овсянку, творог и разрыхлитель до однородности.",
        "Обжарьте каждый панкейк на разогретой сковороде с двух сторон.",
        "Разведите протеин водой до консистенции соуса.",
        "Полейте им готовые панкейки перед подачей.",
      ],
      en: [
        "Blend the eggs, oats, curd cheese and baking powder until smooth.",
        "Cook each pancake on a hot pan, both sides.",
        "Mix the protein powder with the water into a thick sauce.",
        "Drizzle it over the finished pancakes and serve.",
      ],
    },
  }),
  dish("fit-tiramisu", { uz: "Fit tiramisu", ru: "Фит-тирамису", en: "Fit tiramisu" }, "🍮", 300, [253, 58, 5, 1], {
    cat: "sweet", minutes: 15, approx: true,
    note: {
      uz: "Shirinlikka intilish paytida oddiy tortga past kaloriyali muqobil.",
      ru: "Низкокалорийная альтернатива обычному торту, когда хочется сладкого.",
      en: "A low-calorie stand-in for cake when you want something sweet.",
    },
    composition: {
      benefits: {
        uz: ["Oddiy tiramisudan bir necha baravar kam kaloriya va yog'", "Qo'shimcha shakarsiz — shirinligi faqat asaldan"],
        ru: ["В разы меньше калорий и жира, чем в обычном тирамису", "Без добавленного сахара — сладость только от мёда"],
        en: ["A fraction of regular tiramisu's calories and fat", "No added sugar — the sweetness is from honey alone"],
      },
      harms: {
        uz: ["Uglevodi baribir yuqori — kechqurun emas, kunning boshida yegani ma'qul"],
        ru: ["Углеводов всё равно много — лучше съесть в первой половине дня, а не вечером"],
        en: ["Still fairly high in carbs — better earlier in the day than at night"],
      },
    },
    ingredients: {
      uz: ["Guruchli non (Хлебцы) 3 dona", "Qora qahva 1 stakan", "Yogurt 3 osh qoshiq", "Asal 1 osh qoshiq", "Shakarsiz kakao 1 choy qoshiq"],
      ru: ["Рисовые хлебцы 3 шт", "Чёрный кофе 1 стакан", "Йогурт 3 ст. л.", "Мёд 1 ст. л.", "Какао без сахара 1 ч. л."],
      en: ["Rice crispbread 3 pieces", "Black coffee 1 cup", "Yogurt 3 tbsp", "1 tbsp honey", "1 tsp unsweetened cocoa"],
    },
    steps: {
      uz: [
        "Qahvani issiq suvda damlab tayyorlang.",
        "Yogurt va asalni birlashtirib aralashtiring.",
        "Har bir non bo'lagini qahvaga botirib, ustiga yogurt aralashmasidan suring — 3 qavat qiling.",
        "Eng ustiga kakao sepib xizmat qiling.",
      ],
      ru: [
        "Заварите чёрный кофе.",
        "Смешайте йогурт с мёдом.",
        "Каждый хлебец обмакните в кофе и промажьте йогуртовой смесью — сделайте 3 слоя.",
        "Посыпьте какао сверху и подавайте.",
      ],
      en: [
        "Brew the coffee.",
        "Mix the yogurt with the honey.",
        "Dip each crispbread in the coffee and spread with the yogurt mix — build 3 layers.",
        "Dust with cocoa on top and serve.",
      ],
    },
  }),
  dish("shaftoli-puding", { uz: "Shaftolili tvorog puding", ru: "Персиковый творожный пудинг", en: "Peach curd-cheese pudding" }, "🍑", 150, [147, 28, 5, 2], {
    cat: "fruit", minutes: 5, approx: true,
    note: {
      uz: "1 porsiya uchun hisob (butun tayyorlangan partiya 3 porsiyaga bo'linadi).",
      ru: "Расчёт на 1 порцию (вся приготовленная партия делится на 3 порции).",
      en: "Calculated per portion (the whole batch splits into 3).",
    },
    composition: {
      benefits: {
        uz: ["Shirin, lekin qo'shimcha shakarsiz — shaftolining o'z shirinligi yetadi", "Suli va tvorog bilan to'yimli, oddiy desertdan ko'ra to'qroq"],
        ru: ["Сладко, но без добавленного сахара — хватает сладости самого персика", "Сытнее обычного десерта благодаря овсянке и творогу"],
        en: ["Sweet with no added sugar — the peaches carry it on their own", "More filling than a typical dessert thanks to the oats and curd cheese"],
      },
      harms: { uz: [], ru: [], en: [] },
    },
    ingredients: {
      uz: ["Pishgan shaftoli 3 dona", "Suzma (tvorog) 2 osh qoshiq", "Suli yormasi 50g"],
      ru: ["Спелые персики 3 шт", "Творог (сузьма) 2 ст. л.", "Овсяные хлопья 50 г"],
      en: ["Ripe peaches 3", "Curd cheese 2 tbsp", "Oats 50g"],
    },
    steps: {
      uz: [
        "Barcha masalliqlarni blenderga solib, quyuq va bir xil massa hosil bo'lguncha aralashtiring.",
        "3 ta idishga teng bo'lib soling.",
        "Muzlatkichda 2 kungacha saqlash mumkin.",
      ],
      ru: ["Взбейте все ингредиенты блендером до густой однородной массы.", "Разлейте поровну по 3 креманкам.", "Хранится в холодильнике до 2 дней."],
      en: ["Blend everything into a thick, smooth mixture.", "Divide evenly between 3 bowls.", "Keeps in the fridge for up to 2 days."],
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
  product("tovuq-qovurilgan", { uz: "Qovurilgan tovuq (teri bilan)", ru: "Жареная курица с кожей", en: "Fried chicken with skin" }, "🍗", "meat", [265, 0, 26, 18], 150),
  // "Lean" has to mean lean: at 15 g fat this was fattier than the lamb below it.
  product("mol-goshti", { uz: "Mol go'shti (yog'siz, pishgan)", ru: "Говядина постная (варёная)", en: "Lean beef (cooked)" }, "🥩", "meat", [215, 0, 30, 10], 150),
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
  product("tvorog9", { uz: "Tvorog 9%", ru: "Творог 9%", en: "Curd cheese 9%" }, "🧀", "dairy", [169, 3, 18, 9], 150),
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
  // Two different fruits used to share one entry. In Uzbek "xurmo" is the
  // persimmon eaten fresh every autumn; the dried dates the macros described are
  // "finik". Anyone logging a persimmon was charged 282 kcal for a 70 kcal fruit.
  product("xurmo", { uz: "Xurmo", ru: "Хурма", en: "Persimmon" }, "🟠", "fruit", [70, 18, 0.6, 0.2], 170, { uzbek: true }),
  product("finik", { uz: "Finik (quritilgan)", ru: "Финики сушёные", en: "Dried dates" }, "🌴", "fruit", [282, 75, 2.5, 0.4], 40),
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
  // Cooking oils, not nuts — filtering "yong'oqlar" for a snack should not
  // return a bottle of sunflower oil.
  product("zaytun-moyi", { uz: "Zaytun moyi", ru: "Оливковое масло", en: "Olive oil" }, "🫒", "oil", [884, 0, 0, 100], 10),
  product("kungaboqar-moyi", { uz: "Kungaboqar moyi", ru: "Подсолнечное масло", en: "Sunflower oil" }, "🌻", "oil", [884, 0, 0, 100], 10),
  product("paxta-moyi", { uz: "Paxta moyi", ru: "Хлопковое масло", en: "Cottonseed oil" }, "🫗", "oil", [884, 0, 0, 100], 10, { uzbek: true }),
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
  // 300 g is what a street portion actually weighs here; 250 was a light one.
  product("lavash", { uz: "Lavash (tovuqli)", ru: "Лаваш с курицей", en: "Chicken lavash wrap" }, "🌯", "fast", [215, 20, 12, 10], 300),
  product("shaurma", { uz: "Shaurma", ru: "Шаурма", en: "Shawarma" }, "🌯", "fast", [230, 18, 13, 12], 300),
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
