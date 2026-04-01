import { readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { StoredTokens, TokenStore } from "./types";

const BASE_DIR = ".mcp-pool";
const TOKEN_FILE_NAME = "tokens.json";

export function createTokenStore(providerName: string): TokenStore {
  const tokenDir = join(homedir(), BASE_DIR, providerName);
  const tokenPath = join(tokenDir, TOKEN_FILE_NAME);

  return {
    save(tokens: StoredTokens): void {
      mkdirSync(tokenDir, { recursive: true, mode: 0o700 });
      writeFileSync(tokenPath, JSON.stringify(tokens, null, 2), { mode: 0o600 });
    },

    load(): StoredTokens | null {
      try {
        const raw = readFileSync(tokenPath, "utf-8");
        return JSON.parse(raw) as StoredTokens;
      } catch {
        return null;
      }
    },

    clear(): void {
      try {
        unlinkSync(tokenPath);
      } catch {
        // File may not exist
      }
    },

    exists(): boolean {
      return existsSync(tokenPath);
    },
  };
}
