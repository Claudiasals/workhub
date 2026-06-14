/**
 * Thin OpenAI-compatible client. API keys stay server-side only.
 */

export const isAiConfigured = () =>
  Boolean(process.env.AI_API_KEY || process.env.OPENAI_API_KEY);

const getConfig = () => ({
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
  baseUrl: (process.env.AI_API_BASE_URL || "https://api.openai.com/v1").replace(
    /\/$/,
    ""
  ),
  model: process.env.AI_MODEL || "gpt-4o-mini",
});

/**
 * Calls the LLM and expects a JSON object in the response.
 * Returns null when AI is not configured or the request fails.
 */
export async function callLlmJson({ systemPrompt, userPrompt }) {
  const { apiKey, baseUrl, model } = getConfig();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[AI] LLM request failed:", response.status, errText);
      return null;
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content);
  } catch (error) {
    console.error("[AI] LLM error:", error.message);
    return null;
  }
}

export function withSource(result, source) {
  return {
    ...result,
    source,
    generatedAt: new Date().toISOString(),
  };
}
