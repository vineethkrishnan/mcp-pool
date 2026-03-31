export interface TransformOptions {
  /** Keys to strip from Stripe responses (internal hashes, redundant metadata) */
  stripKeys: string[];
  /** Whether to convert Unix timestamps to ISO strings */
  convertTimestamps: boolean;
}

export interface McpToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
