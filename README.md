# Game học tiếng Trung công sở: bản chạy thử

## Chạy trên máy

```bash
node game/tools/serve.js
```

Mở http://localhost:5173/prototype/ bằng Edge hoặc Chrome (cần một trong hai trình duyệt này để có giọng đọc tiếng Trung).

- Lần đầu vào game cần nhập **API Key Gemini miễn phí** (lấy ở https://aistudio.google.com/apikey). Muốn thử mà không có key: thêm `?mockai` vào địa chỉ để dùng bộ chấm giả lập.
- Thêm `?dev` vào cuối địa chỉ để mở khoá mọi chặng khi kiểm tra: http://localhost:5173/prototype/?dev
- Tiến độ chỉ lưu trên trình duyệt đang dùng. Ở trang trung tâm có nút "Xoá tiến độ".

## Cấu trúc

| Thư mục / file | Nội dung |
|---|---|
| `prototype/content.js` | Bài học và bài đánh giá. Giáo viên sửa file này |
| `prototype/content-mission.js` | Dàn nhân vật và kịch bản nhiệm vụ (có rẽ nhánh) |
| `prototype/cloud.js`, `prototype/firebase-config.js` | Đăng nhập và đồng bộ tiến độ + API Key giữa các máy (Firebase, xem `HUONG-DAN-FIREBASE.md`) |
| `prototype/ai.js` | Kết nối Gemini bằng key của học viên, chấm bài chế độ Vừa |
| `prototype/art.js` | Bản đồ khu công ty và nền các cảnh hội thoại (vẽ bằng SVG) |
| `prototype/app.js` | Luồng chơi: đào tạo → đánh giá → nhiệm vụ |
| `prototype/style.css` | Giao diện |
| `prototype/screenshots/` | Ảnh chụp các màn hình |
| `characters/` | Nhân vật đã tách nền (PNG trong suốt) |
| `gamesource art/` | Ảnh gốc của nhân vật |
| `tools/crop-characters.js` | Cắt nhân vật từ ảnh lưới (`npm install sharp` trước) |
| `tools/screenshots.js` | Chơi tự động 3 nhánh và chụp ảnh (`npm install puppeteer-core` trước) |
| `tools/serve.js` | Máy chủ chạy thử |

## Nhân vật trong ải thu mua

- Người chơi: tự chọn 1 trong 13 con (12 con giáp và thỏ)
- Hướng dẫn viên: tự chọn (mèo 苗老师, thỏ 兔老师, chó 汪老师, chuột 舒老师, dê 杨老师)
- 牛经理 (trâu): trưởng phòng thu mua. Nếu người chơi chọn trâu thì sếp là 虎经理 (hổ)
- 鄂经理 (cá sấu), 胡经理 (cáo), 鲍经理 (báo): ba nhà cung cấp

Chi tiết đầy đủ xem `TOM-TAT-DU-AN.md`.
