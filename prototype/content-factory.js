// Chương 2 · 工厂: 跟单与收货 (theo dõi đơn hàng, hối hàng, nhận hàng ở kho nhà máy), chế độ Dễ.
// Dùng từ vựng và mẫu câu của bài 4 (跟单与收货). Chế độ Vừa / Khó để dành cho sau.
// Nút mới: type 'check' = bấm chọn những mục có vấn đề (giấy tờ, kiện hàng), rồi trả lời một câu hỏi (q / options / answer).
// Nút có thể khai báo bg: 'factory' (cảnh kho nhà máy) và place: { zh, py, vi } (tên địa điểm trên đầu màn).
(() => {
const C = window.CONTENT;
const IMG = '../characters/';
const WH = { zh: '仓库', py: 'cāngkù', vi: 'Kho nhà máy 星辰电器' };

Object.assign(C.cast.npcs, {
  wh: { name: '貂师傅', py: 'Diāo shīfu', role: 'Thủ kho nhà máy', img: IMG + 'nhom-2/chon.png', dir: IMG + 'bieu-cam/chon/',
    scene: { style: 'factory' },
    faces: { happy: 'vui-ve', done: 'hoan-thanh', shocked: 'kinh-ngac', doubt: 'nghi-ngo', annoyed: 'de-biu', panic: 'hoang-hot', sly: 'lem-linh' } },
  driver: { name: '费师傅', py: 'Fèi shīfu', role: 'Tài xế xe tải 鑫达', img: IMG + 'nhom-2/ret.png', dir: IMG + 'bieu-cam/ret/',
    scene: { style: 'factory' },
    faces: { happy: 'hoan-thanh', done: 'hoan-thanh', shocked: 'kinh-ngac', doubt: 'nghi-ngo', annoyed: 'de-biu', angry: 'gian-du', sly: 'lem-linh' } },
});

const F = {
  title: '钢板到货了', py: 'gāngbǎn dàohuò le', vi: 'Thép tấm về tới nhà máy',
  init: { rapport: 0 },
  start: 'f1',
  showTerms: () => false,
  tasks: [
    { zh: '跟单', py: 'gēndān', vi: 'Theo dõi', done: s => s.calledSup },
    { zh: '汇报', py: 'huìbào', vi: 'Báo cáo', done: s => s.reported1 },
    { zh: '核对', py: 'héduì', vi: 'Đối chiếu', done: s => s.checkedGoods },
    { zh: '签收', py: 'qiānshōu', vi: 'Ký nhận', done: s => s.signed },
    { zh: '补发', py: 'bǔfā', vi: 'Gửi bù', done: s => s.fixCalled },
    { zh: '汇报', py: 'huìbào', vi: 'Báo cáo', done: s => s.finalDone },
  ],
  card: {
    items: [['订单 · Đơn hàng', '304不锈钢板 · 5吨'], ['供应商 · Nhà cung cấp', '鑫达钢材 · 胡经理'], ['合同交货 · Hạn giao', 'Thứ Sáu tuần này'], ['开始生产 · Sản xuất', 'Thứ Hai tuần sau'], ['单据 · Giấy tờ', '送货单 · 装箱单 · 合格证 · 发票']],
    text: 'Theo dõi đơn hàng, hối hàng nếu có nguy cơ trễ, rồi xuống kho nhà máy nhận hàng: <b>đối chiếu giấy tờ, đếm số lượng, xem hàng hỏng, rồi mới ký nhận</b>. Có vấn đề thì ghi rõ và báo nhà cung cấp.',
  },
  nodes: {},
};
C.factory = { easy: F }; // các nút kịch bản nằm trong content-factory-nodes.js
})();
