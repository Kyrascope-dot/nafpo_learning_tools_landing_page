import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader(
    "Set-Cookie",
    "nafpo_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
  );
  res.redirect(302, "https://academy.nafpo.in/");
}
