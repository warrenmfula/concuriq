// Vercel serverless function.
// This runs on the server, never in the browser, so the API key stays secret.
// Path: /api/agent  (Vercel auto-routes files in /api/ to this path)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { systemPrompt, userPrompt, maxTokens } = req.body || {};

  if (!systemPrompt || !userPrompt) {
    res.status(400).json({ error: "Missing systemPrompt or userPrompt" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY. Set it in Vercel project settings." });
    return;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens || 500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: "Anthropic API error", detail: errText });
      return;
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((c) => c.type === "text");
    res.status(200).json({ text: textBlock ? textBlock.text : "" });
  } catch (err) {
    res.status(500).json({ error: "Request failed", detail: String(err) });
  }
}
