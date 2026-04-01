import { TokenProvider } from "../types";

export class StaticTokenStrategy implements TokenProvider {
  constructor(private readonly accessToken: string) {}

  async getAccessToken(): Promise<string> {
    return this.accessToken;
  }
}
