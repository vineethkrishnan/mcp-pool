import { startCallbackServer, CallbackServer } from "./oauth-callback-server";

describe("OAuth Callback Server", () => {
  let server: CallbackServer;

  afterEach(() => {
    server?.close();
  });

  it("starts on a random port", async () => {
    server = await startCallbackServer();
    expect(server.port).toBeGreaterThan(0);
  });

  it("resolves with auth code on successful callback", async () => {
    server = await startCallbackServer();
    const codePromise = server.waitForCode();

    const res = await fetch(`http://127.0.0.1:${server.port}/callback?code=test-auth-code`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Authentication successful");

    expect(await codePromise).toBe("test-auth-code");
  });

  it("rejects when user denies authorization", async () => {
    server = await startCallbackServer();
    const codePromise = server.waitForCode().catch((err: Error) => err);

    await fetch(`http://127.0.0.1:${server.port}/callback?error=access_denied`);

    const result = await codePromise;
    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toBe("Authorization denied: access_denied");
  });

  it("rejects when no code parameter is present", async () => {
    server = await startCallbackServer();
    const codePromise = server.waitForCode().catch((err: Error) => err);

    const res = await fetch(`http://127.0.0.1:${server.port}/callback`);
    expect(res.status).toBe(400);

    const result = await codePromise;
    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toBe("No authorization code received");
  });

  it("returns 404 for non-callback paths", async () => {
    server = await startCallbackServer();
    const res = await fetch(`http://127.0.0.1:${server.port}/other`);
    expect(res.status).toBe(404);
  });
});
