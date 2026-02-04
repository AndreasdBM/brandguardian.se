export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { name, email, url, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: "Server missing RESEND_API_KEY" });
    }

    const payload = {
      from: "Brand Guardian <onboarding@resend.dev>",
      to: ["andreas@brandguardian.se"],
      subject: `Boka granskning – ${name}`,
      text: `
Namn: ${name}
Email: ${email}
Webb: ${url || "-"}
Meddelande:
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

    const data = await r.json();

    if (!r.ok) {
      return res.status(502).json({ ok: false, error: "Resend error", details: data });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
