/**
 * English dictionary.
 *
 * Kept in its own module so the three languages stay readable side by side
 * instead of one file growing past the point where a missing key is easy to
 * spot. Merged into DICTS by i18n.js.
 */
export default {
  common: {
    save: "Save", cancel: "Cancel", close: "Close", back: "Back",
    delete: "Delete", edit: "Edit", add: "Add", done: "Done",
    loading: "Loading…", error: "Something went wrong", retry: "Retry",
    saved: "Saved", deleted: "Deleted", soon: "Soon",
    min: "min", kcal: "kcal", kg: "kg", km: "km", cm: "cm", none: "None",
    on: "On", off: "Off", optional: "optional",
  },
  nav: { home: "Home", workouts: "Workouts", scan: "Scan", trainer: "Trainer", profile: "Profile" },

  home: {
    morning: "Good morning", day: "Good afternoon", evening: "Good evening", night: "Good night",
    remaining: "kcal left", over: "over", eaten: "Eaten", target: "Target", burned: "Burned",
    protein: "Protein", carbs: "Carbs", fat: "Fat",
    water: "Water", todayStatus: "Today", meals: "Meals", workouts: "Workouts", streak: "Streak",
    todayMeals: "Today's meals", addMeal: "+ Add",
    noMeals: "Nothing logged yet", noMealsDesc: "Scan a photo of your food or pick from recipes.",
    scanWithAi: "Scan with AI",
    qaScan: "AI Scan", qaRecipes: "Recipes", qaProgress: "Progress", qaTrainer: "AI Trainer", qaActivity: "Activity",
    planNudge: "Build your AI workout plan", planNudgeDesc: "A weekly plan with weights matched to you",
    days: "d", ta: "",
  },

  activity: {
    title: "Activity", subtitle: "Running, walking and other sessions",
    logTitle: "Log activity", pick: "Pick an activity",
    duration: "Duration", distance: "Distance", intensity: "Intensity",
    light: "Light", moderate: "Moderate", vigorous: "Vigorous",
    note: "Note", notePlaceholder: "e.g. around the park",
    customName: "Activity name", customPlaceholder: "e.g. table tennis",
    save: "Save activity", saved: "Activity logged",
    todayTitle: "Activity today", empty: "No activity logged today",
    emptyDesc: "Went for a run or a walk? Log it here.",
    burned: "burned", estimate: "Approximately",
    names: {
      walking: "Walking", running: "Running", cycling: "Cycling", swimming: "Swimming",
      "jump-rope": "Jump rope", hiit: "HIIT", football: "Football", basketball: "Basketball",
      tennis: "Tennis", volleyball: "Volleyball", boxing: "Boxing", dancing: "Dancing",
      yoga: "Yoga", stretching: "Stretching", stairs: "Stairs", hiking: "Hiking",
      gym: "Gym session", custom: "Other",
    },
  },

  equipment: {
    any: "Any equipment", gym: "Gym", "home-dumbbell": "Dumbbells", "home-none": "No equipment", outdoor: "Outdoors",
  },
  muscleGroups: {
    all: "All", squat: "Legs", pushH: "Chest", pullH: "Back", pushV: "Shoulders", biceps: "Arms", core: "Core",
  },

  workout: {
    set: "Set", sets: "sets", reps: "reps", weight: "weight",
    rest: "Rest", restNow: "Rest", restDone: "Rest over", skipRest: "Skip", addTime: "+15s",
    target: "Target", setsTitle: "Sets", guideDesc: "Video and proper technique",
    startSet: "Start set", setDone: "Set done", finish: "Finish exercise",
    dayProgress: "Day progress", dayDone: "Day complete 🎉",
    lastTime: "Last time", progressed: "Weight increased",
    bodyweight: "bodyweight", lightWeight: "light weight",
    addSet: "Add set", removeSet: "Remove set",
    guide: "How to", howTo: "Step by step", mistakes: "Common mistakes",
    video: "Video guide", videoMissing: "No video for this exercise yet",
    openYoutube: "Open on YouTube", muscles: "Muscles worked", equipment: "Equipment",
    allDone: "All sets complete", ofSets: "of", restBetween: "Between sets",
    exerciseDone: "Exercise complete 💪", saveFailed: "Could not save",
    tapSetToStart: "Tap a set to start, then mark it done",
  },

  profile: {
    title: "Profile", hello: "Hi", user: "User",
    age: "Age", height: "Height", weight: "Weight", streak: "Streak",
    editProfile: "Edit profile", editProfileDesc: "Name, photo and body metrics",
    health: "Health data", healthDesc: "Goal, plans and BMI",
    billing: "Cards and payments", billingDesc: "Cards and purchase history",
    settings: "App settings", settingsDesc: "Language, theme and notifications",
    help: "Help", helpDesc: "Frequently asked questions",
    about: "About us", aboutDesc: "About ZenFit",
    offer: "Terms of service", offerDesc: "Terms of use",
    logout: "Log out", logoutConfirm: "Log out of your account?",
    premium: "ZenFit Premium", premiumDesc: "Unlimited AI scanner and trainer",
    dailyTarget: "Daily target",

    name: "Name", namePlaceholder: "Your name", gender: "Gender", male: "Male", female: "Female",
    photo: "Profile photo", changePhoto: "Change photo", removePhoto: "Remove photo",
    photoHint: "A square photo looks best",
    bodyMetrics: "Body metrics", activityLevel: "Daily activity",
    activityLevels: {
      sedentary: "Sedentary", light: "Lightly active", moderate: "Moderately active",
      active: "Active", very_active: "Very active",
    },
    targetsRecalc: "Targets recalculated",

    goal: "Goal", goals: { lose: "Lose weight", maintain: "Maintain weight", gain: "Build muscle" },
    level: "Experience level",
    levels: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" },
    bmi: "Body mass index (BMI)",
    bmiCats: { under: "Underweight", normal: "Normal", over: "Overweight", obese: "Obese" },
    bmiHint: "BMI is a rough measure — it can read high if you carry a lot of muscle.",
    activePlans: "Active plans", workoutPlan: "Workout plan", dietPlan: "Meal plan",
    noPlan: "No plan yet", createPlan: "Create a plan",
    injuries: "Injuries / limits", waterTarget: "Water target",

    cards: "Cards", addCard: "Add card",
    cardsEmpty: "No card linked",
    cardsEmptyDesc: "Cards are linked on the payment provider's secure page — your card number is never entered in the app.",
    cardsSecurity: "For your security, card numbers are never stored in ZenFit. Only the last 4 digits and the provider token are visible.",
    purchases: "Purchase history", purchasesEmpty: "No purchases yet",
    purchasesEmptyDesc: "Receipts appear here once you buy Premium.",
    statusPaid: "Paid", statusPending: "Pending", statusFailed: "Cancelled",
    subscription: "Subscription", freePlan: "Free plan", expires: "Valid until",

    language: "Language", theme: "Theme",
    themes: { dark: "Dark", light: "Light", system: "System" },
    notifications: "Notifications",
    notifWorkout: "Workout reminder", notifWorkoutDesc: "A nudge on your training days",
    notifMeal: "Meal reminder", notifMealDesc: "So you don't forget to log a meal",
    notifWater: "Water reminder", notifWaterDesc: "A reminder to drink through the day",
    notifTips: "Tips and news", notifTipsDesc: "Weekly tips and new features",
    notifHint: "Notifications are delivered through the Telegram bot.",
    version: "Version",
  },

  premium: {
    choosePlan: "Choose a plan", payByCard: "Pay by card", payTitle: "Payment",
    card: "Card", copyCard: "Copy card number", copied: "Copied ✓",
    step1: "Transfer the amount shown to the card above.",
    step2: "Take a photo or screenshot of the payment receipt.",
    step3: "Send the receipt with the button below — an admin will review and confirm it.",
    sendReceipt: "Send receipt",
    sentTitle: "Receipt sent!",
    sentDesc: "Premium activates automatically once an admin reviews it, and you'll get a message on Telegram. This usually takes 1–2 hours.",
    manualHint: "Payment is made by card transfer. Your card details are never entered in the app.",
    notReady: "Payments are not set up yet. Please try again later.",
    features: {
      unlimitedScan: { title: "Unlimited AI scanner", desc: "Scan as many meals as you like" },
      unlimitedTrainer: { title: "Unlimited AI trainer", desc: "Ask anything, any time, with no message limit" },
      allPrograms: { title: "All training programmes", desc: "Ready-made plans from top coaches" },
      analytics: { title: "Advanced analytics", desc: "Monthly progress and detailed reports" },
      noAds: { title: "Ad-free experience", desc: "Be first to get new features" },
    },
  },

  help: {
    title: "Help",
    contact: "Still have questions?", contactDesc: "Message us on Telegram",
    faq: [
      { q: "How does the AI scanner work?", a: "You upload a photo of your food, the AI recognises it and estimates calories and macros. It is an estimate — use a scale when you need precision." },
      { q: "How is my calorie target calculated?", a: "With the Mifflin-St Jeor formula: your basal rate comes from sex, age, height, weight and activity level, then a deficit or surplus is applied for your goal." },
      { q: "Where do the training weights come from?", a: "Your starting weight is derived from your bodyweight and experience level with a 0.8 safety factor. It then rises gradually based on the sets you actually complete." },
      { q: "Is my data safe?", a: "Your data is stored over an encrypted connection. Card numbers are never stored on ZenFit servers — payment happens on the provider's secure page." },
      { q: "How do I cancel Premium?", a: "Your subscription runs to the end of the paid period and does not auto-renew. Message support if you have questions." },
    ],
  },

  about: {
    title: "About us",
    tagline: "A personal companion that runs your nutrition and training through one AI.",
    body: "ZenFit is a healthy-lifestyle app built for people in Uzbekistan. Our goal is to make coaching and nutrition guidance clear and affordable for everyone.",
    whatWeDo: "What we do",
    features: [
      "Read calories and macros from a photo of your meal",
      "Training and nutrition plans matched to your body metrics",
      "A video guide and proper technique for every exercise",
      "An AI trainer that answers questions through the day",
    ],
    contact: "Contact", telegram: "Telegram", version: "Version",
  },

  offer: {
    title: "Terms of service",
    intro: "This document sets out the terms for using the ZenFit app. By using the app you agree to the terms below.",
    sections: [
      { h: "1. About the service", p: "ZenFit is an information service for tracking nutrition and physical activity. The app does not provide medical services and does not diagnose conditions." },
      { h: "2. Medical disclaimer", p: "Calorie targets, training plans and AI trainer advice are general guidance only. If you have a chronic condition, are pregnant, or are injured, consult a doctor before starting any diet or training." },
      { h: "3. Subscription and payment", p: "A Premium subscription is granted for the chosen period and does not auto-renew. Payment is handled by licensed providers (Payme, Click). Card data is not stored on ZenFit servers." },
      { h: "4. Refunds", p: "If the service has not been used within 3 days of activation, you may contact support to request a refund." },
      { h: "5. Data", p: "The data you enter is used only to provide the service and is never sold to third parties. If you ask for your account to be deleted, your data is deleted with it." },
      { h: "6. Liability", p: "You are responsible for the accuracy of the data you enter and for exercising safely. ZenFit is not liable for outcomes caused by incorrectly entered data." },
    ],
    updated: "Last updated",
  },
};
