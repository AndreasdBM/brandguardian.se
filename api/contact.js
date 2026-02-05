export default async function handler(req, res) {
  // Allow preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // Robust body parsing
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

    const { name, email, url, message, company, website } = body;

    // Optional honeypot: if you add <input name="website" style="display:none">
    // real humans will leave it empty, bots often fill it.
    if (website) {
      return res.status(200).json({ ok: true }); // silently accept
    }

    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: "Server missing RESEND_API_KEY" });
    }

    const payload = {
      from: "Brand Guardian <andreas@brandguardian.se>",
      to: ["andreas@brandguardian.se"],
      reply_to: email, // KEY improvement
      subject: `Boka granskning – ${name}`,
      text: `Namn: ${name}
Email: ${email}
Webb: ${url || "-"}
${company ? `Företag: ${company}\n` : ""}Meddelande:
${message}
`,
    };

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(502).json({ ok: false, error: "Resend error", details: data });
    }

    return res.status(200).json({ ok: true, id: data?.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
