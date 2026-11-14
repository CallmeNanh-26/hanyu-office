# Hướng dẫn tạo dự án Firebase cho game (khoảng 5 phút, miễn phí)

Firebase là dịch vụ của Google, dùng để học viên **đăng nhập** và **tự đồng bộ tiến độ + API Key** giữa điện thoại và máy tính.
Gói miễn phí (Spark) không cần thẻ thanh toán và đủ cho vài nghìn học viên.

Dự án này **tách riêng** với dự án `destination-english` của nền tảng tiếng Anh.

## Bước 1. Tạo dự án
1. Mở <https://console.firebase.google.com> và đăng nhập bằng tài khoản Google của bạn.
2. Bấm **Create a project** (Tạo dự án).
3. Đặt tên, ví dụ `hanyu-office`, rồi bấm **Continue**.
4. Màn hỏi **Google Analytics**: tắt đi (không cần), bấm **Create project**. Đợi khoảng 30 giây, bấm **Continue**.

## Bước 2. Bật đăng nhập
1. Menu bên trái: **Build → Authentication**, bấm **Get started**.
2. Tab **Sign-in method**:
   - Chọn **Email/Password**, bật công tắc đầu tiên (**Enable**), bấm **Save**.
   - Bấm **Add new provider → Google**, bật **Enable**, chọn email hỗ trợ (email của bạn), bấm **Save**.
3. Tab **Settings → Authorized domains**: `localhost` đã có sẵn. Sau này khi đưa game lên mạng, thêm địa chỉ web của game vào đây (ví dụ `ten-ban.github.io`).

## Bước 3. Tạo cơ sở dữ liệu
1. Menu bên trái: **Build → Firestore Database**, bấm **Create database**.
2. **Location**: chọn `asia-southeast1 (Singapore)` (gần Việt Nam). Bấm **Next**.
3. Chọn **Start in production mode**, bấm **Create**.
4. Khi tạo xong, mở tab **Rules**, xoá hết nội dung cũ và dán đoạn sau, rồi bấm **Publish**:

```
rules_version = '2';
// Mỗi học viên chỉ đọc và ghi được dữ liệu của chính mình trong users/{uid của họ}.
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Đoạn này rất quan trọng: nhờ nó, API Key của học viên nào chỉ người đó đọc được.

## Bước 4. Lấy đoạn cấu hình
1. Bấm biểu tượng ⚙️ cạnh **Project Overview** (góc trên bên trái) → **Project settings**.
2. Kéo xuống mục **Your apps**, bấm biểu tượng **`</>`** (Web).
3. Đặt tên ứng dụng, ví dụ `game`. **Không** tích ô Firebase Hosting. Bấm **Register app**.
4. Màn hiện một đoạn code có `const firebaseConfig = { apiKey: ..., authDomain: ..., ... }`.
   Copy **phần trong ngoặc nhọn** `{ ... }` và gửi cho Claude, hoặc tự dán vào file
   `game/prototype/firebase-config.js`, thay chữ `null`:

```js
window.FIREBASE_CONFIG = {
  apiKey: '...',
  authDomain: '...firebaseapp.com',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...',
};
```

> Các giá trị này **không phải mật khẩu**. Chúng nằm công khai trong mã nguồn của mọi trang web dùng Firebase.
> Dữ liệu được bảo vệ bằng đăng nhập và đoạn Rules ở bước 3.

## Kiểm tra
Mở game (`Mo-game.bat` hoặc `node game/tools/serve.js` rồi vào http://localhost:5173/prototype/).
Màn đầu tiên sẽ có ô **Đăng nhập bằng Google** và đăng nhập bằng email. Đăng nhập, học một chút, rồi mở game
trên trình duyệt khác và đăng nhập cùng tài khoản: tiến độ và API Key phải có sẵn.

## Lưu ý khi thử trên điện thoại
Điện thoại không mở được `localhost` của máy tính. Để thử đồng bộ thật giữa điện thoại và máy tính, game cần được đưa lên
một địa chỉ web (ví dụ GitHub Pages, miễn phí) và thêm địa chỉ đó vào **Authorized domains** ở bước 2.
