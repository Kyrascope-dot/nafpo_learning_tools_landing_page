import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac } from "crypto";

const SSO_SECRET = process.env.NAFPO_SSO_SECRET || "";
const SESSION_SECRET = process.env.SESSION_SECRET || SSO_SECRET;
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function base64urlDecode(str: string): Buffer {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64");
}

function verifyJwt(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const signature = createHmac("sha256", SSO_SECRET)
    .update(parts[0] + "." + parts[1])
    .digest();

  const expectedSig = base64urlDecode(parts[2]);
  if (!signature.equals(expectedSig)) return null;

  const payload = JSON.parse(base64urlDecode(parts[1]).toString("utf8"));

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload;
}

function base64urlEncode(data: Buffer): string {
  return data.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function createSessionToken(user: Record<string, unknown>): string {
  const header = base64urlEncode(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = base64urlEncode(
    Buffer.from(
      JSON.stringify({
        ...user,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
      })
    )
  );
  const signature = base64urlEncode(
    createHmac("sha256", SESSION_SECRET).update(header + "." + payload).digest()
  );
  return `${header}.${payload}.${signature}`;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.query.token as string | undefined;
  const redirect = (req.query.redirect as string) || "/";

  if (!token) {
    return res.status(400).json({ error: "Missing token" });
  }

  if (!SSO_SECRET) {
    return res.status(500).json({ error: "SSO not configured" });
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const { iat: _iat, exp: _exp, ...userData } = payload;

  const sessionToken = createSessionToken(userData);

  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = [
    `nafpo_session=${sessionToken}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${SESSION_MAX_AGE}`,
    ...(isProduction ? ["Secure"] : []),
  ].join("; ");

  res.setHeader("Set-Cookie", cookieOptions);

  const safePath = redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/";
  res.redirect(302, safePath);
}
