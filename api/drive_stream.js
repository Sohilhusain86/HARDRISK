const https = require('https');

function streamFromUrl(targetUrl, rangeHeader, res, redirectsLeft = 5) {
  if (redirectsLeft <= 0) {
    res.statusCode = 502;
    return res.end('Too many redirects');
  }
  const headers = { 'User-Agent': 'Mozilla/5.0' };
  if (rangeHeader) headers['Range'] = rangeHeader;

  https.get(targetUrl, { headers }, (upRes) => {
    if ([301, 302, 303, 307, 308].includes(upRes.statusCode) && upRes.headers.location) {
      upRes.resume();
      return streamFromUrl(upRes.headers.location, rangeHeader, res, redirectsLeft - 1);
    }

    res.statusCode = upRes.statusCode || 200;
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (upRes.headers['content-type']) res.setHeader('Content-Type', upRes.headers['content-type']);
    if (upRes.headers['content-length']) res.setHeader('Content-Length', upRes.headers['content-length']);
    if (upRes.headers['content-range']) res.setHeader('Content-Range', upRes.headers['content-range']);

    upRes.pipe(res);
  }).on('error', (err) => {
    res.statusCode = 500;
    res.end(err.message);
  });
}

module.exports = (req, res) => {
  const fileId = req.query.id;
  if (!fileId) {
    res.statusCode = 400;
    return res.end('Missing file id');
  }
  const driveUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`;
  streamFromUrl(driveUrl, req.headers.range, res);
};
