/**
 * Russian and English text for every exercise.
 *
 * Uzbek stays in exercises.js as the source language; this file carries the
 * other two so the three versions of a movement sit next to each other and a
 * missing translation is obvious. Anything absent falls back to Uzbek rather
 * than showing an empty step list.
 */

const t = (ru, en) => ({ ru, en });

export const EXERCISE_TEXT = {
  /* ---------------- squat pattern ---------------- */
  "barbell-back-squat": {
    name: t("Приседания со штангой", "Barbell back squat"),
    muscle: t("Ноги (квадрицепс, ягодицы)", "Legs (quads, glutes)"),
    steps: {
      ru: [
        "Положите штангу на трапеции за плечами, хват симметричный.",
        "Ноги на ширине плеч, носки слегка развёрнуты наружу.",
        "Вдохните, напрягите живот и опускайтесь, отводя таз назад.",
        "Опускайтесь до параллели бедра с полом (ниже — если колени не болят).",
        "Выдыхая, вставайте, толкая пол пятками.",
      ],
      en: [
        "Rest the bar on your traps behind your shoulders with an even grip.",
        "Feet shoulder-width apart, toes turned slightly out.",
        "Breathe in, brace your core and descend by pushing your hips back.",
        "Go until your thighs are parallel to the floor — deeper if your knees are comfortable.",
        "Drive through your heels and exhale as you stand.",
      ],
    },
    mistakes: {
      ru: ["Колени заваливаются внутрь", "Пятки отрываются от пола", "Округление поясницы", "Слишком быстрый спуск"],
      en: ["Knees caving inward", "Heels lifting off the floor", "Rounding the lower back", "Dropping down too fast"],
    },
  },
  "leg-press": {
    name: t("Жим ногами (тренажёр)", "Leg press machine"),
    muscle: t("Ноги (квадрицепс)", "Legs (quads)"),
    steps: {
      ru: ["Лягте в кресло, прижмите поясницу к спинке.", "Поставьте ноги на платформу на ширине плеч.", "Согните колени до 90 градусов.", "Толкайте пятками, не выпрямляя колени до упора."],
      en: ["Sit back fully with your lower back against the pad.", "Place your feet shoulder-width on the platform.", "Bend your knees to about 90 degrees.", "Push through your heels without locking the knees out."],
    },
    mistakes: {
      ru: ["Полное выпрямление и блокировка коленей", "Отрыв поясницы от спинки", "Большой вес на половину амплитуды"],
      en: ["Locking the knees at the top", "Lifting the lower back off the pad", "Heavy weight through half the range"],
    },
  },
  "goblet-squat": {
    name: t("Гоблет-приседания", "Goblet squat"),
    muscle: t("Ноги, пресс", "Legs, core"),
    steps: {
      ru: ["Держите гантель двумя руками перед грудью.", "Ноги на ширине плеч.", "Опускайтесь вертикально, локти проходят внутрь коленей.", "Вставайте, толкая пятками."],
      en: ["Hold a dumbbell against your chest with both hands.", "Stand with feet shoulder-width apart.", "Squat straight down until your elbows pass inside your knees.", "Drive up through your heels."],
    },
    mistakes: { ru: ["Наклон корпуса вперёд", "Гантель уходит вниз"], en: ["Leaning forward", "Letting the dumbbell drop away from your chest"] },
  },
  "bodyweight-squat": {
    name: t("Приседания без веса", "Bodyweight squat"),
    muscle: t("Ноги, ягодицы", "Legs, glutes"),
    steps: {
      ru: ["Ноги на ширине плеч, руки вытянуты вперёд.", "Опускайтесь, отводя таз назад.", "Опуститесь до параллели бедра с полом.", "Вставайте через пятки и сожмите ягодицы вверху."],
      en: ["Feet shoulder-width apart, arms out in front.", "Sit back by pushing your hips behind you.", "Descend until your thighs are parallel to the floor.", "Stand through your heels and squeeze your glutes at the top."],
    },
    mistakes: { ru: ["Колени сильно выходят за носки", "Округление поясницы"], en: ["Knees travelling far past the toes", "Rounding the lower back"] },
  },
  "bulgarian-split-squat": {
    name: t("Болгарские выпады", "Bulgarian split squat"),
    muscle: t("Ноги, ягодицы", "Legs, glutes"),
    steps: {
      ru: ["Поставьте носок задней ноги на скамью или стул.", "Передняя нога на шаг вперёд.", "Опускайтесь вертикально, переднее колено до 90 градусов.", "Вставайте через пятку передней ноги."],
      en: ["Rest the top of your back foot on a bench or chair.", "Step the front foot forward one stride.", "Lower straight down until the front knee is at 90 degrees.", "Drive up through the front heel."],
    },
    mistakes: { ru: ["Слишком короткий шаг", "Наклон корпуса вперёд", "Потеря равновесия"], en: ["Too short a stride", "Leaning the torso forward", "Losing balance"] },
  },
  "walking-lunge": {
    name: t("Выпады в движении", "Walking lunge"),
    muscle: t("Ноги, ягодицы", "Legs, glutes"),
    steps: {
      ru: ["Встаньте прямо и сделайте большой шаг вперёд.", "Опуститесь, пока оба колена не согнутся до 90 градусов.", "Вставайте через пятку передней ноги и шагайте другой ногой."],
      en: ["Stand tall and take a long step forward.", "Lower until both knees are bent to about 90 degrees.", "Drive up through the front heel and step through with the other leg."],
    },
    mistakes: { ru: ["Заднее колено бьётся об пол", "Наклон корпуса вперёд"], en: ["Back knee slamming into the floor", "Leaning the torso forward"] },
  },

  /* ---------------- hinge pattern ---------------- */
  "barbell-deadlift": {
    name: t("Становая тяга", "Barbell deadlift"),
    muscle: t("Спина, ягодицы, задняя поверхность бедра", "Back, glutes, hamstrings"),
    steps: {
      ru: [
        "Ноги на ширине таза, штанга над серединой стопы.",
        "Наклонитесь, отводя таз назад, держите поясницу ПРЯМОЙ.",
        "Возьмите штангу на ширине плеч, слегка отведите плечи назад.",
        "Вставайте, как будто отталкиваете пол ногами; штанга идёт вплотную к ногам.",
        "Вверху сожмите ягодицы, не отклоняйтесь назад.",
      ],
      en: [
        "Feet hip-width apart, bar over the middle of your foot.",
        "Hinge at the hips and keep your lower back FLAT.",
        "Grip the bar at shoulder width and pull your shoulders back slightly.",
        "Stand by pushing the floor away; keep the bar close to your legs.",
        "Squeeze your glutes at the top — do not lean back.",
      ],
    },
    mistakes: {
      ru: ["Округление поясницы (самая опасная ошибка)", "Штанга уходит от тела", "Отклонение назад в верхней точке", "Начало движения с колен"],
      en: ["Rounding the lower back (the dangerous one)", "Letting the bar drift away from your body", "Leaning back at the top", "Starting the pull with the knees"],
    },
  },
  "romanian-deadlift": {
    name: t("Румынская тяга (RDL)", "Romanian deadlift"),
    muscle: t("Задняя поверхность бедра, ягодицы", "Hamstrings, glutes"),
    steps: {
      ru: ["Возьмите штангу стоя.", "Слегка согните колени и зафиксируйте их.", "Отводя таз назад, ведите штангу вниз вдоль бедра.", "Почувствовав растяжение под бедром, остановитесь и вернитесь, подавая таз вперёд."],
      en: ["Hold the bar standing tall.", "Soften your knees and keep that angle fixed.", "Push your hips back and slide the bar down along your thighs.", "Stop when you feel a stretch in the hamstrings, then drive the hips forward to stand."],
    },
    mistakes: { ru: ["Чрезмерное сгибание коленей (превращается в присед)", "Округление поясницы", "Опускание слишком низко"], en: ["Bending the knees too much (it becomes a squat)", "Rounding the lower back", "Going lower than your hamstrings allow"] },
  },
  "glute-bridge": {
    name: t("Ягодичный мостик", "Glute bridge"),
    muscle: t("Ягодицы, задняя поверхность бедра", "Glutes, hamstrings"),
    steps: {
      ru: ["Лягте на спину, согните колени, пятки близко к ягодицам.", "Толкая пятками, поднимите таз вверх.", "Вверху сожмите ягодицы на 1–2 секунды.", "Медленно опуститесь, не касаясь пола ягодицами."],
      en: ["Lie on your back with knees bent and heels close to your glutes.", "Push through your heels and lift your hips.", "Squeeze your glutes for 1–2 seconds at the top.", "Lower slowly without resting your glutes on the floor."],
    },
    mistakes: { ru: ["Подъём поясницей вместо ягодиц", "Слишком быстрое движение", "Отсутствие сжатия вверху"], en: ["Lifting with the lower back instead of the glutes", "Moving too fast", "Not squeezing at the top"] },
  },
  "db-romanian-deadlift": {
    name: t("Румынская тяга с гантелями", "Dumbbell Romanian deadlift"),
    muscle: t("Задняя поверхность бедра, ягодицы", "Hamstrings, glutes"),
    steps: {
      ru: ["Гантели в обеих руках, стойте прямо.", "Слегка согните колени и зафиксируйте.", "Отводя таз назад, ведите гантели вдоль бедра вниз.", "Почувствовав растяжение, вернитесь за счёт таза."],
      en: ["Hold a dumbbell in each hand, standing tall.", "Soften your knees and keep that angle.", "Push your hips back and lower the dumbbells along your thighs.", "When you feel the stretch, drive the hips forward to stand."],
    },
    mistakes: { ru: ["Округление поясницы", "Гантели уходят от тела"], en: ["Rounding the lower back", "Letting the dumbbells drift away from your legs"] },
  },

  /* ---------------- horizontal push ---------------- */
  "barbell-bench-press": {
    name: t("Жим штанги лёжа", "Barbell bench press"),
    muscle: t("Грудь, трицепс, передняя дельта", "Chest, triceps, front delts"),
    steps: {
      ru: [
        "Лягте на скамью так, чтобы глаза были под штангой.",
        "Возьмите штангу чуть шире плеч.",
        "Сведите и зафиксируйте лопатки, ноги прочно на полу.",
        "На вдохе опустите штангу к середине груди под контролем.",
        "На выдохе выжмите; локти идут под углом около 45 градусов.",
      ],
      en: [
        "Lie back so your eyes are under the bar.",
        "Grip the bar slightly wider than shoulder width.",
        "Pinch your shoulder blades together and plant your feet.",
        "Breathe in and lower the bar under control to mid-chest.",
        "Exhale and press, keeping your elbows at roughly 45 degrees.",
      ],
    },
    mistakes: {
      ru: ["Отбив штанги от груди", "Разведение локтей на 90 градусов (травма плеча)", "Отрыв ягодиц от скамьи", "Максимальный вес без страхующего"],
      en: ["Bouncing the bar off your chest", "Flaring the elbows to 90 degrees (shoulder risk)", "Lifting your glutes off the bench", "Going to your max without a spotter"],
    },
  },
  "incline-db-press": {
    name: t("Жим гантелей на наклонной", "Incline dumbbell press"),
    muscle: t("Верх груди", "Upper chest"),
    steps: {
      ru: ["Установите скамью на 30–45 градусов.", "Держите гантели по бокам груди.", "Выжмите вверх, сводя гантели вверху.", "Опустите под контролем."],
      en: ["Set the bench to 30–45 degrees.", "Hold the dumbbells beside your chest.", "Press up, bringing the dumbbells together at the top.", "Lower under control."],
    },
    mistakes: { ru: ["Слишком крутой угол (нагрузка уходит в плечи)", "Стук гантелей друг о друга"], en: ["Setting the bench too steep (it becomes a shoulder press)", "Clanging the dumbbells together"] },
  },
  "push-up": {
    name: t("Отжимания", "Push up"),
    muscle: t("Грудь, трицепс, пресс", "Chest, triceps, core"),
    steps: {
      ru: ["Примите положение планки, руки чуть шире плеч.", "Тело — прямая линия от головы до пяток.", "Опускайтесь, пока грудь почти не коснётся пола.", "Оттолкнитесь от пола вверх."],
      en: ["Start in a plank with hands slightly wider than your shoulders.", "Keep a straight line from head to heels.", "Lower until your chest is just above the floor.", "Push the floor away to return."],
    },
    mistakes: { ru: ["Провисание таза", "Таз поднят вверх", "Половина амплитуды", "Вытягивание головы вперёд"], en: ["Letting the hips sag", "Piking the hips up", "Cutting the range short", "Craning the head forward"] },
  },
  "db-floor-press": {
    name: t("Жим гантелей с пола", "Dumbbell floor press"),
    muscle: t("Грудь, трицепс", "Chest, triceps"),
    steps: {
      ru: ["Лягте на пол на спину, колени согнуты.", "Держите гантели по бокам груди.", "Опускайте, пока локти не коснутся пола.", "Выжмите вверх."],
      en: ["Lie on the floor with your knees bent.", "Hold the dumbbells beside your chest.", "Lower until your elbows touch the floor.", "Press back up."],
    },
    mistakes: { ru: ["Удар локтями об пол", "Слишком быстрое движение"], en: ["Banging your elbows on the floor", "Moving too quickly"] },
  },

  /* ---------------- horizontal pull ---------------- */
  "barbell-row": {
    name: t("Тяга штанги в наклоне", "Bent over barbell row"),
    muscle: t("Спина (широчайшие), бицепс", "Back (lats), biceps"),
    steps: {
      ru: ["Наклонитесь примерно на 45 градусов, отводя таз назад, поясница прямая.", "Возьмите штангу на ширине плеч.", "Тяните штангу к низу живота, локти близко к телу.", "Сведите лопатки и медленно опустите."],
      en: ["Hinge to about 45 degrees with a flat back.", "Grip the bar at shoulder width.", "Row the bar to your lower stomach with elbows close to your body.", "Squeeze your shoulder blades, then lower slowly."],
    },
    mistakes: { ru: ["Округление поясницы", "Рывки корпусом", "Разведение локтей в стороны"], en: ["Rounding the lower back", "Jerking with the torso", "Flaring the elbows wide"] },
  },
  "seated-cable-row": {
    name: t("Тяга нижнего блока сидя", "Seated cable row"),
    muscle: t("Спина, бицепс", "Back, biceps"),
    steps: {
      ru: ["Сядьте и упритесь ногами, колени слегка согнуты.", "Возьмите рукоять, держите поясницу прямой.", "Тяните рукоять к животу, сводя лопатки.", "Верните под контролем."],
      en: ["Sit with your feet on the platform and knees slightly bent.", "Take the handle and keep your lower back flat.", "Pull the handle to your stomach, squeezing your shoulder blades.", "Return under control."],
    },
    mistakes: { ru: ["Отклонение корпуса назад при тяге", "Подъём плеч к ушам"], en: ["Rocking the torso back to move the weight", "Shrugging the shoulders up"] },
  },
  "db-one-arm-row": {
    name: t("Тяга гантели одной рукой", "One arm dumbbell row"),
    muscle: t("Спина, бицепс", "Back, biceps"),
    steps: {
      ru: ["Поставьте колено и руку на скамью.", "Во второй руке гантель в висе.", "Тяните гантель к боковым рёбрам, локоть близко к телу.", "Медленно опустите."],
      en: ["Place one knee and hand on a bench.", "Let the dumbbell hang in your other hand.", "Row it to the side of your ribs with your elbow close to your body.", "Lower slowly."],
    },
    mistakes: { ru: ["Скручивание корпуса", "Разведение локтя", "Подъём плеча"], en: ["Twisting the torso", "Flaring the elbow", "Shrugging the shoulder"] },
  },
  "inverted-row": {
    name: t("Горизонтальная тяга под столом", "Inverted row (table)"),
    muscle: t("Спина, бицепс", "Back, biceps"),
    steps: {
      ru: ["Возьмитесь за край устойчивого стола и лягте под него.", "Тело — прямая линия, пятки на полу.", "Подтяните грудь к столу.", "Медленно опуститесь."],
      en: ["Grip the edge of a sturdy table and lie underneath it.", "Keep a straight line from head to heels with your heels on the floor.", "Pull your chest up to the table.", "Lower slowly."],
    },
    mistakes: { ru: ["Провисание таза", "Половина амплитуды"], en: ["Letting the hips sag", "Cutting the range short"] },
  },

  /* ---------------- vertical push ---------------- */
  "overhead-press": {
    name: t("Жим штанги стоя", "Standing overhead press"),
    muscle: t("Плечи, трицепс", "Shoulders, triceps"),
    steps: {
      ru: ["Держите штангу на верху груди на ширине плеч.", "Напрягите пресс и ягодицы.", "Выжмите над головой, голова слегка уходит назад.", "Вверху штанга над головой; опустите под контролем."],
      en: ["Hold the bar at the top of your chest, hands shoulder-width.", "Brace your core and glutes.", "Press overhead, moving your head back slightly out of the way.", "Finish with the bar over your head, then lower under control."],
    },
    mistakes: { ru: ["Прогиб в пояснице", "Штанга обходит лицо по дуге", "Помощь ногами (это уже швунг)"], en: ["Arching the lower back", "Pressing around your face instead of past it", "Using your legs to start the rep (that's a push press)"] },
  },
  "db-shoulder-press": {
    name: t("Жим гантелей на плечи", "Dumbbell shoulder press"),
    muscle: t("Плечи, трицепс", "Shoulders, triceps"),
    steps: {
      ru: ["Сидя или стоя держите гантели на уровне плеч.", "Выжмите вверх.", "Опустите до уровня плеч под контролем."],
      en: ["Sitting or standing, hold the dumbbells at shoulder height.", "Press straight up.", "Lower back to shoulder height under control."],
    },
    mistakes: { ru: ["Прогиб в пояснице", "Опускание слишком низко"], en: ["Arching the lower back", "Dropping the dumbbells too low"] },
  },
  "pike-push-up": {
    name: t("Отжимания «домиком»", "Pike push up"),
    muscle: t("Плечи, трицепс", "Shoulders, triceps"),
    steps: {
      ru: ["Из планки поднимите таз вверх (форма буквы V).", "Опустите голову вниз между руками.", "Выжмите вверх."],
      en: ["From a plank, pike your hips up into an inverted V.", "Lower your head down between your hands.", "Press back up."],
    },
    mistakes: { ru: ["Опускание таза", "Зажим шеи"], en: ["Letting the hips drop", "Compressing the neck"] },
  },

  /* ---------------- vertical pull ---------------- */
  "pull-up": {
    name: t("Подтягивания", "Pull up"),
    muscle: t("Спина (широчайшие), бицепс", "Back (lats), biceps"),
    steps: {
      ru: ["Возьмитесь за турник шире плеч.", "Опустите лопатки вниз.", "Подтянитесь, пока подбородок не окажется выше перекладины.", "Медленно опуститесь в полный вис."],
      en: ["Grip the bar wider than your shoulders.", "Pull your shoulder blades down.", "Pull until your chin clears the bar.", "Lower slowly to a full hang."],
    },
    mistakes: { ru: ["Раскачивание", "Половина амплитуды", "Плечи поднимаются к ушам"], en: ["Swinging (kipping unintentionally)", "Cutting the range short", "Shrugging the shoulders to your ears"] },
  },
  "lat-pulldown": {
    name: t("Тяга верхнего блока", "Lat pulldown"),
    muscle: t("Спина, бицепс", "Back, biceps"),
    steps: {
      ru: ["Сядьте и заведите бёдра под валики.", "Возьмите рукоять широким хватом.", "Тяните к верху груди, слегка отклонив корпус назад.", "Верните под контролем."],
      en: ["Sit and tuck your thighs under the pads.", "Take a wide grip on the bar.", "Pull to your upper chest, leaning back slightly.", "Return under control."],
    },
    mistakes: { ru: ["Тяга за голову (опасно)", "Сильное раскачивание корпусом"], en: ["Pulling behind your neck (risky)", "Swinging the torso to move the weight"] },
  },
  "doorway-row": {
    name: t("Тяга в дверном проёме", "Doorway row"),
    muscle: t("Спина, бицепс", "Back, biceps"),
    steps: {
      ru: ["Возьмитесь за прочный дверной косяк.", "Отклоните корпус назад, выпрямив руки.", "Подтяните себя к косяку."],
      en: ["Grip a solid door frame.", "Lean your body back with your arms straight.", "Pull yourself in towards the frame."],
    },
    mistakes: { ru: ["Использование шаткой двери", "Прогиб в пояснице"], en: ["Using a door that isn't solid", "Arching the lower back"] },
  },

  /* ---------------- core ---------------- */
  plank: {
    name: t("Планка", "Plank"),
    muscle: t("Пресс, поясница", "Core, lower back"),
    steps: {
      ru: ["Локти под плечами, предплечья на полу.", "Тело — прямая линия от головы до пяток.", "Напрягите пресс и ягодицы.", "Не задерживайте дыхание — дышите ровно."],
      en: ["Elbows under your shoulders, forearms on the floor.", "Hold a straight line from head to heels.", "Brace your core and glutes.", "Don't hold your breath — keep breathing steadily."],
    },
    mistakes: { ru: ["Подъём или провисание таза", "Задержка дыхания", "Голова опущена вниз"], en: ["Hips piking up or sagging down", "Holding your breath", "Letting your head drop"] },
  },
  "hanging-leg-raise": {
    name: t("Подъём ног в висе", "Hanging leg raise"),
    muscle: t("Нижний пресс", "Lower abs"),
    steps: {
      ru: ["Повисните на турнике.", "Слегка скрутите таз назад и поднимайте ноги.", "Поднимайте до горизонтали.", "Медленно опустите, не раскачиваясь."],
      en: ["Hang from the bar.", "Tuck your pelvis slightly and raise your legs.", "Lift until your legs are horizontal.", "Lower slowly without swinging."],
    },
    mistakes: { ru: ["Раскачивание", "Подъём только бёдрами"], en: ["Swinging", "Lifting with the hip flexors only"] },
  },
  "mountain-climber": {
    name: t("Скалолаз", "Mountain climber"),
    muscle: t("Пресс, кардио", "Core, cardio"),
    steps: {
      ru: ["Примите положение планки.", "Поочерёдно подтягивайте колени к груди.", "Держите быстрый темп и стабильный таз."],
      en: ["Start in a plank position.", "Drive your knees to your chest one at a time.", "Keep a quick tempo and a steady hip position."],
    },
    mistakes: { ru: ["Подъём таза вверх", "Руки уходят вперёд из-под плеч"], en: ["Piking the hips up", "Hands drifting forward from under your shoulders"] },
  },
  "bicycle-crunch": {
    name: t("Велосипед", "Bicycle crunch"),
    muscle: t("Косые мышцы живота", "Obliques"),
    steps: {
      ru: ["Лягте на спину, руки за головой.", "Сводите противоположные локоть и колено.", "Чередуйте стороны."],
      en: ["Lie on your back with your hands behind your head.", "Bring opposite elbow and knee together.", "Alternate sides."],
    },
    mistakes: { ru: ["Тяга шеи руками", "Слишком быстрое, неконтролируемое движение"], en: ["Pulling on your neck", "Rushing without control"] },
  },

  /* ---------------- arms & delts ---------------- */
  "barbell-curl": {
    name: t("Подъём штанги на бицепс", "Barbell biceps curl"),
    muscle: t("Бицепс", "Biceps"),
    steps: {
      ru: ["Стоя возьмите штангу снизу на ширине плеч.", "Прижмите локти к корпусу.", "Согните руки, поднимая штангу.", "Медленно опустите."],
      en: ["Stand and grip the bar underhand at shoulder width.", "Keep your elbows pinned to your sides.", "Curl the bar up.", "Lower slowly."],
    },
    mistakes: { ru: ["Раскачивание корпусом", "Вынос локтей вперёд"], en: ["Swinging the torso", "Letting the elbows drift forward"] },
  },
  "db-curl": {
    name: t("Подъём гантелей на бицепс", "Dumbbell biceps curl"),
    muscle: t("Бицепс", "Biceps"),
    steps: {
      ru: ["Гантели в обеих руках, стойте прямо.", "Зафиксируйте локти и сгибайте руки вверх.", "Сожмите бицепс вверху.", "Медленно опустите."],
      en: ["Hold a dumbbell in each hand, standing tall.", "Keep your elbows fixed and curl up.", "Squeeze the biceps at the top.", "Lower slowly."],
    },
    mistakes: { ru: ["Раскачивание", "Половина амплитуды"], en: ["Swinging", "Cutting the range short"] },
  },
  "triceps-pushdown": {
    name: t("Разгибания на блоке", "Triceps pushdown"),
    muscle: t("Трицепс", "Triceps"),
    steps: {
      ru: ["Возьмите рукоять верхнего блока.", "Прижмите локти к корпусу.", "Выпрямите руки вниз.", "Медленно верните."],
      en: ["Take the handle on the high pulley.", "Keep your elbows pinned to your sides.", "Straighten your arms down.", "Return slowly."],
    },
    mistakes: { ru: ["Локти уходят от корпуса", "Продавливание весом корпуса"], en: ["Elbows drifting away from your body", "Leaning your bodyweight into the bar"] },
  },
  "bench-dip": {
    name: t("Отжимания от скамьи", "Bench dips"),
    muscle: t("Трицепс", "Triceps"),
    steps: {
      ru: ["Обопритесь руками о край стула.", "Опускайтесь, подавая таз вперёд.", "Опуститесь, пока локти не согнутся до 90 градусов.", "Выжмите себя вверх."],
      en: ["Place your hands on the edge of a bench behind you.", "Lower with your hips just in front of the bench.", "Descend until your elbows reach 90 degrees.", "Press back up."],
    },
    mistakes: { ru: ["Опускание плеч слишком низко", "Разведение локтей в стороны"], en: ["Dropping the shoulders too far", "Flaring the elbows out"] },
  },
  "lateral-raise": {
    name: t("Махи гантелями в стороны", "Dumbbell lateral raise"),
    muscle: t("Средняя дельта", "Side delts"),
    steps: {
      ru: ["Лёгкие гантели в обеих руках, стойте прямо.", "Слегка согните локти и поднимайте руки в стороны.", "Остановитесь на уровне плеч.", "Медленно опустите."],
      en: ["Hold light dumbbells, standing tall.", "With a soft bend in your elbows, raise your arms out to the sides.", "Stop at shoulder height.", "Lower slowly."],
    },
    mistakes: { ru: ["Слишком большой вес", "Раскачивание корпусом", "Подъём выше уровня плеч"], en: ["Going too heavy", "Swinging the torso", "Raising above shoulder height"] },
  },
  "face-pull": {
    name: t("Тяга к лицу", "Face pull"),
    muscle: t("Задняя дельта, трапеции", "Rear delts, traps"),
    steps: {
      ru: ["Установите блок на уровень лица.", "Возьмите канат и тяните к лицу.", "Локти держите высоко, сводите лопатки.", "Медленно верните."],
      en: ["Set the pulley at face height.", "Take the rope and pull towards your face.", "Keep your elbows high and squeeze your shoulder blades.", "Return slowly."],
    },
    mistakes: { ru: ["Слишком большой вес", "Опускание локтей вниз"], en: ["Going too heavy", "Letting the elbows drop"] },
  },
  "standing-calf-raise": {
    name: t("Подъём на носки стоя", "Standing calf raise"),
    muscle: t("Икры", "Calves"),
    steps: {
      ru: ["Встаньте носками на край ступеньки.", "Опустите пятки максимально вниз.", "Поднимитесь на носки.", "Задержитесь вверху на 1 секунду."],
      en: ["Stand with the balls of your feet on the edge of a step.", "Let your heels drop as far as comfortable.", "Rise onto your toes.", "Hold for a second at the top."],
    },
    mistakes: { ru: ["Быстрые пружинящие движения", "Половина амплитуды"], en: ["Bouncing quickly", "Cutting the range short"] },
  },

  /* -------- gym alternates -------- */
  "machine-shoulder-press": {
    name: t("Жим на плечи в тренажёре", "Machine shoulder press"),
    muscle: t("Плечи, трицепс", "Shoulders, triceps"),
    steps: {
      ru: ["Отрегулируйте сиденье так, чтобы рукояти были на уровне плеч.", "Прижмите поясницу к спинке.", "Выжмите вверх, не блокируя локти.", "Верните под контролем."],
      en: ["Set the seat so the handles sit at shoulder height.", "Keep your back against the pad.", "Press up without locking your elbows.", "Return under control."],
    },
    mistakes: { ru: ["Неверная высота сиденья", "Отрыв поясницы от спинки"], en: ["Wrong seat height", "Lifting your back off the pad"] },
  },
  "preacher-curl": {
    name: t("Сгибания на скамье Скотта", "Preacher curl"),
    muscle: t("Бицепс", "Biceps"),
    steps: {
      ru: ["Полностью положите локти на наклонную подушку.", "Согните руки, поднимая вес.", "Сожмите бицепс вверху.", "Опустите медленно и до конца."],
      en: ["Rest your elbows fully on the angled pad.", "Curl the weight up.", "Squeeze at the top.", "Lower slowly and fully."],
    },
    mistakes: { ru: ["Отрыв локтей от подушки", "Резкий сброс веса внизу"], en: ["Lifting the elbows off the pad", "Dropping the weight at the bottom"] },
  },
  "overhead-triceps-extension": {
    name: t("Разгибания из-за головы", "Overhead triceps extension"),
    muscle: t("Трицепс", "Triceps"),
    steps: {
      ru: ["Держите вес над головой двумя руками.", "Зафиксируйте локти близко к ушам.", "Выпрямите руки вверх.", "Медленно опустите."],
      en: ["Hold the weight overhead with both hands.", "Keep your elbows fixed close to your ears.", "Straighten your arms up.", "Lower slowly."],
    },
    mistakes: { ru: ["Разведение локтей в стороны", "Прогиб в пояснице"], en: ["Flaring the elbows out", "Arching the lower back"] },
  },
  "cable-lateral-raise": {
    name: t("Махи в стороны на блоке", "Cable lateral raise"),
    muscle: t("Средняя дельта", "Side delts"),
    steps: {
      ru: ["Возьмите нижний блок противоположной рукой.", "Слегка согнув локоть, поднимайте руку в сторону.", "Остановитесь на уровне плеча.", "Медленно опустите."],
      en: ["Take the low pulley in the opposite hand.", "With a soft elbow, raise your arm out to the side.", "Stop at shoulder height.", "Lower slowly."],
    },
    mistakes: { ru: ["Слишком большой вес", "Помощь корпусом"], en: ["Going too heavy", "Using your torso to start the rep"] },
  },
  "cable-crunch": {
    name: t("Скручивания на блоке", "Cable crunch"),
    muscle: t("Пресс", "Abs"),
    steps: {
      ru: ["Встаньте на колени перед верхним блоком.", "Держите канат у головы.", "Скручивайтесь вниз за счёт пресса.", "Медленно вернитесь."],
      en: ["Kneel in front of the high pulley.", "Hold the rope beside your head.", "Crunch down using your abs.", "Return slowly."],
    },
    mistakes: { ru: ["Тяга руками", "Движение тазом"], en: ["Pulling with your arms", "Moving at the hips"] },
  },
  "seated-calf-raise": {
    name: t("Подъём на носки сидя", "Seated calf raise"),
    muscle: t("Икры", "Calves"),
    steps: {
      ru: ["Заведите колени под валик.", "Поставьте носки на платформу.", "Опустите пятки вниз, затем поднимите вверх.", "Задержитесь вверху на 1 секунду."],
      en: ["Tuck your knees under the pad.", "Place the balls of your feet on the platform.", "Let your heels drop, then press up.", "Hold for a second at the top."],
    },
    mistakes: { ru: ["Половина амплитуды", "Слишком быстрое движение"], en: ["Cutting the range short", "Moving too fast"] },
  },

  /* ---------------- traps / neck ---------------- */
  "db-shrug": {
    name: t("Шраги с гантелями", "Dumbbell shrug"),
    muscle: t("Трапеции, шея", "Traps, neck"),
    steps: {
      ru: [
        "Встаньте прямо, гантели в опущенных руках по бокам.",
        "Поднимите плечи строго вверх, к ушам.",
        "Задержитесь наверху на секунду.",
        "Медленно опустите плечи вниз.",
      ],
      en: [
        "Stand tall with a dumbbell hanging at each side.",
        "Lift your shoulders straight up toward your ears.",
        "Hold at the top for a second.",
        "Lower your shoulders slowly.",
      ],
    },
    mistakes: {
      ru: ["Вращение плечами", "Вытягивание шеи вперёд", "Слишком большой вес"],
      en: ["Rolling the shoulders", "Craning the neck forward", "Going too heavy"],
    },
  },
  "barbell-shrug": {
    name: t("Шраги со штангой", "Barbell shrug"),
    muscle: t("Трапеции, шея", "Traps, neck"),
    steps: {
      ru: [
        "Держите штангу перед бёдрами, хват на ширине плеч.",
        "Поднимите плечи строго вверх.",
        "Коротко задержитесь наверху.",
        "Опустите под контролем.",
      ],
      en: [
        "Hold the bar in front of your thighs, hands shoulder-width apart.",
        "Lift your shoulders straight up.",
        "Pause briefly at the top.",
        "Lower under control.",
      ],
    },
    mistakes: {
      ru: ["Тяга поясницей", "Вращение плечами", "Укороченная амплитуда"],
      en: ["Pulling with the lower back", "Rolling the shoulders", "Cutting the range short"],
    },
  },
  "neck-isometric": {
    name: t("Изометрия для шеи", "Isometric neck hold"),
    muscle: t("Шея", "Neck"),
    steps: {
      ru: [
        "Положите ладонь на лоб.",
        "Давите головой в ладонь, но голова остаётся неподвижной.",
        "Удерживайте 10-15 секунд.",
        "Повторите для боковых сторон и затылка.",
      ],
      en: [
        "Place a palm against your forehead.",
        "Press your head into the palm while keeping the head still.",
        "Hold for 10-15 seconds.",
        "Repeat for each side and the back of the head.",
      ],
    },
    mistakes: {
      ru: ["Резкие движения", "Задержка дыхания", "Продолжать при боли"],
      en: ["Jerky movements", "Holding your breath", "Continuing through pain"],
    },
  },
};

/**
 * Returns the exercise with its text swapped into `lang`.
 * Uzbek is the source, so it (and any gap in a translation) passes through
 * unchanged rather than rendering blanks.
 */
export function localizeExercise(exercise, lang) {
  if (!exercise || lang === "uz") return exercise;
  const tr = EXERCISE_TEXT[exercise.id];
  if (!tr) return exercise;

  return {
    ...exercise,
    name: tr.name?.[lang] || exercise.name,
    muscle: tr.muscle?.[lang] || exercise.muscle,
    steps: tr.steps?.[lang] || exercise.steps,
    mistakes: tr.mistakes?.[lang] || exercise.mistakes,
  };
}
