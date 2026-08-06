import re
import os

base_dir = r'C:\Users\aafru\Desktop\zenfit-fullstack\zenfit\frontend\src\components'

def update_file(filename, rules):
    path = os.path.join(base_dir, filename)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for r in rules:
        if isinstance(r, tuple):
            if len(r) == 2:
                content = content.replace(r[0], r[1])
            elif len(r) == 3 and r[2] == 're':
                content = re.sub(r[0], r[1], content)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Updated {filename}')


update_file('WorkoutsScreen.jsx', [
    (r'setSelectedDay: propSetSelectedDay\n}\)', 'setSelectedDay: propSetSelectedDay,\n  t\n})', 're'),
    ('{totalCount} ta mashq •', '{totalCount} {t.wsExerciseFallback || "ta mashq"} •'),
    ('KUNLIK PROGRESS', '{t.wsDailyProgress || "KUNLIK PROGRESS"}'),
    ('"KUN YAKUNLANDI 🎉"', 't.wsDayCompletedBadge || "KUN YAKUNLANDI 🎉"'),
    ('${doneCount}/${totalCount} bajarildi', '${doneCount}/${totalCount} ${t.completed}'),
    ('Bajariladigan mashqlar ro\'yxati:', '{t.wsExerciseListTitle}'),
    ('{ex.muscle || "Mashq"}', '{ex.muscle || t.wsExerciseFallback}'),
    ('<CheckCircle2 size={13} /> Bajarildi</>', '<CheckCircle2 size={13} /> {t.completed}</>'),
    ('<Play size={13} /> Setlar</>', '<Play size={13} /> {t.wsExStartSets || "Setlar"}</>'),
    ('title="Mashqlar"', 'title={t.workouts}'),
    ('"🤖 AI Shaxsiy Dasturingiz"', 't.wsSubtitleAI'),
    ('"Kunlik mashg\'ulotlar rejasi"', 't.wsSubtitleDefault'),
    ('>FAOL<', '>{t.activeBadge}<'),
    ('Kunlik mashqlar bosqichlari:', '{t.wsDailyStages}'),
    ('Mushaklarni tiklash va dam olish', '{t.wsRestDayDesc}'),
    ('<Coffee size={14} /> Dam olish', '<Coffee size={14} /> {t.wsRestDayBadge || "Dam olish"}'),
    ('{totalEx} ta mashq • {doneEx}/{totalEx} bajarildi', '{totalEx} {t.wsExerciseFallback} • {doneEx}/{totalEx} {t.completed}'),
    ('<CheckCircle2 size={13} /> Kun Bajarildi', '<CheckCircle2 size={13} /> {t.wsDayCompletedBtn || "Kun yakunlandi"}'),
    ('<Play size={12} fill="currentColor" /> Mashqlar ➔', '<Play size={12} fill="currentColor" /> {t.wsDayExercisesBtn || "Mashqlar"} ➔'),
    ('"🔒 Avvalgi kun mashqlarini yakunlang!"', 't.wsLockedToast'),
    ('<Lock size={12} /> Qulflangan', '<Lock size={12} /> {t.locked}'),
    ('Dasturni profil orqali almashtirish ⚙️', '{t.wsSwitchProgramProfile}'),
    ('🤖 AI Reja Tuzish ➔', '{t.wsGenerateAIPlanLink}'),
    ('>Workout Rejangizni Tanlang<', '>{t.wsEmptyStateTitle}<'),
    ('>\n                O\'zingizga mos sun\'iy intellekt haftalik rejasini tuzing yoki top murabbiylarning tayyor dasturini tanlang.\n              <', '>\n                {t.wsEmptyStateDesc}\n              <'),
    ('>🤖 AI Shaxsiy Trener<', '>{t.wsChoiceAITitle}<'),
    ('>Tana vazningizga mos kg\'lar bilan 0ms reja<', '>{t.wsChoiceAIDesc}<'),
    ('Reja Tuzish ➔\n                  </span>', '{t.wsChoiceAIButton}\n                  </span>'),
    ('>🏋️ Trener Dasturlari<', '>{t.wsChoiceTrainerTitle}<'),
    ('>Top murabbiylarning 5+ tayyor rejasi<', '>{t.wsChoiceTrainerDesc}<'),
    ('Tanlash ➔\n                  </span>', '{t.wsChoiceTrainerButton}\n                  </span>')
])

update_file('AIWorkoutGeneratorModal.jsx', [
    ('export default function AIWorkoutGeneratorModal({ userProfile, workoutHistory = [], onClose, onSavePlan }) {',
     'export default function AIWorkoutGeneratorModal({ userProfile, workoutHistory = [], onClose, onSavePlan, t }) {'),
    ('>AI Shaxsiy Trener<', '>{t.aigModalTitle}<'),
    ('>AI rejangizni tuzmoqda...<', '>{t.aigGeneratingTitle}<'),
    ('>Vazningiz ({userProfile?.weightKg || 70}kg) va maqsadlaringiz asosida og\'irliklar hisoblanmoqda<', '>{t.aigGeneratingDesc || "Vazningizga asosida hisoblanmoqda"}<'),
    ('>Asosiy maqsadingiz?<', '>{t.aigStep0Title}<'),
    ('>Mashq hajm va takrorlar me\'yori shunga qarab belgilanadi<', '>{t.aigStep0Desc}<'),
    ('"Ozish & Yog\' yo\'qotish"', 't.aigGoalLose'),
    ('"Vaznni saqlash & Tonus"', 't.aigGoalMaintain'),
    ('"Muskul & Massa yig\'ish"', 't.aigGoalGain'),
    ('>Mashg\'ulot tajribangiz?<', '>{t.aigStep1Title}<'),
    ('>Setlar soni va mashq murakkabligi shunga moslanadi<', '>{t.aigStep1Desc}<'),
    ('"Yangi boshlovchi"', 't.aigLvlBeginner'),
    ('"1 yildan kam tajriba"', 't.aigLvlBeginnerDesc'),
    ('"O\'rta daraja"', 't.aigLvlInter'),
    ('"1-2 yil muntazam mashq"', 't.aigLvlInterDesc'),
    ('"Tajribali sportchi"', 't.aigLvlAdv'),
    ('"2+ yil intensiv mashq"', 't.aigLvlAdvDesc'),
    ('>Haftasiga necha kun?<', '>{t.aigStep2Title}<'),
    ('>Har hafta ushlab tura oladigan realistik kunlarni tanlang<', '>{t.aigStep2Desc}<'),
    ('"3 kun"', 't.aigDays3'),
    ('"Full Body A/B/C split"', 't.aigDays3Desc'),
    ('"4 kun"', 't.aigDays4'),
    ('"Upper / Lower split"', 't.aigDays4Desc'),
    ('"5 kun"', 't.aigDays5'),
    ('"Push / Pull / Legs split"', 't.aigDays5Desc'),
    ('>Qayerda mashq qilasiz?<', '>{t.aigStep3Title}<'),
    ('>Mavjud jihozlarga qarab mashqlar filterlanadi<', '>{t.aigStep3Desc}<'),
    ('"Uyda, asbobsiz"', 't.aigEquipHomeNone'),
    ('"Faqat tana vazni bilan"', 't.aigEquipHomeNoneDesc'),
    ('"Uyda, gantel bilan"', 't.aigEquipHomeDb'),
    ('"Gantellar va turnik"', 't.aigEquipHomeDbDesc'),
    ('"To\'liq sport zali"', 't.aigEquipGym'),
    ('"Shtanga, gantellar va trenajyorlar"', 't.aigEquipGymDesc'),
    ('>Bir mashqqa qancha vaqt?<', '>{t.aigStep4Title}<'),
    ('>Mashqlar soni vaqt chegarasiga sig\'diriladi<', '>{t.aigStep4Desc}<'),
    ('"~30 daqiqa (4-5 mashq)"', 't.aigDur30'),
    ('"45-60 daqiqa (5-6 mashq)"', 't.aigDur60'),
    ('"60-90 daqiqa (6-7 mashq)"', 't.aigDur90'),
    ('>Jarohat yoki cheklov bormi?<', '>{t.aigStep5Title}<'),
    ('>AI shu sohaga yuk beruvchi mashqlarni xavfsiz almashtiradi<', '>{t.aigStep5Desc}<'),
    ('placeholder="Masalan: tizza, bel..."', 'placeholder={t.aigInjuriesPlaceholder}'),
    ('["tizza", "bel", "yelka"].map', '[{id:"tizza", label:t.aigTagKnee}, {id:"bel", label:t.aigTagBack}, {id:"yelka", label:t.aigTagShoulder}].map'),
    ('(tag) =>', '(tagObj) =>'),
    ('key={tag}', 'key={tagObj.id}'),
    ('includes(tag)', 'includes(tagObj.id)'),
    ('replace(tag,', 'replace(tagObj.id,'),
    ('+ tag)', '+ tagObj.id)'),
    ('>{tag}<', '>{tagObj.label}<'),
    ('>Shaxsiy AI Rejangiz Tayyor!<', '>{t.aigResultTitle}<'),
    ('>Tana vazningiz ({userProfile?.weightKg || 70}kg) asosida og\'irliklar hisoblandi<', '>{t.aigResultDesc || "Og\'irliklar hisoblandi"}<'),
    ('jarohati uchun xavfsiz almashtirildi.', '{t.aigReplacedInjuries || "jarohati uchun xavfsiz almashtirildi."}'),
    ('Rejani Saqlash va Boshlash 🚀', '{t.aigSaveAndStart}'),
    ('<>AI Reja Tuzish <Sparkles', '<>{t.aigGenerateBtn} <Sparkles'),
    ('<>Davom Etish <ChevronRight', '<>{t.aigContinueBtn} <ChevronRight')
])

update_file('AIPlanView.jsx', [
    ('export default function AIPlanView({ zc, aiPlan, workoutLog = [], onSelectDay, onRegenerate, onSwitchPlan }) {',
     'export default function AIPlanView({ zc, aiPlan, workoutLog = [], onSelectDay, onRegenerate, onSwitchPlan, t }) {'),
    ('>AI Shaxsiy Dastur 🤖<', '>{t.apvHeaderTitle}<'),
    ('>FAOL<', '>{t.activeBadge}<'),
    ('title="Rejani qayta tuzish"', 'title={t.apvRegenerateTitle}'),
    ('jarohati uchun mashqlar xavfsiz moslashtirildi.', '{t.apvInjuryNotice}'),
    ('Kunlik mashqlar bosqichlari:', '{t.apvDailyStages}'),
    ('{item.focus || "Dam olish"}', '{item.focus || t.apvRestDayTitle}'),
    ('>Mushaklarni tiklash va dam olish<', '>{t.apvRestDayDesc}<'),
    ('<Coffee size={14} /> Dam olish', '<Coffee size={14} /> {t.apvRestDayBadge}'),
    ('{totalEx} ta mashq • {doneEx}/{totalEx} bajarildi', '{totalEx} {t.wsExerciseFallback} • {doneEx}/{totalEx} {t.completed}'),
    ('<CheckCircle2 size={13} /> Kun Bajarildi', '<CheckCircle2 size={13} /> {t.apvDayCompleted}'),
    ('<Play size={12} fill="currentColor" /> Mashqlar ➔', '<Play size={12} fill="currentColor" /> {t.apvViewExercises} ➔'),
    ('Dasturni almashtirish 🔄', '{t.apvSwitchPlan}')
])

update_file('RecipesScreen.jsx', [
    ('export default function RecipesScreen({ zc, onAddMeal }) {',
     'export default function RecipesScreen({ zc, onAddMeal, t }) {'),
    ('useState("Barchasi")', 'useState(t.rcAllFilter)'),
    ('filter === "Barchasi"', 'filter === t.rcAllFilter'),
    ('title="Retseptlar"', 'title={t.recipes}'),
    ('subtitle={`${recipes.length} ta dietaga mos taom`}', 'subtitle={`${recipes.length} ${t.rcDietFriendlyCount || "ta dietaga mos taom"}`}'),
    ('placeholder="Retsept, ingredient qidirish..."', 'placeholder={t.rcSearchPlaceholder}'),
    ('>{filtered.length} ta natija<', '>{filtered.length} {t.rcResultsCount || "ta natija"}<'),
    ('>{r.min} daq<', '>{r.min} {t.rcMinutesUnit || "daq"}<'),
    ('>{r.kcal} kcal<', '>{r.kcal} {t.rcCaloriesUnit || "kcal"}<'),
    ('>{detail.min} daq • {detail.kcal} kcal<', '>{detail.min} {t.rcMinutesUnit || "daq"} • {detail.kcal} {t.rcCaloriesUnit || "kcal"}<'),
    ('Uglevod:', '{t.carbs}:'),
    ('Oqsil:', '{t.protein}:'),
    ('Yog\':', '{t.fat}:'),
    ('>Ingredientlar<', '>{t.rcIngredientsHeader}<'),
    ('<Plus size={16} /> Dietaga qo\'shish', '<Plus size={16} /> {t.rcAddToDiet || t.addToDiet}')
])

update_file('WaterTracker.jsx', [
    ('const WaterTracker = () => {', 'const WaterTracker = ({ t = {} }) => {'),
    ('>Water Intake<', '>{t.wtTitle || "Suv iste\'moli"}<'),
    ('>/{goal} ml<', '>{t.wtUnitMl ? `/${goal} ${t.wtUnitMl}` : `/${goal} ml`}<'),
    ('<Plus size={20} /> Add 250ml', '<Plus size={20} /> {t.wtAddWater || "+ 250ml"}'),
    ('aria-label="Reset water intake"', 'aria-label={t.wtResetAria || "Reset"}')
])

update_file('WeeklyChart.jsx', [
    ('const WeeklyChart = () => {', 'const WeeklyChart = ({ t = {} }) => {'),
    ("{ day: 'Mon',", "{ day: t.wcMon || 'Mon',"),
    ("{ day: 'Tue',", "{ day: t.wcTue || 'Tue',"),
    ("{ day: 'Wed',", "{ day: t.wcWed || 'Wed',"),
    ("{ day: 'Thu',", "{ day: t.wcThu || 'Thu',"),
    ("{ day: 'Fri',", "{ day: t.wcFri || 'Fri',"),
    ("{ day: 'Sat',", "{ day: t.wcSat || 'Sat',"),
    ("{ day: 'Sun',", "{ day: t.wcSun || 'Sun',"),
    ('>Weekly Activity<', '>{t.wcTitle || "Haftalik faollik"}<'),
    ('>Today<', '>{t.wcTodayLegend || "Bugun"}<'),
    ('>Previous Days<', '>{t.wcPreviousLegend || "Oldingi kunlar"}<')
])

update_file('BadgesSection.jsx', [
    ('const BadgesSection = () => {', 'const BadgesSection = ({ t = {} }) => {'),
    ('title: "7-Kunlik Streak"', 'title: t.bdStreakTitle || "7-Kunlik Streak"'),
    ('title: "Retsept Qiroli"', 'title: t.bdRecipeKingTitle || "Retsept ustasi"'),
    ('title: "AI Skanerchi"', 'title: t.bdAiScannerTitle || "AI Skanerchi"'),
    ('title: "PRO Sportchi"', 'title: t.bdProAthleteTitle || "PRO Sportchi"'),
    ('>Yutuqlar<', '>{t.bdSectionTitle || "Yutuqlar"}<'),
    ('>Progress<', '>{t.bdProgressLabel || "Progress"}<')
])

update_file('ZenFitProModal.jsx', [
    ('export default function ZenFitProModal({ onClose, onBuy }) {',
     'export default function ZenFitProModal({ onClose, onBuy, t = {} }) {'),
    ('"AI Ovqat & Mashq Skaneri"', 't.pmFeature1Title || "AI Ovqat & Mashq Skaneri"'),
    ('"Taom rasmini skanerlang va kaloriya/makrolarni avtomatik hisoblang"', 't.pmFeature1Desc || "Taom rasmini skanerlang va kaloriya/makrolarni avtomatik hisoblang"'),
    ('"Barcha Trener Dasturlari"', 't.pmFeature2Title || "Barcha Trener Dasturlari"'),
    ('"Top murabbiylarning 5+ professional mashg\'ulot rejasiga kirish"', 't.pmFeature2Desc || "Top murabbiylarning 5+ professional mashg\'ulot rejasiga kirish"'),
    ('"100+ Fit Retseptlar"', 't.pmFeature3Title || "100+ Fit Retseptlar"'),
    ('"Oziqlanish maqsadingizga mos retseptlar va porsiya hisobi"', 't.pmFeature3Desc || "Oziqlanish maqsadingizga mos retseptlar va porsiya hisobi"'),
    ('"Progress & Streak Tahlili"', 't.pmFeature4Title || "Progress & Streak Tahlili"'),
    ('"Haftalik, oylik kaloriya balansi hamda tana ko\'rsatkichlari grafigi"', 't.pmFeature4Desc || "Haftalik, oylik kaloriya balansi hamda tana ko\'rsatkichlari grafigi"'),
    ('"Shaxsiy Kaloriya & Makro Reja"', 't.pmFeature5Title || "Shaxsiy Kaloriya & Makro Reja"'),
    ('"Yosh, vazn, bo\'y va maqsadingizga moslashtirilgan kunlik me\'yor"', 't.pmFeature5Desc || "Yosh, vazn, bo\'y va maqsadingizga moslashtirilgan kunlik me\'yor"'),
    ('"Reklamasiz va Tez Tajriba"', 't.pmFeature6Title || "Reklamasiz va Tez Tajriba"'),
    ('"Toza, tez va barcha yangi imkoniyatlardan birinchilardan bo\'lib foydalanish"', 't.pmFeature6Desc || "Toza, tez va barcha yangi imkoniyatlardan birinchilardan bo\'lib foydalanish"'),
    ('"1 Yillik Reja"', 't.pmPlanAnnualTitle || "1 Yillik Reja"'),
    ('"ENG TEJAMKOR 🔥 (-30%)"', 't.pmPlanAnnualBadge || "ENG TEJAMKOR 🔥 (-30%)"'),
    ('"Oyiga atigi 14 900 so\'m (Yillik: 179 000 so\'m)"', 't.pmPlanAnnualSub || "Oyiga atigi 14 900 so\'m (Yillik: 179 000 so\'m)"'),
    ('"1 Oylik Reja"', 't.pmPlanMonthlyTitle || "1 Oylik Reja"'),
    ('"OMMABOP 🌟"', 't.pmPlanMonthlyBadge || "OMMABOP 🌟"'),
    ('"Har oylik barqaror natija uchun"', 't.pmPlanMonthlySub || "Har oylik barqaror natija uchun"'),
    ('"7 Kunlik Reja"', 't.pmPlanWeeklyTitle || "7 Kunlik Reja"'),
    ('"SINOV ⚡"', 't.pmPlanWeeklyBadge || "SINOV ⚡"'),
    ('"Sinov muddati uchun mos"', 't.pmPlanWeeklySub || "Sinov muddati uchun mos"'),
    ('>ZenFit Premium-ni Faollashtirish 👑<', '>{t.pmActivateBtn || "ZenFit Premium-ni Faollashtirish 👑"}<')
])
