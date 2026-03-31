import { GoogleWorkspaceConfig } from "../common/types";

export class GoogleAuthService {
  private accessToken: string;

  constructor(config: GoogleWorkspaceConfig) {
    if (config.accessToken) {
      this.accessToken = config.accessToken;
    } else {
      throw new Error(
        "Google Workspace authentication required. Set GOOGLE_ACCESS_TOKEN environment variable. " +
          "Get a token from https://developers.google.com/oauthplayground/",
      );
    }
  }

  async getAccessToken(): Promise<string> {
    return this.accessToken;
  }
}
