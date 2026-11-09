export default async function handler(req, res) {
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
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    };
    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    let response = await fetch(targetUrl, { headers, redirect: "follow" });
    let contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/html") && fileId) {
      const altUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
      response = await fetch(altUrl, { headers, redirect: "follow" });
      contentType = response.headers.get("content-type") || "";
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type");
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
    res.setHeader("Accept-Ranges", "bytes");

    if (type === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'inline; filename="book.pdf"');
    } else {
      res.setHeader("Content-Type", contentType.includes("audio") ? contentType : "audio/mpeg");
    }

    if (response.headers.get("content-length")) {
      res.setHeader("Content-Length", response.headers.get("content-length"));
    }
    if (response.headers.get("content-range")) {
      res.setHeader("Content-Range", response.headers.get("content-range"));
    }

    res.status(response.status);
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(500).send("Stream error: " + err.message);
  }
}
