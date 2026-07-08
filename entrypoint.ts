import type { IncomingMessage, ServerResponse } from "http";

const next = require("next");
const http = require("http");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, conf: { port } });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.method === "GET" && req.url === "/api/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "healthy", timestamp: new Date().toISOString() }));
      return;
    }
    handle(req, res);
  });

  server.on("error", (err: Error) => {
    console.error("Server error:", err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port} (Next.js ${dev ? "dev" : "production"})`);
  });
});
