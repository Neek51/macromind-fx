/**
 * Shared 3-tier AI fallback chain for all MacroMind FX AI routes.
 *
 * Priority 1: Groq Key 1   → llama-3.3-70b-versatile (fast, primary)
 * Priority 2: Groq Key 2   → llama-3.3-70b-versatile (fast, backup)
 * Priority 3: AgentRouter  → gpt-4o (last resort)
 *
 * All providers use the OpenAI-compatible chat/completions format.
 * Each provider is tried in order — first success wins, failures fall through.
 */

type AIResult = {
  content: string;
  model: string;
  provider: string;
};

type ProviderConfig = {
  name: string;
  key: string | undefined;
  url: string;
  model: string;
};

export function buildProviders(): ProviderConfig[] {
  const agentRouterKey =
    process.env.MACROMIND_OPENAI_KEY ??
    process.env.OPENAI_API_KEY ??
    process.env.AGENTROUTER_API_KEY;

  const groqModel = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  return [
    // 1 — Groq primary key
    {
      name: "Groq (Primary)",
      key: process.env.GROQ_API_KEY,
      url: "https://api.groq.com/openai/v1",
      model: groqModel,
    },
    // 2 — Groq backup key
    {
      name: "Groq (Backup)",
      key: process.env.GROQ_API_KEY_2,
      url: "https://api.groq.com/openai/v1",
      model: groqModel,
    },
    // 3 — Groq Lighter (Bypasses TPD rate limits of 70B model, ultra-fast fallback)
    {
      name: "Groq (Lighter)",
      key: process.env.GROQ_API_KEY,
      url: "https://api.groq.com/openai/v1",
      model: "llama-3.1-8b-instant",
    },
    // 4 — AgentRouter / GitHub Models (Primary fallback - premium & fast)
    {
      name: (process.env.AGENTROUTER_BASE_URL?.includes("github") || process.env.AGENTROUTER_BASE_URL?.includes("inference.ai")) ? "GitHub Models" : "AgentRouter",
      key: agentRouterKey,
      url: process.env.AGENTROUTER_BASE_URL ?? "https://agentrouter.org/v1",
      model: process.env.AGENTROUTER_MODEL ?? "gpt-5.5",
    },
    // 5 — Hugging Face (Public DeepSeek AWS Endpoint - Free & Fast fallback)
    {
      name: "Hugging Face (DeepSeek)",
      key: "sk-hf-public-temp-key",
      url: "https://q5dh1rfszfym23hj.us-east-2.aws.endpoints.huggingface.cloud/v1",
      model: "deepseek-ai/DeepSeek-V4-Flash-0731",
    },
    // 6 — OpenCode Zen (Last resort fallback - DeepSeek free tier)
    {
      name: "OpenCode Zen",
      key: process.env.OPENCODE_ZEN_API_KEY,
      url: "https://opencode.ai/zen/v1",
      model: "deepseek-v4-flash-free",
    },
  ];
}

export function hasAIKey(): boolean {
  return Boolean(
    process.env.GROQ_API_KEY ||
    process.env.GROQ_API_KEY_2 ||
    process.env.AGENTROUTER_API_KEY ||
    process.env.MACROMIND_OPENAI_KEY ||
    process.env.OPENCODE_ZEN_API_KEY
  );
}

export async function callAI(
  prompt: string,
  systemPrompt: string,
): Promise<AIResult | null> {
  const providers = buildProviders();

  for (const provider of providers) {
    if (!provider.key) continue;
    try {
      console.log(
        `[AI] Trying ${provider.name} (${provider.model}) at ${provider.url}/chat/completions`,
      );

      const startTime = Date.now();
      const response = await fetch(`${provider.url}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.key}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AI] ${provider.name} failed: ${response.status} — ${errorText}`);
        continue; // try next provider
      }

      const data = await response.json();
      const endTime = Date.now();
      const elapsed = ((endTime - startTime) / 1000).toFixed(2);

      const content = data.choices?.[0]?.message?.content;
      if (content) {
        console.log(`[AI] ✅ ${provider.name} succeeded in ${elapsed}s`);
        return {
          content,
          model: provider.model,
          provider: provider.name,
        };
      }
    } catch (err) {
      console.error(`[AI] ${provider.name} error:`, err);
      // try next provider
    }
  }

  console.error("[AI] All providers failed or no keys configured");
  return null;
}
