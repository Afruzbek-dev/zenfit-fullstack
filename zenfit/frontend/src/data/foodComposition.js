/**
 * Compositional benefit/harm notes for catalogue "products" (raw/packaged
 * foods, not cooked dishes). Keyed by the product id used in `foods.js`'s
 * PRODUCTS array. Each entry is a short, nutrition-label style read on what
 * a food actually brings and what to watch for — not medical advice.
 *
 * benefits / harms are arrays of 1-2 short phrases per language (uz/ru/en).
 * harms may be an empty array when a food genuinely has no real downside
 * at typical intake.
 */

export const PRODUCT_COMPOSITION = {
  /* -- Uzbek staples -------------------------------------------------- */
  "tandir-non": {
    benefits: {
      uz: ["Tez energiya beruvchi uglevod manbai"],
      ru: ["Источник быстрой углеводной энергии"],
      en: ["Quick source of carbohydrate energy"],
    },
    harms: {
      uz: ["Tolasi kam, oq undan tayyorlangan"],
      ru: ["Мало клетчатки, из белой муки"],
      en: ["Low fibre, made from refined flour"],
    },
  },
  patir: {
    benefits: {
      uz: ["Yog' qo'shilgani uni to'yimliroq qiladi"],
      ru: ["Масло в тесте делает его сытнее"],
      en: ["Oil in the dough makes it filling"],
    },
    harms: {
      uz: ["Tandir nondan ko'ra kaloriyasi yuqoriroq"],
      ru: ["Калорийнее обычной тандырной лепёшки"],
      en: ["More calorie-dense than plain tandoor bread"],
    },
  },
  qatiq: {
    benefits: {
      uz: ["Probiotik bakteriyalar va sifatli oqsil beradi"],
      ru: ["Даёт пробиотики и качественный белок"],
      en: ["Provides probiotics and quality protein"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  suzma: {
    benefits: {
      uz: ["Qatiqdan quyuqroq, oqsili yuqoriroq"],
      ru: ["Гуще катыка, больше белка"],
      en: ["Thicker than qatiq, more protein"],
    },
    harms: {
      uz: ["Yog'i qatiqdan biroz yuqoriroq"],
      ru: ["Жирность чуть выше, чем у катыка"],
      en: ["Slightly fattier than plain qatiq"],
    },
  },
  qaymoq: {
    benefits: {
      uz: ["Kremsimon, A vitaminiga boy"],
      ru: ["Кремовый, богат витамином A"],
      en: ["Creamy, rich in vitamin A"],
    },
    harms: {
      uz: ["To'yingan yog'i juda yuqori, kichik porsiyada yeng"],
      ru: ["Очень много насыщенных жиров — ешьте понемногу"],
      en: ["Very high in saturated fat — keep portions small"],
    },
  },
  kurt: {
    benefits: {
      uz: ["Oqsilga boy, saqlash muddati uzoq"],
      ru: ["Богат белком, долго хранится"],
      en: ["Protein-dense and long shelf life"],
    },
    harms: {
      uz: ["Ko'pincha sho'r, natriyga boy"],
      ru: ["Часто солёный, много натрия"],
      en: ["Often salty, high in sodium"],
    },
  },
  ayron: {
    benefits: {
      uz: ["Suvsizlanishga qarshi, yengil oqsil beradi"],
      ru: ["Хорошо увлажняет, даёт лёгкий белок"],
      en: ["Hydrating with a light dose of protein"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  "achchiq-chuchuk": {
    benefits: {
      uz: ["Pomidor va piyozdan C vitamini, past kaloriya"],
      ru: ["Витамин C из помидора и лука, мало калорий"],
      en: ["Vitamin C from tomato and onion, low calorie"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  halva: {
    benefits: {
      uz: ["Kunjut yog'idan sog'lom yog' ulushi bor"],
      ru: ["Кунжутное масло даёт полезные жиры"],
      en: ["Sesame oil contributes some healthy fat"],
    },
    harms: {
      uz: ["Shakar va kaloriyasi juda yuqori"],
      ru: ["Очень много сахара и калорий"],
      en: ["Very high in sugar and calories"],
    },
  },
  navvot: {
    benefits: { uz: [], ru: [], en: [] },
    harms: {
      uz: ["Sof shakar, foydali moddasi yo'q"],
      ru: ["Чистый сахар, без питательной ценности"],
      en: ["Pure sugar with no nutritional value"],
    },
  },
  parvarda: {
    benefits: { uz: [], ru: [], en: [] },
    harms: {
      uz: ["Deyarli sof shakar, tez qon shakarini oshiradi"],
      ru: ["Почти чистый сахар, быстро поднимает уровень глюкозы"],
      en: ["Nearly pure sugar, spikes blood sugar fast"],
    },
  },
  "ko-k-choy": {
    benefits: {
      uz: ["Antioksidant katexinlarga boy, deyarli kaloriyasiz"],
      ru: ["Богат антиоксидантами-катехинами, почти без калорий"],
      en: ["Rich in antioxidant catechins, almost calorie-free"],
    },
    harms: {
      uz: ["Kofein bor, kechqurun ko'p ichmang"],
      ru: ["Содержит кофеин, не злоупотребляйте вечером"],
      en: ["Contains caffeine — go easy in the evening"],
    },
  },

  /* -- meat and poultry ------------------------------------------------ */
  "tovuq-kokrak": {
    benefits: {
      uz: ["Yog'siz, yuqori sifatli oqsil manbai"],
      ru: ["Постный источник качественного белка"],
      en: ["Lean source of high-quality protein"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  "tovuq-son": {
    benefits: {
      uz: ["Ko'krakdan mazaliroq, temir miqdori yuqoriroq"],
      ru: ["Сочнее грудки, больше железа"],
      en: ["Juicier than breast, more iron"],
    },
    harms: {
      uz: ["Ko'krak go'shtidan yog'i ko'proq"],
      ru: ["Жирнее, чем куриная грудка"],
      en: ["Higher in fat than chicken breast"],
    },
  },
  "tovuq-qovurilgan": {
    benefits: {
      uz: ["Baribir yaxshi oqsil manbai"],
      ru: ["Всё ещё хороший источник белка"],
      en: ["Still a solid source of protein"],
    },
    harms: {
      uz: ["Yog'da qovurilgan, terisi to'yingan yog'ga boy"],
      ru: ["Жарится в масле, кожа жирная"],
      en: ["Fried in oil, skin adds saturated fat"],
    },
  },
  "mol-goshti": {
    benefits: {
      uz: ["Temir va B12 vitaminiga boy oqsil"],
      ru: ["Белок, богатый железом и B12"],
      en: ["Protein rich in iron and B12"],
    },
    harms: {
      uz: ["Tovuqqa nisbatan to'yingan yog'i ko'proq"],
      ru: ["Больше насыщенных жиров, чем в курице"],
      en: ["More saturated fat than chicken"],
    },
  },
  "mol-farsh": {
    benefits: {
      uz: ["Oqsil, temir va rux manbai"],
      ru: ["Источник белка, железа и цинка"],
      en: ["Source of protein, iron and zinc"],
    },
    harms: {
      uz: ["Yog'siz mol go'shtidan yog'i yuqoriroq"],
      ru: ["Жирнее, чем постная говядина"],
      en: ["Fattier than lean cut beef"],
    },
  },
  "qoy-goshti": {
    benefits: {
      uz: ["Temir va B12 ga boy qizil go'sht"],
      ru: ["Красное мясо, богатое железом и B12"],
      en: ["Red meat rich in iron and B12"],
    },
    harms: {
      uz: ["To'yingan yog'i mol go'shtidan yuqori"],
      ru: ["Насыщенных жиров больше, чем в говядине"],
      en: ["More saturated fat than beef"],
    },
  },
  jigar: {
    benefits: {
      uz: ["A vitamini, temir va B12 juda yuqori"],
      ru: ["Очень много витамина A, железа и B12"],
      en: ["Very high in vitamin A, iron and B12"],
    },
    harms: {
      uz: ["Xolesterin yuqori, tez-tez yemang"],
      ru: ["Высокий холестерин, не ешьте часто"],
      en: ["High in cholesterol — don't eat too often"],
    },
  },
  kolbasa: {
    benefits: {
      uz: ["Tayyor oqsil manbai, tez tayyorlanadi"],
      ru: ["Готовый источник белка, быстро в еде"],
      en: ["Ready protein source, quick to eat"],
    },
    harms: {
      uz: ["Qayta ishlangan go'sht, natriyi yuqori"],
      ru: ["Переработанное мясо, много натрия"],
      en: ["Processed meat, high in sodium"],
    },
  },
  sosiska: {
    benefits: {
      uz: ["Tez tayyorlanadigan oqsil manbai"],
      ru: ["Быстрый источник белка"],
      en: ["Quick, convenient source of protein"],
    },
    harms: {
      uz: ["Qayta ishlangan, tuz va yog'i yuqori"],
      ru: ["Переработанный продукт, много соли и жира"],
      en: ["Processed, high in salt and fat"],
    },
  },
  vetchina: {
    benefits: {
      uz: ["Boshqa kolbasalardan yog'i kamroq"],
      ru: ["Менее жирная, чем другие колбасы"],
      en: ["Leaner than most processed sausages"],
    },
    harms: {
      uz: ["Tuzlangan go'sht, natriyi baribir yuqori"],
      ru: ["Солёное мясо, натрия всё равно много"],
      en: ["Cured meat, still fairly high in sodium"],
    },
  },

  /* -- fish -------------------------------------------------------------- */
  losos: {
    benefits: {
      uz: ["Omega-3 va D vitaminiga boy"],
      ru: ["Богат омега-3 и витамином D"],
      en: ["Rich in omega-3s and vitamin D"],
    },
    harms: {
      uz: ["Boshqa baliqlarga nisbatan kaloriyasi yuqoriroq"],
      ru: ["Калорийнее большинства других видов рыбы"],
      en: ["More calorie-dense than most other fish"],
    },
  },
  tunets: {
    benefits: {
      uz: ["Deyarli yog'siz, oqsili juda yuqori"],
      ru: ["Почти без жира, очень много белка"],
      en: ["Nearly fat-free with very high protein"],
    },
    harms: {
      uz: ["Konserva sho'ri natriyni oshirishi mumkin"],
      ru: ["Рассол в консервах может повышать натрий"],
      en: ["Canning brine can push up sodium"],
    },
  },
  skumbriya: {
    benefits: {
      uz: ["Omega-3 miqdori eng yuqori baliqlardan"],
      ru: ["Одна из самых жирных рыб по омега-3"],
      en: ["One of the highest omega-3 fish"],
    },
    harms: {
      uz: ["Yog'li baliq, simob darajasini hisobga oling"],
      ru: ["Жирная рыба, учитывайте уровень ртути"],
      en: ["Oily fish — be mindful of mercury levels"],
    },
  },
  "oq-baliq": {
    benefits: {
      uz: ["Juda yog'siz, engil hazm bo'ladigan oqsil"],
      ru: ["Очень нежирная, легко усваиваемый белок"],
      en: ["Very lean, easily digestible protein"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  karp: {
    benefits: {
      uz: ["Oqsil va biroz omega-3 beradi"],
      ru: ["Даёт белок и немного омега-3"],
      en: ["Provides protein and some omega-3"],
    },
    harms: {
      uz: ["Oq baliqdan yog'i biroz yuqoriroq"],
      ru: ["Немного жирнее, чем белая рыба"],
      en: ["Slightly fattier than white fish"],
    },
  },
  krevetka: {
    benefits: {
      uz: ["Juda yog'siz, oqsili zich dengiz mahsuloti"],
      ru: ["Очень нежирный, богатый белком морепродукт"],
      en: ["Very lean, protein-dense seafood"],
    },
    harms: {
      uz: ["Xolesterin nisbatan yuqori"],
      ru: ["Относительно много холестерина"],
      en: ["Relatively high in cholesterol"],
    },
  },

  /* -- eggs and dairy ------------------------------------------------------ */
  tuxum: {
    benefits: {
      uz: ["To'liq oqsil va xolin manbai"],
      ru: ["Полноценный белок и источник холина"],
      en: ["Complete protein and a source of choline"],
    },
    harms: {
      uz: ["Xolesterin miqdori nisbatan yuqori"],
      ru: ["Довольно много холестерина"],
      en: ["Fairly high in dietary cholesterol"],
    },
  },
  "tuxum-oqi": {
    benefits: {
      uz: ["Sof oqsil, yog'i deyarli yo'q"],
      ru: ["Чистый белок, почти без жира"],
      en: ["Pure protein, almost no fat"],
    },
    harms: {
      uz: ["Sariqdagi vitamin va minerallar yo'q"],
      ru: ["Не хватает витаминов из желтка"],
      en: ["Misses the vitamins found in the yolk"],
    },
  },
  sut25: {
    benefits: {
      uz: ["Kaltsiy va oqsilga boy ichimlik"],
      ru: ["Богато кальцием и белком"],
      en: ["Rich in calcium and protein"],
    },
    harms: {
      uz: ["Laktoza va biroz to'yingan yog' bor"],
      ru: ["Содержит лактозу и немного насыщенных жиров"],
      en: ["Contains lactose and some saturated fat"],
    },
  },
  kefir: {
    benefits: {
      uz: ["Probiotik, kefirning yog'i pastroq turi"],
      ru: ["Пробиотик, вариант с низким содержанием жира"],
      en: ["Probiotic, a lower-fat dairy choice"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  tvorog5: {
    benefits: {
      uz: ["Oqsili yuqori, yog'i o'rtacha tvorog"],
      ru: ["Много белка, умеренная жирность"],
      en: ["High protein, moderate-fat curd cheese"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  tvorog9: {
    benefits: {
      uz: ["5%liq tvorogdan mazaliroq, oqsili yuqori"],
      ru: ["Насыщеннее творога 5%, много белка"],
      en: ["Richer than 5% curd cheese, high protein"],
    },
    harms: {
      uz: ["5%liq tvorogdan to'yingan yog'i ko'proq"],
      ru: ["Больше насыщенных жиров, чем в твороге 5%"],
      en: ["More saturated fat than the 5% version"],
    },
  },
  "grek-yogurt": {
    benefits: {
      uz: ["Oqsili juda yuqori, probiotik va shirinsiz"],
      ru: ["Очень много белка, пробиотики, без сахара"],
      en: ["Very high protein, probiotic, no added sugar"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  pishloq: {
    benefits: {
      uz: ["Kaltsiy va oqsili zich pishloq"],
      ru: ["Плотный источник кальция и белка"],
      en: ["Dense source of calcium and protein"],
    },
    harms: {
      uz: ["To'yingan yog' va tuzi yuqori"],
      ru: ["Много насыщенных жиров и соли"],
      en: ["High in saturated fat and salt"],
    },
  },
  mozzarella: {
    benefits: {
      uz: ["Yumshoqroq pishloq, kaltsiy va oqsil beradi"],
      ru: ["Мягкий сыр с кальцием и белком"],
      en: ["Softer cheese with calcium and protein"],
    },
    harms: {
      uz: ["Baribir to'yingan yog'i ancha yuqori"],
      ru: ["Всё же довольно много насыщенных жиров"],
      en: ["Still fairly high in saturated fat"],
    },
  },
  sariyog: {
    benefits: {
      uz: ["Yog'da eriydigan A va D vitaminlari bor"],
      ru: ["Содержит жирорастворимые витамины A и D"],
      en: ["Carries fat-soluble vitamins A and D"],
    },
    harms: {
      uz: ["To'yingan yog' yuqori, me'yorida iste'mol qiling", "Kaloriya zich"],
      ru: ["Много насыщенных жиров, ешьте умеренно", "Калорийный продукт"],
      en: ["High in saturated fat — use sparingly", "Very calorie-dense"],
    },
  },
  smetana: {
    benefits: {
      uz: ["Taomga yog'li krem va biroz A vitamini qo'shadi"],
      ru: ["Добавляет блюду жир и немного витамина A"],
      en: ["Adds richness and a little vitamin A"],
    },
    harms: {
      uz: ["To'yingan yog'i yuqori, kichik porsiyada"],
      ru: ["Много насыщенных жиров — небольшая порция"],
      en: ["High in saturated fat — keep portions small"],
    },
  },

  /* -- grains, bread, potato ---------------------------------------------- */
  "oq-guruch": {
    benefits: {
      uz: ["Tez hazm bo'ladigan energiya manbai"],
      ru: ["Быстро усваиваемый источник энергии"],
      en: ["Quickly digested source of energy"],
    },
    harms: {
      uz: ["Tozalangan don, tolasi va glisemik ta'siri yuqori"],
      ru: ["Очищенное зерно, высокий гликемический эффект"],
      en: ["Refined grain with a high glycemic impact"],
    },
  },
  "jigarrang-guruch": {
    benefits: {
      uz: ["To'liq don, tolasi va B vitaminlari ko'p"],
      ru: ["Цельное зерно, много клетчатки и витаминов B"],
      en: ["Whole grain with fibre and B vitamins"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  grechka: {
    benefits: {
      uz: ["Tolaga boy, glisemik ta'siri past don"],
      ru: ["Богата клетчаткой, низкий гликемический индекс"],
      en: ["Fibre-rich grain with a low glycemic impact"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  suli: {
    benefits: {
      uz: ["Beta-glyukan tolasi xolesterinni pasaytirishga yordam beradi"],
      ru: ["Бета-глюкан помогает снижать холестерин"],
      en: ["Beta-glucan fibre helps manage cholesterol"],
    },
    harms: {
      uz: ["Quruq holda porsiyani oshirib yuborish oson"],
      ru: ["В сухом виде легко переборщить с порцией"],
      en: ["Easy to overpour a portion when dry"],
    },
  },
  "suli-botqa": {
    benefits: {
      uz: ["Suvda pishirilgani past kaloriyali, to'yimli nonushta"],
      ru: ["На воде — сытный завтрак с малой калорийностью"],
      en: ["Filling breakfast, low calorie when made on water"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  makaron: {
    benefits: {
      uz: ["O'simlik oqsili va energiya uglevodi beradi"],
      ru: ["Даёт растительный белок и энергию"],
      en: ["Provides plant protein and energy carbs"],
    },
    harms: {
      uz: ["Tozalangan bug'doy, ko'p yesa qandini oshiradi"],
      ru: ["Рафинированная пшеница, поднимает сахар при переедании"],
      en: ["Refined wheat, spikes sugar if overeaten"],
    },
  },
  "oq-non": {
    benefits: {
      uz: ["Tez energiya beruvchi uglevod"],
      ru: ["Быстрый источник углеводной энергии"],
      en: ["Fast source of carbohydrate energy"],
    },
    harms: {
      uz: ["Tozalangan un, tolasi kam, qandni tez oshiradi"],
      ru: ["Белая мука, мало клетчатки, быстро поднимает сахар"],
      en: ["Refined flour, low fibre, spikes blood sugar"],
    },
  },
  "qora-non": {
    benefits: {
      uz: ["Oq nondan tolasi ko'proq, sekinroq ta'sir qiladi"],
      ru: ["Больше клетчатки, чем в белом хлебе"],
      en: ["More fibre than white bread, slower rise"],
    },
    harms: {
      uz: ["Baribir kaloriyasi ancha zich"],
      ru: ["Всё же довольно калориен"],
      en: ["Still fairly calorie-dense per slice"],
    },
  },
  bulgur: {
    benefits: {
      uz: ["To'liq don, tolasi yuqori va yog'i kam"],
      ru: ["Цельное зерно, много клетчатки, мало жира"],
      en: ["Whole grain, high fibre and low fat"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  kartoshka: {
    benefits: {
      uz: ["Kaliy va C vitamini bor, to'yimli"],
      ru: ["Содержит калий и витамин C, сытный"],
      en: ["Contains potassium and vitamin C, filling"],
    },
    harms: {
      uz: ["Glisemik ta'siri yuqori, qandni tez oshiradi"],
      ru: ["Высокий гликемический индекс, быстро поднимает сахар"],
      en: ["High glycemic impact, raises blood sugar fast"],
    },
  },
  fri: {
    benefits: {
      uz: ["Kartoshkadan biroz kaliy saqlanib qoladi"],
      ru: ["Немного калия сохраняется от картофеля"],
      en: ["Retains a little potassium from the potato"],
    },
    harms: {
      uz: ["Yog'da qovurilgan, tuzi va yog'i juda yuqori"],
      ru: ["Жарится в масле, много соли и жира"],
      en: ["Deep-fried, very high in fat and salt"],
    },
  },
  noxat: {
    benefits: {
      uz: ["O'simlik oqsili va tolaga boy, to'yg'azadi"],
      ru: ["Богат растительным белком и клетчаткой"],
      en: ["Rich in plant protein and fibre"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  loviya: {
    benefits: {
      uz: ["Tola va o'simlik oqsili to'qlik his qildiradi"],
      ru: ["Клетчатка и белок дают чувство сытости"],
      en: ["Fibre and plant protein add satiety"],
    },
    harms: {
      uz: ["Ko'p miqdorda ichak gazini oshirishi mumkin"],
      ru: ["В больших порциях может вызвать вздутие"],
      en: ["Large portions can cause digestive gas"],
    },
  },
  yasmiq: {
    benefits: {
      uz: ["Temir, folat va o'simlik oqsiliga boy"],
      ru: ["Богата железом, фолатом и растительным белком"],
      en: ["Rich in iron, folate and plant protein"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  tofu: {
    benefits: {
      uz: ["To'liq o'simlik oqsili, izoflavonlar bor"],
      ru: ["Полноценный растительный белок с изофлавонами"],
      en: ["Complete plant protein with isoflavones"],
    },
    harms: { uz: [], ru: [], en: [] },
  },

  /* -- vegetables ---------------------------------------------------------- */
  pomidor: {
    benefits: {
      uz: ["C vitamini va likopin antioksidantiga boy"],
      ru: ["Богат витамином C и ликопином"],
      en: ["Rich in vitamin C and lycopene"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  bodring: {
    benefits: {
      uz: ["Asosan suv, kaloriyasi juda past"],
      ru: ["В основном вода, очень мало калорий"],
      en: ["Mostly water, very low in calories"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  sabzi: {
    benefits: {
      uz: ["Beta-karotin va A vitaminiga juda boy"],
      ru: ["Очень богата бета-каротином и витамином A"],
      en: ["Very rich in beta-carotene and vitamin A"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  piyoz: {
    benefits: {
      uz: ["Kversetin antioksidanti va prebiotik tolaga ega"],
      ru: ["Содержит кверцетин и пребиотическую клетчатку"],
      en: ["Contains quercetin and prebiotic fibre"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  karam: {
    benefits: {
      uz: ["C vitamini va tolaga boy, kaloriyasi past"],
      ru: ["Богата витамином C и клетчаткой"],
      en: ["Rich in vitamin C and fibre"],
    },
    harms: {
      uz: ["Xom holda ko'p yesa gaz chiqarishi mumkin"],
      ru: ["В сыром виде может вызывать вздутие"],
      en: ["Raw, large amounts can cause gas"],
    },
  },
  brokkoli: {
    benefits: {
      uz: ["C, K vitamini va sulforafan birikmasi bor"],
      ru: ["Витамины C, K и соединение сульфорафан"],
      en: ["Vitamins C, K and the compound sulforaphane"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  qalampir: {
    benefits: {
      uz: ["C vitamini pomidordan ham yuqoriroq"],
      ru: ["Витамина C даже больше, чем в помидоре"],
      en: ["Even more vitamin C than a tomato"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  baqlajon: {
    benefits: {
      uz: ["Tola va antioksidant nasunin (po'stida) bor"],
      ru: ["Клетчатка и антиоксидант насунин в кожуре"],
      en: ["Fibre and the antioxidant nasunin in the skin"],
    },
    harms: {
      uz: ["Qovurilganda moyni juda ko'p shimadi"],
      ru: ["При жарке впитывает очень много масла"],
      en: ["Soaks up a lot of oil when fried"],
    },
  },
  qovoq: {
    benefits: {
      uz: ["Kaliy va C vitamini, deyarli suv"],
      ru: ["Калий и витамин C, почти вода"],
      en: ["Potassium and vitamin C, mostly water"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  oshqovoq: {
    benefits: {
      uz: ["Beta-karotin va kaliyga boy, kaloriyasi past"],
      ru: ["Богата бета-каротином и калием, мало калорий"],
      en: ["Rich in beta-carotene and potassium, low calorie"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  ismaloq: {
    benefits: {
      uz: ["Temir, folat va K vitaminiga boy"],
      ru: ["Богат железом, фолатом и витамином K"],
      en: ["Rich in iron, folate and vitamin K"],
    },
    harms: {
      uz: ["Oksalatlar temir va kaltsiy so'rilishini kamaytiradi"],
      ru: ["Оксалаты снижают усвоение железа и кальция"],
      en: ["Oxalates reduce iron and calcium absorption"],
    },
  },
  salat: {
    benefits: {
      uz: ["Kaloriyasi juda past, K vitamini bor"],
      ru: ["Очень мало калорий, есть витамин K"],
      en: ["Very low calorie, contains vitamin K"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  turp: {
    benefits: {
      uz: ["C vitamini va achchiq birikmalar hazmga yordam beradi"],
      ru: ["Витамин C и острые соединения помогают пищеварению"],
      en: ["Vitamin C and peppery compounds aid digestion"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  sarimsoq: {
    benefits: {
      uz: ["Allitsin birikmasi bor, kichik miqdorda foydali"],
      ru: ["Содержит аллицин, полезен в малых количествах"],
      en: ["Contains allicin, beneficial in small amounts"],
    },
    harms: {
      uz: ["Xom holda ko'p yesa oshqozonni bezovta qiladi"],
      ru: ["В сыром виде и в больших дозах раздражает желудок"],
      en: ["Raw and in excess can upset the stomach"],
    },
  },
  zamburug: {
    benefits: {
      uz: ["B vitaminlari va past kaloriyali oqsil manbai"],
      ru: ["Витамины группы B и лёгкий белок"],
      en: ["B vitamins and a light source of protein"],
    },
    harms: { uz: [], ru: [], en: [] },
  },

  /* -- fruit --------------------------------------------------------------- */
  olma: {
    benefits: {
      uz: ["Pektin tolasi va C vitamini bor"],
      ru: ["Пектиновая клетчатка и витамин C"],
      en: ["Pectin fibre and vitamin C"],
    },
    harms: {
      uz: ["Po'stlog'ini olib tashlasa tolasi kamayadi"],
      ru: ["Без кожуры теряет большую часть клетчатки"],
      en: ["Peeling it away loses most of the fibre"],
    },
  },
  banan: {
    benefits: {
      uz: ["Kaliy va tez energiya beruvchi uglevod"],
      ru: ["Калий и быстрые углеводы для энергии"],
      en: ["Potassium and quick-energy carbohydrates"],
    },
    harms: {
      uz: ["Boshqa mevalarga nisbatan shakari yuqoriroq"],
      ru: ["Сахара больше, чем в большинстве фруктов"],
      en: ["Higher in sugar than most fruit"],
    },
  },
  uzum: {
    benefits: {
      uz: ["Po'stida resveratrol antioksidanti bor"],
      ru: ["В кожуре есть антиоксидант ресвератрол"],
      en: ["Skin carries the antioxidant resveratrol"],
    },
    harms: {
      uz: ["Shakari zich, bir o'tirishda ko'p yeyish oson"],
      ru: ["Много сахара, легко съесть слишком много сразу"],
      en: ["Sugar-dense, easy to overeat in one sitting"],
    },
  },
  qovun: {
    benefits: {
      uz: ["Suvsizlanishga qarshi, C vitamini bor"],
      ru: ["Хорошо увлажняет, есть витамин C"],
      en: ["Hydrating with a dose of vitamin C"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  tarvuz: {
    benefits: {
      uz: ["Juda suvli, pomidordagi kabi likopin bor"],
      ru: ["Очень водянистый, содержит ликопин как помидор"],
      en: ["Very hydrating, contains lycopene like tomato"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  shaftoli: {
    benefits: {
      uz: ["A va C vitamini, tolasi bor"],
      ru: ["Витамины A и C, есть клетчатка"],
      en: ["Vitamins A and C, with fibre"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  orik: {
    benefits: {
      uz: ["Beta-karotinga juda boy, tolasi bor"],
      ru: ["Очень богат бета-каротином, есть клетчатка"],
      en: ["Very rich in beta-carotene, with fibre"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  anor: {
    benefits: {
      uz: ["Polifenol antioksidantlarga boy"],
      ru: ["Богат полифенольными антиоксидантами"],
      en: ["Rich in polyphenol antioxidants"],
    },
    harms: {
      uz: ["Ko'pchilik mevalardan shakari yuqoriroq"],
      ru: ["Сахара больше, чем в большинстве фруктов"],
      en: ["Higher in sugar than most fruit"],
    },
  },
  nok: {
    benefits: {
      uz: ["Po'stida tolasi yuqori, to'yg'azadi"],
      ru: ["Много клетчатки в кожуре, насыщает"],
      en: ["High-fibre skin, keeps you full"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  apelsin: {
    benefits: {
      uz: ["Butun holda tolasi bilan C vitamini beradi"],
      ru: ["Целиком даёт витамин C вместе с клетчаткой"],
      en: ["Whole fruit delivers vitamin C with fibre"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  qulupnay: {
    benefits: {
      uz: ["C vitamini yuqori, shakari nisbatan past"],
      ru: ["Много витамина C, сахара сравнительно мало"],
      en: ["High vitamin C, relatively low in sugar"],
    },
    harms: { uz: [], ru: [], en: [] },
  },
  xurmo: {
    benefits: {
      uz: ["A vitamini va tolaga boy"],
      ru: ["Богата витамином A и клетчаткой"],
      en: ["Rich in vitamin A and fibre"],
    },
    harms: {
      uz: ["Boshqa mevalarga nisbatan shakari yuqoriroq"],
      ru: ["Сахара больше, чем в большинстве фруктов"],
      en: ["Higher in natural sugar than most fruit"],
    },
  },
  finik: {
    benefits: {
      uz: ["Zich energiya, kaliy va tola beradi"],
      ru: ["Концентрированная энергия, калий и клетчатка"],
      en: ["Concentrated energy, potassium and fibre"],
    },
    harms: {
      uz: ["Quritilgani shakarini konsentratsiyalaydi, ko'p yeyish oson"],
      ru: ["Сушка концентрирует сахар, легко переесть"],
      en: ["Drying concentrates the sugar, easy to overeat"],
    },
  },
  mayiz: {
    benefits: {
      uz: ["Quritilgan uzumdan temir va kaliy zichlashgan"],
      ru: ["Концентрированные железо и калий из винограда"],
      en: ["Concentrated iron and potassium from grapes"],
    },
    harms: {
      uz: ["Kichik hajmda ham shakari juda yuqori"],
      ru: ["Даже в горсти очень много сахара"],
      en: ["Very high sugar even in a small handful"],
    },
  },
  "quruq-orik": {
    benefits: {
      uz: ["Beta-karotin, temir va tola zichlashgan"],
      ru: ["Концентрированные бета-каротин, железо и клетчатка"],
      en: ["Concentrated beta-carotene, iron and fibre"],
    },
    harms: {
      uz: ["Ko'pincha rangini saqlash uchun sulfit bilan ishlangan"],
      ru: ["Часто обрабатывается сульфитами для сохранения цвета"],
      en: ["Often treated with sulphites to keep the colour"],
    },
  },
  avokado: {
    benefits: {
      uz: ["Monoto'yinmagan yog', kaliy va tolaga boy"],
      ru: ["Мононенасыщенные жиры, калий и клетчатка"],
      en: ["Monounsaturated fat, potassium and fibre"],
    },
    harms: {
      uz: ["Meva bo'lsa ham kaloriyasi zich"],
      ru: ["Калориен, несмотря на то что это фрукт"],
      en: ["Calorie-dense despite being a fruit"],
    },
  },

  /* -- nuts, seeds, fats --------------------------------------------------- */
  yongoq: {
    benefits: {
      uz: ["Omega-3 va sog'lom yog'larga boy", "Yurak-qon tomir salomatligiga foydali"],
      ru: ["Богат омега-3 и полезными жирами", "Полезен для сердечно-сосудистой системы"],
      en: ["Rich in omega-3s and healthy fats", "Supports heart health"],
    },
    harms: {
      uz: ["Kaloriya zich — porsiyani nazorat qiling"],
      ru: ["Калорийный — контролируйте порцию"],
      en: ["Calorie-dense — watch your portion"],
    },
  },
  bodom: {
    benefits: {
      uz: ["E vitamini, tola va oqsilga boy"],
      ru: ["Богат витамином E, клетчаткой и белком"],
      en: ["Rich in vitamin E, fibre and protein"],
    },
    harms: {
      uz: ["Kaloriyasi zich, bir hovuchda ham yuqori"],
      ru: ["Калорийный даже в одной горсти"],
      en: ["Calorie-dense even in a single handful"],
    },
  },
  yeryongoq: {
    benefits: {
      uz: ["Yong'oqlar ichida oqsili eng yuqorilaridan"],
      ru: ["Один из самых белковых орехов"],
      en: ["One of the highest-protein nuts"],
    },
    harms: {
      uz: ["Kaloriyasi zich, allergiya keltirib chiqarishi mumkin"],
      ru: ["Калорийный, частый пищевой аллерген"],
      en: ["Calorie-dense and a common allergen"],
    },
  },
  pista: {
    benefits: {
      uz: ["Yong'oqlar ichida kaliy va tolasi eng yuqori"],
      ru: ["Больше всего калия и клетчатки среди орехов"],
      en: ["Highest potassium and fibre among common nuts"],
    },
    harms: {
      uz: ["Ko'pincha sho'rlangan, natriyni oshiradi"],
      ru: ["Часто солёные, повышают натрий"],
      en: ["Often salted, which adds sodium"],
    },
  },
  "kungaboqar-urugi": {
    benefits: {
      uz: ["E vitamini va selenga boy"],
      ru: ["Богаты витамином E и селеном"],
      en: ["Rich in vitamin E and selenium"],
    },
    harms: {
      uz: ["Qovurilgan va tuzlangani natriyni oshiradi"],
      ru: ["Жареные и солёные повышают натрий"],
      en: ["Roasted and salted versions add sodium"],
    },
  },
  "yeryongoq-moyi": {
    benefits: {
      uz: ["Oqsil va sog'lom yog', to'yg'azadi"],
      ru: ["Белок и полезные жиры, насыщает"],
      en: ["Protein and healthy fat, keeps you full"],
    },
    harms: {
      uz: ["Ba'zi brendlar shakar va yog' qo'shadi"],
      ru: ["Некоторые бренды добавляют сахар и масло"],
      en: ["Some brands add sugar and extra oil"],
    },
  },
  "zaytun-moyi": {
    benefits: {
      uz: ["Monoto'yinmagan yog' va polifenollarga boy"],
      ru: ["Богато мононенасыщенными жирами и полифенолами"],
      en: ["Rich in monounsaturated fat and polyphenols"],
    },
    harms: {
      uz: ["Sof yog', bir osh qoshiqda ham kaloriyasi zich"],
      ru: ["Чистый жир — калориен даже в одной ложке"],
      en: ["Pure fat — calorie-dense even by the spoonful"],
    },
  },
  "kungaboqar-moyi": {
    benefits: {
      uz: ["E vitamini bor, qizdirishga chidamli"],
      ru: ["Есть витамин E, высокая термостойкость"],
      en: ["Contains vitamin E, holds up to heat"],
    },
    harms: {
      uz: ["Omega-6 va kaloriyasi juda yuqori"],
      ru: ["Много омега-6 жиров и калорий"],
      en: ["High in omega-6 fats and calories"],
    },
  },
  "paxta-moyi": {
    benefits: {
      uz: ["Qizdirishga chidamli, an'anaviy pishirish moyi"],
      ru: ["Термостойкое, традиционное масло для готовки"],
      en: ["Heat-stable, a traditional cooking oil"],
    },
    harms: {
      uz: ["Boshqa o'simlik moylariga nisbatan to'yingan yog'i ko'proq"],
      ru: ["Больше насыщенных жиров, чем в других растительных маслах"],
      en: ["More saturated fat than most vegetable oils"],
    },
  },
  asal: {
    benefits: {
      uz: ["Shakardan farqli oz miqdorda antioksidant bor"],
      ru: ["В отличие от сахара, есть немного антиоксидантов"],
      en: ["Unlike sugar, carries a few antioxidants"],
    },
    harms: {
      uz: ["Baribir shakar, qon shakarini tez oshiradi"],
      ru: ["Всё же сахар, быстро поднимает глюкозу"],
      en: ["Still sugar — raises blood sugar quickly"],
    },
  },

  /* -- drinks -------------------------------------------------------------- */
  "qora-kofe": {
    benefits: {
      uz: ["Deyarli kaloriyasiz, antioksidant va kofein beradi"],
      ru: ["Почти без калорий, есть антиоксиданты и кофеин"],
      en: ["Nearly calorie-free with antioxidants and caffeine"],
    },
    harms: {
      uz: ["Kechqurun ichilsa uyquga xalaqit berishi mumkin"],
      ru: ["Вечером может мешать сну"],
      en: ["Late-day cups can interfere with sleep"],
    },
  },
  kola: {
    benefits: { uz: [], ru: [], en: [] },
    harms: {
      uz: ["Qo'shimcha shakar yuqori, ozuqaviy qiymati yo'q", "Muntazam ichish qandli diabet xavfini oshiradi"],
      ru: ["Много добавленного сахара, нет пищевой ценности", "Регулярное употребление повышает риск диабета"],
      en: ["Loaded with added sugar, no nutritional value", "Regular intake raises diabetes risk"],
    },
  },
  "apelsin-sharbat": {
    benefits: {
      uz: ["C vitamini beradi"],
      ru: ["Даёт витамин C"],
      en: ["Provides vitamin C"],
    },
    harms: {
      uz: ["Butun mevadagi tola yo'q, shakari tez so'riladi"],
      ru: ["Нет клетчатки цельного фрукта, сахар усваивается быстро"],
      en: ["Lacks whole fruit's fibre, sugar absorbs fast"],
    },
  },
  energetik: {
    benefits: {
      uz: ["Kofein qisqa muddatli hushyorlik beradi"],
      ru: ["Кофеин даёт кратковременную бодрость"],
      en: ["Caffeine gives a short alertness boost"],
    },
    harms: {
      uz: ["Kofein va shakar birgalikda yurak urishini oshirishi mumkin"],
      ru: ["Кофеин с сахаром могут учащать пульс"],
      en: ["Caffeine plus sugar can raise heart rate"],
    },
  },
  "protein-kukun": {
    benefits: {
      uz: ["To'liq oqsilning qulay va zich manbai"],
      ru: ["Удобный и концентрированный источник белка"],
      en: ["Convenient, concentrated source of complete protein"],
    },
    harms: {
      uz: ["Ba'zi mahsulotlar shakar yoki qo'shimcha ta'm qo'shadi"],
      ru: ["Некоторые продукты содержат сахар или подсластители"],
      en: ["Some products add sugar or sweeteners"],
    },
  },

  /* -- fast food ----------------------------------------------------------- */
  gamburger: {
    benefits: {
      uz: ["Bitta taomda oqsil va uglevod beradi"],
      ru: ["Даёт белок и углеводы в одном блюде"],
      en: ["Combines protein and carbs in one meal"],
    },
    harms: {
      uz: ["Qayta ishlangan kotlet va nonda natriyi yuqori"],
      ru: ["Переработанная котлета и булка, много натрия"],
      en: ["Processed patty and bun, high in sodium"],
    },
  },
  chizburger: {
    benefits: {
      uz: ["Pishloqdan qo'shimcha kaltsiy va oqsil"],
      ru: ["Сыр добавляет ещё кальция и белка"],
      en: ["Cheese adds extra calcium and protein"],
    },
    harms: {
      uz: ["Pishloq to'yingan yog' va tuzni yanada oshiradi"],
      ru: ["Сыр повышает насыщенные жиры и соль ещё больше"],
      en: ["Cheese pushes saturated fat and salt higher"],
    },
  },
  pitsa: {
    benefits: {
      uz: ["Uglevod, oqsil va kaltsiyni birga beradi"],
      ru: ["Сочетает углеводы, белок и кальций"],
      en: ["Combines carbs, protein and calcium"],
    },
    harms: {
      uz: ["Xamir va pishloqdan natriyi yuqori"],
      ru: ["Тесто и сыр дают много натрия"],
      en: ["Crust and cheese add up in sodium"],
    },
  },
  lavash: {
    benefits: {
      uz: ["Haqiqiy tovuq va sabzavotli yengilroq fast-fud"],
      ru: ["Курица с овощами — более лёгкий фастфуд"],
      en: ["Real chicken and vegetables, a lighter fast food"],
    },
    harms: {
      uz: ["Qo'shilgan souslar yog' va tuzni oshiradi"],
      ru: ["Соусы добавляют жир и соль"],
      en: ["Added sauces push up fat and salt"],
    },
  },
  shaurma: {
    benefits: {
      uz: ["Sabzavot bilan oqsilga boy taom"],
      ru: ["Богатое белком блюдо с овощами"],
      en: ["Protein-rich with vegetables mixed in"],
    },
    harms: {
      uz: ["Yog'li souslar tez orada tuz va yog'ni oshiradi"],
      ru: ["Жирные соусы быстро повышают соль и жир"],
      en: ["Fatty sauces quickly add sodium and fat"],
    },
  },
  "hot-dog": {
    benefits: {
      uz: ["Tez tayyor oqsil manbai"],
      ru: ["Быстрый источник белка"],
      en: ["Quick, ready source of protein"],
    },
    harms: {
      uz: ["Qayta ishlangan sosiska, natriy va konservantlari yuqori"],
      ru: ["Переработанная сосиска, много натрия и консервантов"],
      en: ["Processed sausage, high in sodium and preservatives"],
    },
  },
  nagets: {
    benefits: {
      uz: ["Tovuqdan oqsil beradi"],
      ru: ["Даёт белок из курицы"],
      en: ["Provides protein from the chicken"],
    },
    harms: {
      uz: ["Panirovka va yog'da qovurish tuz va yog'ni oshiradi"],
      ru: ["Панировка и жарка повышают соль и жир"],
      en: ["Breading and frying add sodium and fat"],
    },
  },

  /* -- sweets -------------------------------------------------------------- */
  "sut-shokolad": {
    benefits: {
      uz: ["Sutdan biroz kaltsiy va kakao antioksidanti bor"],
      ru: ["Немного кальция из молока и антиоксиданты какао"],
      en: ["Some calcium from milk plus cocoa antioxidants"],
    },
    harms: {
      uz: ["Qo'shilgan shakar va to'yingan yog'i yuqori"],
      ru: ["Много добавленного сахара и насыщенных жиров"],
      en: ["High in added sugar and saturated fat"],
    },
  },
  "qora-shokolad": {
    benefits: {
      uz: ["Kakao flavonoidlariga boy, shakari sutlisidan kamroq"],
      ru: ["Богат флавоноидами какао, меньше сахара, чем в молочном"],
      en: ["Rich in cocoa flavanols, less sugar than milk chocolate"],
    },
    harms: {
      uz: ["Baribir kaloriyasi zich, ko'p yeyish oson"],
      ru: ["Всё же калориен, легко переесть"],
      en: ["Still calorie-dense, easy to overeat"],
    },
  },
  muzqaymoq: {
    benefits: {
      uz: ["Sutdan biroz kaltsiy oladi"],
      ru: ["Немного кальция из молочной основы"],
      en: ["Picks up some calcium from the dairy"],
    },
    harms: {
      uz: ["Qo'shimcha shakar va to'yingan yog'i yuqori"],
      ru: ["Много добавленного сахара и насыщенных жиров"],
      en: ["High in added sugar and saturated fat"],
    },
  },
  pechenye: {
    benefits: {
      uz: ["Tezkor energiya beradi"],
      ru: ["Даёт быструю энергию"],
      en: ["Provides a quick burst of energy"],
    },
    harms: {
      uz: ["Tozalangan un va shakar, to'yg'azmaydi"],
      ru: ["Рафинированная мука и сахар, плохо насыщает"],
      en: ["Refined flour and sugar, poor satiety"],
    },
  },
  tort: {
    benefits: { uz: [], ru: [], en: [] },
    harms: {
      uz: ["Shakar va yog'li krem, bir bo'lagi ham kaloriyasi zich"],
      ru: ["Сахар и жирный крем, калорийный даже один кусок"],
      en: ["Sugar and buttery cream, calorie-dense per slice"],
    },
  },
  shakar: {
    benefits: { uz: [], ru: [], en: [] },
    harms: {
      uz: ["Sof shakar, ozuqaviy qiymati yo'q, qandni tez oshiradi"],
      ru: ["Чистый сахар, нет пищевой ценности, быстро поднимает глюкозу"],
      en: ["Pure sugar, no nutrients, spikes blood sugar fast"],
    },
  },
};
