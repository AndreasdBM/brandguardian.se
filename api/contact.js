export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { name, email, url, message } = req.body || {};

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: "Server missing RESEND_API_KEY" });
    }

    // IMPORTANT:
    // Use a verified "from" in Resend
    const from = "Brand Guardian <contact@send.brandguardian.se>";
    const to = ["andreas@brandguardian.se"];

    const subject = `Boka granskning – ${name}`;
    const text =
      `Namn: ${name}\n` +
      `E-post: ${email}\n` +
      (url ? `URL: ${url}\n` : "") +
      `\nMeddelande:\n${message}\n`;

    const html = `
      <h2>Boka granskning</h2>
      <p><strong>Namn:</strong> ${escapeHtml(name)}</p>
      <p><strong>E-post:</strong> ${escapeHtml(email)}</p>
      ${url ? `<p><strong>URL:</strong> ${escapeHtml(url)}</p>` : ""}
      <p><strong>Meddelande:</strong></p>
      <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(message)}</pre>
    `;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        html,
        reply_to: email,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(502).json({ ok: false, error: "Resend error", details: errText });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
