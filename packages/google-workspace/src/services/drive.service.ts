import { GoogleAuthService } from "./auth.service";
import { DriveFile } from "../common/types";
import { simplifyDriveFile } from "../common/utils";

export class DriveService {
  private baseUrl = "https://www.googleapis.com/drive/v3";

  constructor(private auth: GoogleAuthService) {}

  private async request<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const token = await this.auth.getAccessToken();
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      switch (response.status) {
        case 401:
          throw new Error("Drive authentication failed. Your access token may be expired.");
        case 403:
          throw new Error("Drive access denied. Token may lack the drive.readonly scope.");
        case 404:
          throw new Error("Drive resource not found. Check the file ID.");
        case 429:
          throw new Error("Drive API rate limit exceeded. Try again later.");
        default:
          throw new Error(
            `Drive API error (${response.status}): ${errorBody || response.statusText}`,
          );
      }
    }

    return response.json() as Promise<T>;
  }

  async listFiles(query?: string, maxResults: number = 10): Promise<unknown> {
    const params: Record<string, string | number> = {
      pageSize: maxResults,
      fields: "files(id,name,mimeType,modifiedTime,size,webViewLink,owners)",
    };
    if (query) params.q = query;

    const data = await this.request<{
      files?: DriveFile[];
    }>("/files", params);

    return {
      files: (data.files ?? []).map(simplifyDriveFile),
    };
  }

  async getFile(fileId: string): Promise<unknown> {
    const file = await this.request<DriveFile>(`/files/${fileId}`, {
      fields:
        "id,name,mimeType,modifiedTime,size,webViewLink,owners,description,createdTime,parents,shared,permissions",
    });

    return simplifyDriveFile(file);
  }

  async searchFiles(query: string, maxResults: number = 10): Promise<unknown> {
    return this.listFiles(query, maxResults);
  }
}
