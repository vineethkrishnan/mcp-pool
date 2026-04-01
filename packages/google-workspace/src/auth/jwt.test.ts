import { generateKeyPairSync, createVerify } from "node:crypto";
import { base64UrlEncode, createSignedJwt, JwtClaims } from "./jwt";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf-8");
}

describe("base64UrlEncode", () => {
  it("encodes a string without padding or unsafe characters", () => {
    const result = base64UrlEncode("hello world");
    expect(result).not.toContain("+");
    expect(result).not.toContain("/");
    expect(result).not.toContain("=");
  });

  it("encodes a Buffer", () => {
    const result = base64UrlEncode(Buffer.from([0xff, 0xfe, 0xfd]));
    expect(result).not.toContain("+");
    expect(result).not.toContain("/");
    expect(result).not.toContain("=");
  });

  it("round-trips correctly", () => {
    const original = '{"alg":"RS256","typ":"JWT"}';
    const encoded = base64UrlEncode(original);
    expect(base64UrlDecode(encoded)).toBe(original);
  });
});

describe("createSignedJwt", () => {
  const baseClaims: JwtClaims = {
    iss: "test@example.iam.gserviceaccount.com",
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: 1700000000,
    exp: 1700003600,
  };

  it("produces a three-part JWT string", () => {
    const jwt = createSignedJwt(baseClaims, privateKey);
    const parts = jwt.split(".");
    expect(parts).toHaveLength(3);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it("header decodes to RS256 JWT", () => {
    const jwt = createSignedJwt(baseClaims, privateKey);
    const header = JSON.parse(base64UrlDecode(jwt.split(".")[0]));
    expect(header).toEqual({ alg: "RS256", typ: "JWT" });
  });

  it("payload includes all required claims", () => {
    const jwt = createSignedJwt(baseClaims, privateKey);
    const payload = JSON.parse(base64UrlDecode(jwt.split(".")[1]));
    expect(payload.iss).toBe(baseClaims.iss);
    expect(payload.scope).toBe(baseClaims.scope);
    expect(payload.aud).toBe(baseClaims.aud);
    expect(payload.iat).toBe(baseClaims.iat);
    expect(payload.exp).toBe(baseClaims.exp);
  });

  it("includes sub claim when provided", () => {
    const claims = { ...baseClaims, sub: "user@example.com" };
    const jwt = createSignedJwt(claims, privateKey);
    const payload = JSON.parse(base64UrlDecode(jwt.split(".")[1]));
    expect(payload.sub).toBe("user@example.com");
  });

  it("omits sub claim when not provided", () => {
    const jwt = createSignedJwt(baseClaims, privateKey);
    const payload = JSON.parse(base64UrlDecode(jwt.split(".")[1]));
    expect(payload.sub).toBeUndefined();
  });

  it("produces a valid RS256 signature", () => {
    const jwt = createSignedJwt(baseClaims, privateKey);
    const [headerB64, payloadB64, signatureB64] = jwt.split(".");
    const signatureInput = `${headerB64}.${payloadB64}`;

    const sig = Buffer.from(
      signatureB64.replace(/-/g, "+").replace(/_/g, "/") +
        "=".repeat((4 - (signatureB64.length % 4)) % 4),
      "base64",
    );

    const verifier = createVerify("RSA-SHA256");
    verifier.update(signatureInput);
    expect(verifier.verify(publicKey, sig)).toBe(true);
  });
});
