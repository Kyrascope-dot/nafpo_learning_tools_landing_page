import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac } from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.NAFPO_SSO_SECRET || "";
const SSO_SECRET = process.env.NAFPO_SSO_SECRET || "";
const EXTERNAL_TOKEN_MAX_AGE = 60 * 60; // 1 hour

function base64urlDecode(str: string): Buffer {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64");
}

function base64urlEncode(data: Buffer): string {
  return data.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function verifySession(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const signature = createHmac("sha256", SESSION_SECRET)
    .update(parts[0] + "." + parts[1])
    .digest();

  const expectedSig = base64urlDecode(parts[2]);
  if (!signature.equals(expectedSig)) return null;

  const payload = JSON.parse(base64urlDecode(parts[1]).toString("utf8"));

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload;
}

function createExternalToken(user: Record<string, unknown>): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64urlEncode(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = base64urlEncode(
    Buffer.from(
      JSON.stringify({
        ...user,
        iat: now,
        exp: now + EXTERNAL_TOKEN_MAX_AGE,
      })
    )
  );
  const signature = base64urlEncode(
    createHmac("sha256", SSO_SECRET).update(header + "." + payload).digest()
  );
  return `${header}.${payload}.${signature}`;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((c) => {
    const [key, ...rest] = c.trim().split("=");
    if (key) cookies[key] = rest.join("=");
  });
  return cookies;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const cookieHeader = req.headers.cookie || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies.nafpo_session;

  if (!token) {
    return res.status(200).json({ user: null, token: null });
  }

  const payload = verifySession(token);
  if (!payload) {
    return res.status(200).json({ user: null, token: null });
  }

  const { iat: _iat, exp: _exp, ...user } = payload;
  const externalToken = createExternalToken(user);
  return res.status(200).json({ user, token: externalToken });
}
