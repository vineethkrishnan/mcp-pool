import { StaticTokenStrategy } from "./static-token.strategy";

describe("StaticTokenStrategy", () => {
  it("returns the token passed to constructor", async () => {
    const strategy = new StaticTokenStrategy("test-token-123");
    expect(await strategy.getAccessToken()).toBe("test-token-123");
  });

  it("returns same token on repeated calls", async () => {
    const strategy = new StaticTokenStrategy("my-token");
    expect(await strategy.getAccessToken()).toBe("my-token");
    expect(await strategy.getAccessToken()).toBe("my-token");
  });
});
