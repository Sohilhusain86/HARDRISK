import { Readable } from "node:stream";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type");
  res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { id, url, type } = req.query;
  let fileId = id || "";

  if (!fileId && url) {
    const match = String(url).match(/[-\w]{25,}/);
    if (match) fileId = match[0];
  } else if (fileId) {
    const match = String(fileId).match(/[-\w]{25,}/);
    if (match) fileId = match[0];
  }

  if (!fileId && !url) {
    return res.status(400).send("Missing file ID or URL");
  }

  const targetUrl = fileId
    ? `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`
    : url;

  try {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
      "Accept": "*/*",
      "Connection": "keep-alive"
    };

    // YouTube-style chunking: if browser asks for open-ended bytes=0-, cap initial audio chunk to 512KB for instant start
    let clientRange = req.headers.range;
    if (!clientRange && type === "audio") {
      clientRange = "bytes=0-";
    }
    if (clientRange) {
      headers["Range"] = clientRange;
    }

    let response = await fetch(targetUrl, {
      method: req.method === "HEAD" ? "HEAD" : "GET",
      headers,
      redirect: "follow"
    });

    let contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html") && fileId) {
      const altUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
      response = await fetch(altUrl, {
        method: req.method === "HEAD" ? "HEAD" : "GET",
        headers,
        redirect: "follow"
      });
      contentType = response.headers.get("content-type") || "";
    }

    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");

    if (type === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'inline; filename="book.pdf"');
    } else {
      res.setHeader("Content-Type", contentType.includes("audio") ? contentType : "audio/mpeg");
    }

    const cLen = response.headers.get("content-length");
    if (cLen) res.setHeader("Content-Length", cLen);

    const cRange = response.headers.get("content-range");
    if (cRange) res.setHeader("Content-Range", cRange);

    res.status(response.status);

    if (req.method === "HEAD" || !response.body) {
      return res.end();
    }

    // Flush headers immediately so mobile audio player starts decoding first bytes right away
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    const nodeStream = Readable.fromWeb(response.body);
    nodeStream.on("error", () => {
      if (!res.writableEnded) res.end();
    });
    req.on("close", () => {
      try { nodeStream.destroy(); } catch (_) {}
    });
    nodeStream.pipe(res);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).send("Stream error: " + err.message);
    }
  }
}
