import { createServer, Server } from "node:http";

const TIMEOUT_MS = 120_000;

const SUCCESS_HTML = `<!DOCTYPE html>
<html><body style="font-family:system-ui;text-align:center;padding:60px">
<h1>Authentication successful</h1>
<p>You can close this tab and return to the terminal.</p>
</body></html>`;

const ERROR_HTML = `<!DOCTYPE html>
<html><body style="font-family:system-ui;text-align:center;padding:60px">
<h1>Authentication failed</h1>
<p>An error occurred during authorization. Check the terminal for details.</p>
</body></html>`;

export interface CallbackServer {
  port: number;
  waitForCode(): Promise<string>;
  close(): void;
}

export function startCallbackServer(): Promise<CallbackServer> {
  return new Promise((resolveServer, rejectServer) => {
    let codeResolve: (code: string) => void;
    let codeReject: (err: Error) => void;

    const codePromise = new Promise<string>((resolve, reject) => {
      codeResolve = resolve;
      codeReject = reject;
    });

    // Prevent unhandled rejection warnings — callers handle via waitForCode()
    codePromise.catch(() => {});

    const server: Server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", "http://localhost");

      if (url.pathname !== "/callback") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const error = url.searchParams.get("error");
      if (error) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(ERROR_HTML);
        codeReject(new Error(`Authorization denied: ${error}`));
        return;
      }

      const code = url.searchParams.get("code");
      if (!code) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(ERROR_HTML);
        codeReject(new Error("No authorization code received"));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(SUCCESS_HTML);
      codeResolve(code);
    });

    const timeout = setTimeout(() => {
      server.close();
      codeReject(new Error("Authorization timed out after 120 seconds"));
    }, TIMEOUT_MS);

    server.listen(0, "127.0.0.1", () => {
      const port = (server.address() as { port: number }).port;
      resolveServer({
        port,
        waitForCode: () =>
          codePromise.finally(() => {
            clearTimeout(timeout);
            server.close();
          }),
        close: () => {
          clearTimeout(timeout);
          server.close();
        },
      });
    });

    server.on("error", (err) => {
      clearTimeout(timeout);
      rejectServer(err);
    });
  });
}
