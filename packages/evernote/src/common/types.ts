export interface EvernoteConfig {
  token: string;
  sandbox: boolean;
}

export interface McpToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
