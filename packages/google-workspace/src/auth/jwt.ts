import { createSign } from "node:crypto";

export function base64UrlEncode(data: string | Buffer): string {
  const buf = typeof data === "string" ? Buffer.from(data, "utf-8") : data;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export interface JwtClaims {
  iss: string;
  scope: string;
  aud: string;
  iat: number;
  exp: number;
  sub?: string;
}

export function createSignedJwt(claims: JwtClaims, privateKey: string): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(JSON.stringify(claims));
  const signatureInput = `${header}.${payload}`;

  const signer = createSign("RSA-SHA256");
  signer.update(signatureInput);
  const signature = base64UrlEncode(signer.sign(privateKey));

  return `${signatureInput}.${signature}`;
}
