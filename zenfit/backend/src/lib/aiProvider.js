/**
 * Model transport. One call shape, two providers.
 *
 * Whichever key is present is the one that gets used, so the app can run on a
 * Gemini key alone, an Anthropic key alone, or both — set `AI_PROVIDER` to pin
 * it when both are configured. Nothing above this module knows which one
 * answered; the feature code in aiFeatures.js writes prompts once.
 *
 * Messages use the Anthropic shape (a string, or blocks of
 * `{type:"text"}` / `{type:"image", source:{media_type, data}}`) because it is
 * the more explicit of the two; the Gemini adapter translates it.
 */

/** Keys copied straight out of .env.example must not count as configured. */
const PLACEHOLDER = /^(sk-ant-your-key|your-|<|change-this|AIza-your)/i;
const configured = (v) => Boolean(v && !PLACEHOLDER.test(String(v).trim()));

const anthropicKey = () => process.env.ANTHROPIC_API_KEY;
const geminiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

/** Returns "anthropic", "gemini" or null when nothing usable is configured. */
export function activeProvider() {
  const forced = String(process.env.AI_PROVIDER || "").trim().toLowerCase();
  const hasAnthropic = configured(anthropicKey());
  const hasGemini = configured(geminiKey());

  // An explicit choice is honoured even if the other key is also present, but
  // it never invents a key that was not set.
  if (forced === "anthropic") return hasAnthropic ? "anthropic" : null;
  if (forced === "gemini" || forced === "google") return hasGemini ? "gemini" : null;

  if (hasAnthropic) return "anthropic";
  if (hasGemini) return "gemini";
  return null;
}

export const aiConfigured = () => activeProvider() !== null;

function noKeyError() {
  const err = new Error(
    "AI kaliti sozlanmagan. Backend .env fayliga ANTHROPIC_API_KEY yoki GEMINI_API_KEY qo'shing."
  );
  err.code = "NO_API_KEY";
  return err;
}

function providerError(provider, status, text) {
  const err = new Error(`${provider} API xatosi (${status}): ${String(text).slice(0, 400)}`);
  err.code = "AI_PROVIDER_ERROR";
  err.provider = provider;
  err.status = status;
  return err;
}

/* ----------------------------- Anthropic ------------------------------ */

async function callAnthropic(messages, { maxTokens, system }) {
  const body = { model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5", max_tokens: maxTokens, messages };
  if (system) body.system = system;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": anthropicKey(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw providerError("Anthropic", res.status, await res.text());

  const data = await res.json();
  return (data.content || []).find((b) => b.type === "text")?.text || "";
}

/* ------------------------------- Gemini ------------------------------- */

function toGeminiParts(content) {
  if (typeof content === "string") return [{ text: content }];
  return (content || [])
    .map((block) => {
      if (block.type === "text") return { text: block.text };
      if (block.type === "image") {
        return { inline_data: { mime_type: block.source.media_type, data: block.source.data } };
      }
      return null;
    })
    .filter(Boolean);
}

async function callGemini(messages, { maxTokens, system, json }) {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const generationConfig = { maxOutputTokens: maxTokens };
  // Gemini can be told to emit JSON directly, which is stricter than parsing it
  // back out of prose. Only the structured features ask for it — trainer chat
  // replies are meant to be plain text.
  if (json) generationConfig.responseMimeType = "application/json";
  // 2.5 models think before answering and those tokens come out of the same
  // budget, so a 400-token cap could be spent entirely on hidden reasoning and
  // return nothing. These are extraction tasks, not puzzles — turn it off.
  if (/flash/i.test(model)) generationConfig.thinkingConfig = { thinkingBudget: 0 };

  const body = {
    contents: messages.map((m) => ({
      // Gemini names the assistant turn "model".
      role: m.role === "assistant" ? "model" : "user",
      parts: toGeminiParts(m.content),
    })),
    generationConfig,
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": geminiKey() },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw providerError("Gemini", res.status, await res.text());

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts || []).map((p) => p.text).filter(Boolean).join("");

  if (!text) {
    // A blocked prompt and an exhausted token budget both arrive as an empty
    // candidate, so say which one it was rather than "AI did not answer".
    const reason = candidate?.finishReason || data.promptFeedback?.blockReason || "EMPTY";
    throw providerError("Gemini", 200, `bo'sh javob (${reason})`);
  }
  return text;
}

/* -------------------------------- entry ------------------------------- */

/**
 * @param {Array} messages Anthropic-shaped conversation turns.
 * @param {{maxTokens?:number, system?:string, json?:boolean}} options
 *        `json` asks the provider for machine-readable output where it supports it.
 */
export async function callModel(messages, { maxTokens = 500, system, json = false } = {}) {
  const provider = activeProvider();
  if (!provider) throw noKeyError();

  return provider === "anthropic"
    ? callAnthropic(messages, { maxTokens, system })
    : callGemini(messages, { maxTokens, system, json });
}
