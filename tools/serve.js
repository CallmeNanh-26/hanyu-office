// Máy chủ tĩnh tối giản để chạy thử game trên máy: node tools/serve.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 5173;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.mp3': 'audio/mpeg' };

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') { res.writeHead(302, { Location: '/prototype/' }); return res.end(); }
  if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).on('error', e => {
  if (e.code === 'EADDRINUSE') console.log(`Cổng ${PORT} đang bị chương trình khác dùng (có thể là game đã mở sẵn, hoặc web học tiếng Anh Destination).
Nếu game đã mở sẵn thì chỉ cần vào http://localhost:${PORT}/prototype/ . Nếu không, tắt chương trình kia rồi mở lại.`);
  else console.log('Lỗi:', e.message);
  process.exitCode = 1;
}).listen(PORT, () => console.log(`Game đang chạy: http://localhost:${PORT}/prototype/
Giữ cửa sổ này mở trong lúc học. Đóng cửa sổ là tắt game.`));
