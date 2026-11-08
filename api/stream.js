export default async function handler(req, res) {
  const { id, url } = req.query;
  let targetUrl = url;

  if (id) {
    targetUrl = `https://drive.google.com/uc?export=download&id=${id}&confirm=t`;
  } else if (url && url.includes('drive.google.com')) {
    const match = url.match(/[-\w]{25,}/);
    if (match) {
      targetUrl = `https://drive.google.com/uc?export=download&id=${match[0]}&confirm=t`;
    }
  }

  if (!targetUrl) {
    return res.status(400).send('Missing audio URL or ID');
  }

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    let response = await fetch(targetUrl, { headers, redirect: 'follow' });
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      const matchId = (targetUrl.match(/id=([-\w]{25,})/) || [])[1];
      if (matchId) {
        const directUrl = `https://drive.usercontent.google.com/download?id=${matchId}&export=download&confirm=t`;
        response = await fetch(directUrl, { headers, redirect: 'follow' });
      }
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    if (response.headers.get('content-length')) {
      res.setHeader('Content-Length', response.headers.get('content-length'));
    }
    if (response.headers.get('content-range')) {
      res.setHeader('Content-Range', response.headers.get('content-range'));
    }

    res.status(response.status);
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(500).send('Proxy error: ' + err.message);
  }
}
