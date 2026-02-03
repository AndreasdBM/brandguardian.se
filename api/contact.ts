export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { name, email, message, url } = await req.json();

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Brand Guardian <onboarding@resend.dev>",
      to: ["andreas@brandguardian.se"],
      subject: `Boka granskning – ${name}`,
      text: `${email}\n${url || ""}\n\n${message}`,
    }),
  });

  return new Response(JSON.stringify({ ok: resp.ok }), {
    headers: { "Content-Type": "application/json" },
  });
}
