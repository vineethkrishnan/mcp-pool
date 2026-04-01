export interface TokenProvider {
  getAccessToken(): Promise<string>;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
}

export interface StoredTokens {
  refreshToken: string;
  accessToken: string;
  expiresAt: number;
  clientId: string;
  clientSecret: string;
}

export interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

export interface EnvVarNames {
  staticToken: string;
  clientId: string;
  clientSecret: string;
}

export interface OAuthProviderConfig {
  name: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  envVars: EnvVarNames;
  authUrlParams?: Record<string, string>;
  tokenRequestAuth?: "body" | "basic";
}

export interface AuthProvider extends TokenProvider {
  handleCli(args: string[]): Promise<void>;
}

export interface TokenStore {
  save(tokens: StoredTokens): void;
  load(): StoredTokens | null;
  clear(): void;
  exists(): boolean;
}
