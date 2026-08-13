/**
 * LogMeal food recognition.
 *
 * A purpose-built food model rather than a general vision model: it returns
 * measured nutrition from a food database instead of a language model's
 * estimate, which is the reason to prefer it when it recognises the dish.
 *
 * Recognition is two calls — segmentation to identify what is on the plate,
 * then a nutrition lookup keyed on the resulting imageId. Both have to land
 * inside one serverless invocation, hence the deadline below.
 *
 * Deliberately normalises to the exact result shape `analyzeFoodImage`
 * produces, so `routes/ai.js` can fall back to the language model without the
 * client being able to tell which one answered — apart from the `provider`
 * field, which is there so the two can actually be compared in the wild.
 */

const BASE = "https://api.logmeal.com";

/** Keys copied out of .env.example must not count as configured. */
const PLACEHOLDER = /^(your-|<|change-this)/i;

const token = () => process.env.LOGMEAL_API_KEY;

export const logmealConfigured = () =>
  Boolean(token() && !PLACEHOLDER.test(String(token()).trim()));

/**
 * Below this, the guess is not worth showing.
 *
 * LogMeal returns a ranked list and will happily name something at p=0.05.
 * Handing that to someone as "your lunch was X" is worse than admitting the
 * photo was not readable, and worse than what the language model would have
 * said — so anything under this threshold falls through to the AI instead.
 */
const MIN_CONFIDENCE = 0.2;

/**
 * Total budget for both calls.
 *
 * vercel.json caps the function at 30s and the AI fallback still has to run
 * after this gives up, so LogMeal does not get to spend the whole request. A
 * scan that takes longer than this is a failed scan from the user's point of
 * view anyway.
 */
const DEADLINE_MS = 9000;

/** LogMeal's own language codes. Uzbek and Russian are not among them. */
const LANGUAGES = new Set(["spa", "cat", "eng", "ita", "nld", "fre", "ger", "tur", "gre", "heb"]);
const langCode = (lang) => (LANGUAGES.has(lang) ? lang : "eng");

function logmealError(status, text) {
  const err = new Error(`LogMeal API xatosi (${status}): ${String(text).slice(0, 300)}`);
  err.code = "LOGMEAL_ERROR";
  err.status = status;
  return err;
}

async function post(path, { body, headers = {}, signal }) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, ...headers },
    body,
    signal,
  });
  if (!res.ok) throw logmealError(res.status, await res.text().catch(() => ""));
  return res.json();
}

/** Highest-probability guess across every detected food item on the plate. */
function bestGuess(segmentation) {
  let best = null;
  for (const item of segmentation?.segmentation_results || []) {
    for (const guess of item.recognition_results || []) {
      if (!best || (guess.prob ?? 0) > (best.prob ?? 0)) best = guess;
    }
  }
  return best;
}

/** `totalNutrients` entries are `{label, quantity, unit}`; missing means zero. */
const nutrient = (info, key) => Math.round(Number(info?.totalNutrients?.[key]?.quantity) || 0);

/**
 * Recognises a dish and returns it in the shape the scan route already
 * serves, or `null` when LogMeal has nothing confident to say — the caller
 * treats null as "try the language model", not as an error.
 *
 * @param {Buffer} buffer  the image bytes
 * @param {string} mediaType  its mime type
 * @param {string} lang  the user's app language, mapped to LogMeal's set
 */
export async function recognizeWithLogMeal(buffer, mediaType, lang = "uz") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEADLINE_MS);

  try {
    const form = new FormData();
    form.append("image", new Blob([buffer], { type: mediaType }), "scan.jpg");

    const segmentation = await post(
      `/v2/image/segmentation/complete?language=${langCode(lang)}`,
      { body: form, signal: controller.signal }
    );

    const guess = bestGuess(segmentation);
    if (!guess || (guess.prob ?? 0) < MIN_CONFIDENCE) return null;

    const nutrition = await post("/v2/nutrition/recipe/nutritionalInfo", {
      body: JSON.stringify({ imageId: segmentation.imageId }),
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    // No nutrition for this dish means the recognition is not usable for the
    // one thing the scan exists to do, so hand it to the AI instead.
    if (!nutrition?.hasNutritionalInfo) return null;

    const info = nutrition.nutritional_info || {};
    const kcal = Math.round(Number(info.calories) || 0);
    if (kcal <= 0) return null;

    const grams = Math.round(Number(nutrition.serving_size) || 0);
    const name = Array.isArray(nutrition.foodName) ? nutrition.foodName[0] : nutrition.foodName;

    return {
      name: name || guess.name,
      kcalPerServing: kcal,
      carbs: nutrient(info, "CHOCDF"),
      protein: nutrient(info, "PROCNT"),
      fat: nutrient(info, "FAT"),
      confidence: Math.round((guess.prob ?? 0) * 100),
      servingDescription: grams ? `1 porsiya (~${grams}g)` : "1 porsiya",
      // Measured from a food database rather than estimated, which is the whole
      // point of preferring this provider.
      isApprox: false,
      recognized: true,
      provider: "logmeal",
      // The English name as LogMeal gave it, kept so a failed translation can
      // fall back to something real instead of a blank.
      sourceName: name || guess.name,
    };
  } finally {
    clearTimeout(timer);
  }
}
