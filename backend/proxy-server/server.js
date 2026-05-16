const http = require("http");
const https = require("https");
const url = require("url");

const PORT = process.env.PORT || 3456;

function proxyRequest(targetUrl, method, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const safeHeaders = {};
    // Only forward safe headers, not host/origin
    for (const [k, v] of Object.entries(headers)) {
      const lk = k.toLowerCase();
      if (lk === "host" || lk === "origin" || lk === "referer") continue;
      safeHeaders[k] = v;
    }
    const options = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: method,
      headers: { ...safeHeaders, host: parsed.hostname },
    };
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks),
        });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;

  // /binance/* -> proxy to api.binance.com or fapi.binance.com
  const match = path.match(/^\/(fapi|api)(\d?)\.binance\.com(\/.*)/);
  if (!match) {
    res.writeHead(404, { "content-type": "application/json" });
    return res.end(JSON.stringify({ error: "Use /api.binance.com/* or /api1.binance.com/* or /fapi.binance.com/*" }));
  }

  const prefix = match[1];
  const mirror = match[2] || "";
  const restPath = match[3];
  const query = parsed.search || "";
  const targetUrl = `https://${prefix}${mirror}.binance.com${restPath}${query}`;

  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", async () => {
    try {
      const result = await proxyRequest(targetUrl, req.method, req.headers, chunks.length ? Buffer.concat(chunks) : null);
      res.writeHead(result.status, { "content-type": result.headers["content-type"] || "application/json" });
      res.end(result.body);
    } catch (err) {
      res.writeHead(502, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Binance proxy running on http://0.0.0.0:${PORT}`);
});
