// Minimal local static file server used only to give the headless capture/
// composite browser a real http:// origin for the scene/composite HTML,
// vendor/three.min.js, per-job logo assets, and per-job captured frames.
// A shared origin means canvas readback (screenshot/toDataURL) never hits
// Chromium's cross-origin canvas-taint restriction, which loading images
// via file:// URLs can trigger. Built on Node's own `http` module: no new
// dependency, consistent with this project's stated anti-dependency bias.

const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css', // added 2026-08-07: this server didn't need to serve a linked stylesheet before (scene/composite HTML inlines its own <style>) - Thread 2's real generated page does, and Chromium refuses to apply a stylesheet served without this (strict MIME-type checking), silently rendering the page unstyled instead of erroring loudly
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

// `roots` is an object mapping a URL prefix (e.g. "/frames/") to a
// filesystem directory. A prefix may be omitted (mapped to null) if that
// job has nothing to serve under it (e.g. no logo asset).
function startServer(roots) {
  const entries = Object.entries(roots).filter(([, dir]) => !!dir);

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      const match = entries.find(([prefix]) => urlPath.startsWith(prefix));

      if (!match) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      const [prefix, root] = match;
      const filePath = path.join(root, urlPath.slice(prefix.length));

      // Path traversal guard: resolved path must stay inside its serving root.
      if (!path.resolve(filePath).startsWith(path.resolve(root))) {
        res.writeHead(403);
        res.end('forbidden');
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('not found');
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        port,
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise((res) => server.close(res)),
      });
    });
    server.on('error', reject);
  });
}

module.exports = { startServer };
