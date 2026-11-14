// Cấu hình Firebase để học viên đăng nhập và đồng bộ tiến độ + API Key giữa điện thoại và máy tính.
// Lấy ở: Firebase console → ⚙️ Project settings → Your apps → (biểu tượng </>) → SDK setup and configuration → Config.
// Các giá trị này là định danh công khai, không phải mật khẩu: dữ liệu được bảo vệ bằng đăng nhập + Firestore Rules
// (xem HUONG-DAN-FIREBASE.md). Để null thì game chạy không có tài khoản, dữ liệu chỉ nằm trên trình duyệt này.
window.FIREBASE_CONFIG = {
  apiKey: 'AIzaSyACVU79nAAagLNGiAUSPG6JkT4DAwL4TMA',
  authDomain: 'chinese30-nanh.firebaseapp.com',
  projectId: 'chinese30-nanh',
  storageBucket: 'chinese30-nanh.firebasestorage.app',
  messagingSenderId: '379715692139',
  appId: '1:379715692139:web:89197ff951fdfcbd43b32e',
};
