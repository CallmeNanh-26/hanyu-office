# Tóm tắt dự án: Game học tiếng Trung công sở

*Cập nhật: 14/11/2026 (bản 6). File này dùng để bàn giao giữa các phiên làm việc. Phiên mới nên đọc file này trước.*

---

## 1. Ý tưởng và quy trình game

Học viên đăng nhập → **nhập API Key Gemini của mình** (bắt buộc, có hướng dẫn từng bước) → **chọn nhân vật và hướng dẫn viên** → học **lớp đào tạo 汉语培训** (từ vựng, ngữ pháp, nghiệp vụ theo chủ điểm) → làm **bài đánh giá năng lực** → đạt mới được **đóng vai nhân viên công ty** giải quyết nhiệm vụ bằng tiếng Trung. Suốt quá trình có **hướng dẫn viên** gợi ý vượt ải.

**Tầm nhìn giao diện:** toàn bộ game là một **bản đồ dạng sơ đồ isometric** (nhìn chéo từ trên xuống) theo phong cách dễ thương. Hiện mới có khu công ty; về sau mở rộng thành **cả một thành phố**: nhiều toà nhà, trung tâm thương mại, nhà máy…, mỗi nơi là một ải. Tham khảo: các ảnh isometric người dùng gửi ngày 13/11 và `gamesource art/Phong cách văn phòng tham khảo.png` (văn phòng cắt mở như nhà búp bê).

**Mỗi ải có 3 chế độ, phải qua cả ba mới xong ải:**

| Chế độ | Cách trả lời | Trợ giúp | Trạng thái |
|---|---|---|---|
| 易 Dễ | Chọn đáp án trắc nghiệm | Có hướng dẫn, gợi ý miễn phí | **Đã làm** cho ải thu mua |
| 中 Vừa | Tự gõ hoặc ghi âm | Gợi ý mẫu câu + từ vựng (miễn phí), câu mẫu (2 🪙) | **Đã làm**, tình huống riêng: 采购温控器 (mở sau khi qua Dễ) |
| 难 Khó | Tình huống éo le, phải tư duy giải quyết | Mục tiêu bị ẩn; 💡 gợi ý 2 🪙, 💬 câu mẫu 4 🪙 | **Đã làm**, tình huống riêng: 供应商危机 (mở sau khi qua Vừa) |

**Lộ trình (người dùng chốt 14/11):** qua chế độ **Dễ** ở 采购部 là mở **🏭 工厂** (chương 2, hiện là trang "đang xây dựng"). Chế độ **Vừa và Khó của 采购部 tạm khoá** ("🔒 Chương sau"), để dành cho diễn biến sau khi học viên đủ vốn từ; vẫn chơi được bằng `?dev`. Biến `midOpen` / `hardOpen` trong `SCREENS.hub` của `app.js`.

**Giá gợi ý (14/11):** mỗi lần dùng 💡 gợi ý hoặc 💬 câu mẫu trong nhiệm vụ tốn **20 🪙 (Dễ), 70 🪙 (Vừa), 120 🪙 (Khó)** (`HINT_COST`). Phần thưởng tăng theo: mỗi ngày 20, qua bài đánh giá 100, luyện tập cấp n được 40n+20, nhiệm vụ = điểm + 50 × số sao (×2 ở Vừa, ×3 ở Khó; chơi lại được 1/3).

**Viết email trên máy tính (14/11):** bước 确认 là một **màn hình máy tính**: màn hình nền có các ứng dụng (邮箱, 文件, 计算器, 浏览器, 表格) → mở **📧 邮箱** (giao diện kiểu Gmail: 收件箱 có thư cũ, nút ✏️ 写邮件) → cửa sổ thư mới: 发件人, chọn **收件人** trong danh bạ (chọn sai người -5 điểm), **主题**, **正文** → **发送**. Dễ: vòng tròn cam nhấp nháy chỉ chỗ cần bấm từng bước, chọn tiêu đề có sẵn, điền số vào mẫu thư. Vừa: tự gõ tiêu đề và nội dung, có khung 💡 gợi ý các câu khung và các con số cần ghi. Khó: tự gõ, không gợi ý. Game kiểm tra tiêu đề có chữ khoá (`subjectKeys`) và nội dung có đủ các con số. Dữ liệu thư (danh bạ, tiêu đề, hộp thư đến, câu khung) khai báo ở nút `email` của mỗi kịch bản.

**Bài học mở rộng (14/11):** bài 3 có **bảng kiểm tra theo 6 giai đoạn** (nhận nhiệm vụ → hỏi giá, so sánh → đàm phán → trước khi ký hợp đồng → trước khi giao hàng → khi hàng tới), mục ⚠️ là chỗ phải kiểm tra kỹ, học viên tích được từng ô (lưu trong `S.checks`). Thêm **bài 4 · 跟单与收货** (hối hàng, hỏi tiến độ, giấy tờ khi nhận hàng: 送货单, 装箱单, 发票, 合格证…): 15 từ, 5 mẫu câu, bảng kiểm tra giấy tờ, bài luyện tập; **mở sau khi xong nhiệm vụ 采购部** (`after: 'mission'`), không bắt buộc cho bài đánh giá.

**Từ vượt phạm vi bài (14/11):** từ đánh dấu `+` ở cuối dòng trong `glossary.js` (và không thuộc từ vựng bài học nào) được **ghi chú ngay dưới câu** có nó (📌 chữ · pinyin · nghĩa). Thêm từ khó mới vào kịch bản thì nhớ thêm vào glossary với dấu +.

**Nguyên tắc (người dùng yêu cầu 13/11):** ba chế độ là **ba tình huống khác nhau, không lặp lại**, càng lên càng phong phú.

**Trò chơi thao tác** (chưa làm, cũng chia 3 cấp): viết mail trên máy tính, gửi mail, làm bảng báo giá. Dễ = cầm tay chỉ việc (có thể gộp vào phần luyện tập), Vừa = có gợi ý và được hỏi bằng điểm tích luỹ, Khó = nhiệm vụ khó hơn, chỉ có gợi ý khi dùng điểm.

## 2. Các quyết định đã chốt

| Mảng | Quyết định |
|---|---|
| Chi phí | Miễn phí ở giai đoạn đầu: web tĩnh, không dùng API trả phí |
| Chấm câu tự gõ / ghi âm (Vừa, Khó) | **Google Gemini, dùng API Key miễn phí của chính học viên** (người dùng chốt ngày 13/11), nên **không cần máy chủ riêng**: trình duyệt gọi thẳng tới Google. Key lưu trong localStorage của máy học viên. Lấy key ở aistudio.google.com/apikey, không cần thẻ thanh toán. Gói miễn phí giới hạn số lượt mỗi phút/ngày |
| Điểm tích luỹ 🪙 | **Tặng 1 điểm mỗi ngày** khi vào game, và **làm nhiệm vụ để kiếm thêm**. Dùng để đổi gợi ý ở chế độ Vừa và Khó |
| Vai chính | Người chơi **tự chọn trong 12 con giáp** (kiểu Việt Nam, có mèo) **cộng thêm thỏ**. Con chưa có đủ biểu cảm thì đứng một dáng |
| Hướng dẫn viên | Người chơi **tự chọn**. Hiện có mèo 苗老师, thỏ 兔老师, chó 汪老师, chuột 舒老师, dê 杨老师 (những con đã có hình). Ý định ban đầu là gấu trúc, cáo, cú mèo, chim cánh cụt nhưng chưa có hình |
| Pinyin | **Mọi bài tập đều có pinyin** và nút bật tắt 拼音 ở góc trên |
| Kịch bản | Lựa chọn khác nhau dẫn tới tình huống khác nhau. Không chỉ đàm phán với một bên: có báo cáo sếp, xin ý kiến sếp, nhờ sếp ra mặt |
| Giọng đọc | Web Speech API của trình duyệt (zh-CN). Về sau tạo sẵn mp3 bằng `edge-tts` |
| Lưu tiến độ | localStorage (khoá `hanyu-office-v2`). Về sau dùng Supabase gói miễn phí |
| Hình ảnh | Động vật pastel dễ thương mặc vest. Ảnh do người dùng tạo bằng **Gemini** (cần xem điều khoản nếu dùng thương mại). Giao diện theo ảnh `gamesource art/Phong cách hiển thị game tham khảo.png` |
| Phát hành | **Chưa đưa lên web.** Người dùng muốn xem bản chạy trên máy trước |

## 3. Những gì đã làm

### 3.1 Nhân vật
- **Bộ dáng đứng** (PNG nền trong suốt): `characters/nhom-12-con-giap/` (12 con), `characters/nhom-2/` (12 con "sắc sảo"), `characters/tho-bieu-cam/` (thỏ, 6 biểu cảm).
- **Bộ biểu cảm** `characters/bieu-cam/<con-vật>/<biểu-cảm>.png`: **135 hình của 19 con vật**.
  - 8 biểu cảm (`vui-ve hoan-thanh hoang-hot kinh-ngac nghi-ngo kho-chiu so-hai buon-ba`): `de`, `ngua` (thêm ngày 13/11, có nét *sợ hãi* và *buồn bã*)
  - 8 biểu cảm (`vui-ve hoan-thanh hoang-hot kinh-ngac nghi-ngo de-biu kho-chiu kho-hieu`): `ga`, `cho`, `meo`
  - 7 biểu cảm: `cao` (+`gian-xao`), `ran` (+`muu-meo`), `chon` (+`lem-linh`)
  - 12 biểu cảm: `chuot`. 8 biểu cảm: `ran-ho-mang`
  - 6 biểu cảm (`hoan-thanh kinh-ngac nghi-ngo de-biu lem-linh gian-du`): `soi`, `qua`, `khung-long`, `ca-sau`, `ret`, `nhim`, `bao`
  - `trau`: `gian-du hoan-thanh nghi-ngo de-biu ap-luc duyet`. `ho`: `vui-ve hoang-hot hoang-hot-2 kinh-ngac kinh-ngac-2 gian-du`
- **Con giáp chưa có bộ biểu cảm:** rồng, khỉ, lợn. Trâu và hổ mới có một phần.
- Ảnh tổng hợp để xem nhanh: `characters/tong-hop.png` (tất cả), `characters/tong-hop-bieu-cam.png`.
- Script cắt có thêm `exact` (cắt đúng vị trí) và `steps` (đường cắt gãy khúc khi đồ vật của hai hình chồng nhau), dùng cho hàng dê.
- Lỗi nhỏ trong ảnh cắt: `chuot/kinh-ngac` có vệt nhoè và `bao/nghi-ngo` bị màu cam như hổ (đều do ảnh gốc), `soi/nghi-ngo` dính tờ giấy của ô bên cạnh.
- `bunny.svg`, `bunny-3d.html`: bản thử ban đầu, **không dùng nữa**.

### 3.2 Bản chạy thử: ải "新项目原材料采购", chế độ Dễ
Thư mục `prototype/`:
- `content.js`: bài học và bài đánh giá. `content-mission.js`: **dàn nhân vật và kịch bản nhiệm vụ**. Giáo viên sửa hai file này.
- `art.js`: **hình vẽ bằng code (SVG)**: bản đồ khu công ty isometric (`ART.campus`) và nền các cảnh hội thoại (`ART.scene`).
- `app.js`: máy chạy game. `style.css`: giao diện. `screenshots/`: 30 ảnh chụp.

**Luồng chơi:**
1. Đăng nhập bằng tên → chọn nhân vật (13 con) và hướng dẫn viên (5 con).
   **Trang trung tâm** là bản đồ khu công ty: 培训中心 (lớp học), 能力测评 (phòng thi), 采购部 (văn phòng thu mua, có sếp và đồng nghiệp ngồi trong phòng), 工厂 (nhà máy, khoá, dành cho ải sau). Toà nhà chưa mở thì xám và có ổ khoá; mũi tên cam chỉ nơi cần tới tiếp. Bấm vào toà nhà để vào. Các thẻ chặng vẫn nằm dưới bản đồ.
2. **Lớp đào tạo**, đúng từ 60% mới qua: 21 từ vựng, 5 mẫu câu, quy trình 6 bước và 5 nguyên tắc (có thêm "hỏi nhiều nhà, nói thật" và "汇报, 请示 đúng lúc").
3. **Đánh giá năng lực**: 12 câu, đạt 8 mới mở nhiệm vụ.
4. **Nhiệm vụ** (mua 5 tấn thép inox 304, giá ≤18.000, giao ≤30 ngày, cọc ≤30%):
   - Sếp giao việc → xem bảng 3 báo giá → ghép 2 câu.
   - **Bảng chọn việc:** tự quyết định gọi ai trước.
     - **A · 鄂经理 (cá sấu, 宏发金属):** rẻ nhất. Hỏi tới báo cáo kiểm định thì phải **đọc tài liệu và phát hiện nó đã hết hạn**.
     - **C · 鲍经理 (báo, 华美钢业):** đắt nhất, giao nhanh. Nói chuyện tử tế thì xác nhận được điều kiện để làm **đòn bẩy**.
     - **B · 胡经理 (cáo, 鑫达钢材):** đàm phán chính, 6 lượt. Nếu đã gọi C thì mở thêm lựa chọn dùng đòn bẩy. Có lựa chọn **bịa giá** và bị phát hiện.
   - **汇报:** báo cáo sếp. Đề xuất A thì bị mắng, đề xuất C thì sếp gợi ý dùng làm đòn bẩy, báo cáo không có số liệu thì bị hỏi vặn.
   - Nếu chưa đạt mục tiêu: **tự đàm phán lại** một lần, hoặc **nhờ sếp ra mặt** (được việc, trừ 15 điểm, nhờ sai cách thì bị từ chối), hoặc **请示** xin duyệt đặc biệt.
   - **Tình huống phát sinh:** dự án bị đẩy sớm, 2 tấn phải về trong 20 ngày. Cách hay nhất là đề nghị **分批交货** (giao theo đợt).
   - Viết email xác nhận → sếp chấm 1–3 sao theo 4 tiêu chí.
- **Nền cảnh hội thoại:** cảnh với sếp là văn phòng đầy đủ đồ đạc; cảnh gọi điện chia đôi màn hình: bên trái là bàn làm việc của người chơi, bên phải là chỗ của nhà cung cấp (鑫达: văn phòng nhìn ra kho thép; 宏发: kho bừa bộn, treo lịch năm 2024 như một gợi ý ngầm; 华美: phòng trưng bày sang trọng).
- **Nét mặt phản ứng:** khi bị mắng thì người chơi *sợ hãi* (`so-hai`), bị phê bình nhẹ thì *buồn bã* (`buon-ba`), gặp chuyện bất ngờ hoặc bị hỏi vặn thì *khó hiểu* (`kho-hieu`), bị từ chối thì *khó chịu* (`kho-chiu`). Kịch bản ghi bằng `me` (lúc nói) và `meAfter` (phản ứng sau khi nghe đáp). Con nào thiếu nét đó thì app tự chọn nét gần nghĩa nhất (bảng `NEAR` trong `app.js`).
- Mọi câu và mọi bài tập có chữ Hán, pinyin, tiếng Việt, nút 🔊. Thứ tự lựa chọn được xáo trộn. Nhân vật và hướng dẫn viên đổi nét mặt theo tình huống.
- Nếu người chơi chọn trâu thì sếp là hổ (虎经理), để không trùng hình.
- `?dev` trên URL mở khoá mọi chặng để kiểm tra.

**Cách viết kịch bản** (`content-mission.js`): nhiệm vụ là một mạng các nút. Loại nút: `say` (thoại), `ask` (chọn câu trả lời), `menu` (chọn việc), `quotes`, `build`, `read`, `card`, `email`, `result`. Mỗi lựa chọn có `fx` (đổi trạng thái), `reply` (câu đáp), `go` (nút kế tiếp), `show` (điều kiện hiện). Câu chữ dùng được `{me}`, `{boss}`, `{price}`, `{days}`, `{deposit}`.

**Đã kiểm tra** bằng `tools/screenshots.js`, máy tự chơi 3 nhánh và không có lỗi trang:
| Nhánh | Kết quả |
|---|---|
| Hỏi đủ 3 nhà, dùng đòn bẩy | 3 sao, 100 điểm (18.000 · 28 ngày · 30%) |
| Chỉ gọi B, nhận hết điều kiện xấu, nhờ sếp, trả phí làm gấp | 2 sao, 2 điểm (18.500 · 20 ngày · 30%) |
| Bịa giá, gắt gỏng, đàm phán lại, xin duyệt đặc biệt | 1 sao, 61 điểm (18.300 · 30 ngày · 50%) |

**Chế độ Vừa (13/11)**, file `prototype/ai.js`:
- Màn **🔑 连接 AI 老师** ngay sau khi nhập tên: hướng dẫn 4 bước lấy key, ô dán key, nút **Kiểm tra và lưu**. Game gọi danh sách model của Google rồi **tự chọn model Gemini Flash mới nhất dùng được** với key đó (không gắn cứng tên model, vì Google đổi tên theo thời gian); hết lượt hoặc model ngừng hoạt động thì tự thử model kế tiếp. Nút 🔑 trên thanh trên cùng để đổi hoặc xoá key.
- Mỗi lượt hỏi đáp: hiện **mục tiêu** của lượt, ô gõ tiếng Trung, nút **🎤 Nói** (nhận giọng nói zh-CN của trình duyệt, chỉ Chrome/Edge), **💡 Gợi ý** (mẫu câu + từ vựng có pinyin, miễn phí), **💬 Câu mẫu** (2 🪙).
- **AI chấm như thế nào:** AI xếp câu của học viên vào lựa chọn có ý định và thái độ gần nhất trong kịch bản có sẵn, nên **câu chuyện vẫn rẽ nhánh như chế độ Dễ**. AI trả về mức đánh giá (tốt / tạm / chưa tốt, bị hạ một bậc nếu sai ngữ pháp), **câu sửa tự nhiên hơn kèm pinyin** và **nhận xét tiếng Việt**. Câu không phải tiếng Trung thì bị yêu cầu viết lại, không trừ điểm.
- Bước soạn câu: tự viết 2 câu then chốt, AI chấm (sai lần đầu được viết lại).
- Lỗi AI (key sai, hết lượt, mất mạng) đều có thông báo tiếng Việt và nút **Chọn đáp án cho lượt này** để chơi tiếp.
- Hoàn thành chế độ Vừa được gấp đôi điểm 🪙; thành tích lưu riêng (`bestMid`).
- **Kiểm thử không cần key:** thêm `?mockai` vào địa chỉ để dùng bộ chấm giả lập. Đã kiểm tra thật với Google bằng một key giả: trình duyệt gọi được (không bị chặn CORS) và lỗi key sai được nhận đúng. **Chưa thử với key thật.**

**Bản đồ trang trung tâm dùng tranh vẽ sẵn (13/11):** `gamesource art/đồ họa game.png` (người dùng tạo bằng Gemini, không có chữ) được chuyển thành `prototype/assets/campus.webp`. Trên tranh, `ART.campusImage` trong `art.js` phủ vùng bấm hình đa giác theo đường viền từng toà nhà, biển tên (chữ Hán, pinyin, tiếng Việt), lớp xám và ổ khoá cho toà chưa mở, mũi tên chỉ nơi cần tới, và ảnh nhân vật người chơi. Toạ độ đo trên khung 1024 × 572 (bảng `MAP`); **đổi tranh khác thì phải đo lại**. Bản đồ vẽ bằng code (`ART.campus`) vẫn giữ làm phương án dự phòng.

**Đồ hoạ (13/11)** theo `gamesource art/Phong cách ban đầu cho bản đồ game.png` và `gamesource art/Hình ảnh văn phòng tham khảo.png`: cây tán tròn nhiều lớp, bồn hoa, bụi cây, các bạn thú ngồi học / làm bài / làm việc trong phòng, bảng đen phấn trắng, máy móc cạnh nhà máy; văn phòng sếp thêm cúp, huy chương, tranh biểu đồ, bản đồ thế giới, laptop, kệ hồ sơ, ống bút, xương rồng, chậu hoa.

**Đã sửa ngày 13/11:** nút "Đổi nhân vật" đè lên khung; bảng báo giá tràn ngang trên điện thoại.

**Chưa kiểm tra:** giọng đọc thực tế (máy chạy ngầm không phát được tiếng). Nội dung tiếng Trung và pinyin do AI soạn, **chưa có giáo viên duyệt**.

### 3.3 Bản 5 (13/11): tình huống riêng cho từng chế độ, luyện tập 3 cấp, tra từ, sổ tay, đi bộ trên bản đồ

**Kịch bản mới** trong `prototype/content-missions-2.js` (`C.missions = { easy, mid, hard }`; app tự chọn kịch bản theo chế độ):
- **Vừa · 采购温控器:** mua 10.000 bộ điều chỉnh nhiệt (≤12 tệ, ≤25 ngày, sai số ≤ ±2°C). Đọc báo cáo thử mẫu (恒通 sai số ±8°C) → gọi 郎经理 (sói, 恒通电子: rẻ nhưng mẫu không đạt, bắt đặt tối thiểu 20.000) và 吴经理 (quạ, 精工电子: mẫu đạt, giá 13,5, giao 30 ngày) → báo cáo sếp → **bão** làm hàng trễ 7 ngày (đổi sang đường bộ, chia đôi phí) → email.
- **Khó · 供应商危机:** bốn rắc rối cùng lúc, tự chọn thứ tự: 龙主任 (khủng long, trưởng xưởng: thép trầy 3%), 胡经理 (đòi bồi thường + đòi tăng giá 8% trái hợp đồng), 佘经理 (rắn hổ mang, 金龙钢铁: **đưa phong bì hối lộ**), 季会计 (nhím, tài chính: không trả cọc vì chưa có hoá đơn). Báo cáo sếp; nếu đã nhận phong bì thì sếp phát hiện và người chơi phải chọn nhận lỗi hay chối.
- Mỗi kịch bản tự khai báo: `terms` (bảng điều khoản), `card` (thẻ nhiệm vụ), `emailValues`, `resultNotes`, `criteria`, `results`, `mid` (gợi ý từng lượt), `situation` (bối cảnh gửi cho AI). Nhân vật mới khai báo `scene` (kiểu nền: `tidy` / `warehouse` / `showroom` / `office` + tên công ty) để vẽ nền cảnh gọi điện.

**Luyện tập 3 cấp** cho mỗi bài học (qua cấp trước ≥ 60% mới mở cấp sau; qua cấp Cơ bản = hoàn thành bài):
- 初级 Cơ bản: trắc nghiệm + nghe chọn nghĩa.
- 中级 Trung bình: nghe chọn chữ Hán (không pinyin), chọn câu/từ theo nghĩa tiếng Việt, điền từ vào câu ví dụ hoặc dịch câu sang tiếng Việt, **phản xạ 8 giây**.
- 高级 Nâng cao: **phản xạ 5 và 4 giây**, **nghe viết** chữ Hán, **tự dịch sang tiếng Trung** (AI chấm bằng key của học viên; không có key thì so với đáp án mẫu).
Câu hỏi tự sinh từ dữ liệu bài học (`practiceQuestions` trong `app.js`).

**Tra từ:** chữ Hán trong bài học, hội thoại, lựa chọn, câu hỏi đều bấm được (gạch chân chấm). Bấm vào từ → bảng sổ xuống ngay dưới từ: chữ Hán, 🔊, pinyin, nghĩa, câu ví dụ, nút **＋** thêm vào sổ từ. Từ điển = `prototype/glossary.js` (khoảng 170 từ, dạng `chữ|pinyin|nghĩa`) + từ trong bài học + từ gợi ý của nhiệm vụ. Câu ví dụ lấy từ bài học, không có thì lấy một câu trong game có chứa từ đó. Trong ô chữ và đáp án trắc nghiệm thì bấm là để chọn, không tra.

**📒 Sổ từ ôn tập** (nút trên thanh trên cùng): danh sách từ đã lưu, nút **Ôn tập sổ từ** (nghe, chọn nghĩa, chọn chữ).
**📕 Sổ lỗi sai:** tự ghi mọi câu bài tập làm sai (kèm câu trả lời sai và đáp án) và mọi lượt hội thoại chưa tốt trong nhiệm vụ (em đã nói gì, nên nói gì, vì sao). Nút **Làm lại các câu sai**: câu nào làm lại đúng thì tự xoá khỏi sổ.

**Đi bộ trên bản đồ:** bấm một toà nhà → nhân vật của người chơi đi bộ theo đường (từ cửa toà nhà đang đứng → ngã tư → cửa toà nhà đích), nhún nhảy, quay mặt theo hướng đi, để lại dấu chân, tới nơi mới vào. Vị trí lưu trong `S.mapAt`. Toạ độ cửa và ngã tư nằm trong bảng `MAP` của `art.js`.

**Đã kiểm tra** (`tools/screenshots.js`, bộ chấm giả lập `?mockai`): 3 nhánh Dễ (3/2/1 sao), Vừa 3 sao, Khó 3 sao, luyện tập cấp Trung bình (có câu hết giờ) và Nâng cao (tự gõ), tra từ, thêm vào sổ, sổ lỗi sai, đi bộ trên bản đồ. Không có lỗi trang. Đã sửa: nút "Kiểm tra" ở bước ghép câu bị thanh hướng dẫn che trên điện thoại.
**Chưa kiểm tra:** AI thật với key thật; nội dung tiếng Trung, pinyin của hai kịch bản mới và từ điển do AI soạn, **chưa có giáo viên duyệt**.

### 3.4 Tài khoản và đồng bộ (13/11)
- Làm theo cách của nền tảng tiếng Anh Destination (`D:\学习\英文\Destination\app\src\lib\cloud.js`): **Firebase** (Auth + Firestore), nhưng là **dự án Firebase riêng** cho game (người dùng chọn, không dùng chung `destination-english`).
- `prototype/firebase-config.js`: đang là `null` → game chạy không tài khoản như cũ. Người dùng tạo dự án theo `HUONG-DAN-FIREBASE.md` rồi dán cấu hình vào.
- `prototype/cloud.js` (module, tải Firebase 10.12.2 từ gstatic): đăng nhập Google hoặc email + mật khẩu, quên mật khẩu; toàn bộ `S` (kể cả API Key) lưu ở `users/{uid}/apps/hanyu-office`; Rules chỉ cho chính học viên đọc/ghi.
- Đồng bộ: `save()` đóng dấu `S.t`, gửi lên sau 1,5 giây; máy khác nhận ngay. Bản mới hơn làm gốc, gộp thêm phần chỉ tăng (bài đã học, sổ từ, mốc thưởng, bảng kiểm tra, điểm cao nhất, bài đánh giá đạt). Đang làm bài thì chờ, về trung tâm mới áp dụng. Quà mỗi ngày không đóng dấu thời gian (để máy lâu không mở không thành "bản mới hơn").
- Đăng xuất: gửi nốt, rồi xoá dữ liệu và key khỏi máy đó. Nút ☁️ trên thanh trên mở màn 我的账号.
- Kiểm thử: `tools/sync-test.js` dùng Firebase giả, hai "máy" song song: đăng nhập, nhận key/tiến độ, gộp khi đang làm bài, không ghi qua lại, đăng xuất. Đã qua hết. **Chưa thử với Firebase thật.**

### 3.5 Chương 2 · 工厂: 钢板到货了 (14/11, chế độ Dễ)
- Mở khi xong nhiệm vụ 采购部 **và** học xong bài 4 (跟单与收货); màn 工厂 nhắc học bài 4 nếu chưa. Vừa/Khó: "🔒 Chương sau".
- Cốt truyện: thép của 鑫达 sắp tới hạn → gọi 胡经理 hỏi tiến độ, hối hàng vì thứ Hai sản xuất, xin mã vận đơn → báo cáo sếp → tra vận đơn → xuống kho (cảnh mới vẽ bằng code) gặp 龙主任, thủ kho 貂师傅 (chồn), tài xế 费师傅 (rết) → không ký ngay, **đối chiếu giấy tờ** (thiếu 发票) và **đếm hàng** (9/10 kiện, kiện 6 hỏng) → chụp ảnh, ghi lên 送货单, tài xế ký → gọi 胡经理 đòi gửi bù và hoá đơn → báo cáo cuối.
- Nhánh sai có hậu quả: chấp nhận trễ → sếp mắng, phải gọi lại; ký trước khi kiểm tra; không ghi chú → nhà cung cấp chối; giấu vấn đề với sếp.
- Kiểu nút mới `check` (bấm đánh dấu mục có vấn đề, sai 2 lần thì hiện đáp án, kèm câu hỏi); nút có `bg` và `place`.
- Engine theo chương: `S.mission.ch` ('buy' / 'factory'), `C.factory`, điểm cao nhất `S.fBest` (đồng bộ qua cloud), thưởng `earned.factory`.
- File: `content-factory.js` (nhân vật, thẻ nhiệm vụ), `content-factory-nodes.js`, `content-factory-nodes-2.js`; kiểm thử `tools/factory-test.js` (nhánh tốt 3 sao, nhánh xấu 1 sao, không lỗi trang). Ảnh 64–76 trong `prototype/screenshots/`.
- **Chưa có giáo viên duyệt** câu chữ tiếng Trung của chương 2.

### 3.6 Màn 🛠 Kiểm tra nội dung (14/11)
- Nút 🛠 trên thanh trên cùng, **chỉ hiện khi chạy trên máy** (localhost) hoặc có `?dev`. Học viên dùng bản trên mạng không thấy.
- Cài đặt (lưu riêng trong `localStorage['hanyu-office-review']`, không đồng bộ): **Mở khoá mọi chặng** (mặc định bật trên máy), **AI chấm giả lập** (mặc định tắt), +500 🪙.
- Vào thẳng: học / luyện cấp 1-2-3 từng bài, bài đánh giá, mọi chế độ của từng chương (▶ Từ đầu), **nhảy tới bất kỳ cảnh nào** trong nhiệm vụ (danh sách cảnh theo id · loại · người nói · câu đầu), và các màn khác. Chưa có tên/nhân vật thì tự dùng tạm thỏ.
- Bài thử tự động đặt `{"on":false}` để vẫn kiểm tra đúng luật mở khoá; `tools/review-test.js` thử màn 🛠.

## 4. Cách chạy

```bash
node game/tools/serve.js
```
Mở http://localhost:5173/prototype/ bằng Edge hoặc Chrome. Trong app Claude có sẵn cấu hình preview tên **`game`** trong `HSK3.0/.claude/launch.json` (cổng 5173). Cấu hình `hsk-app` (cổng 8765) trong file đó là của ứng dụng khác.

Công cụ trong `tools/` (cần `cd game && npm install sharp puppeteer-core`, phiên mới phải cài lại vì trước đây chỉ cài trong thư mục tạm):
- `crop-characters.js`: cắt nhân vật từ ảnh lưới. Khai báo từng hàng (`y`, `n`, `names`), ranh giới cột được dò tự động; hàng không cách đều thì thêm `cuts`. Chạy riêng một ảnh: `node tools/crop-characters.js <một phần tên file>`.
- `contact-sheet.js`: ghép ảnh tổng hợp.
- `screenshots.js`: chơi tự động 3 nhánh, kiểm tra kết quả, chụp ảnh. Chạy lại sau mỗi lần sửa kịch bản.

Lưu ý: máy **không có Python**, chỉ có Node. Đừng dùng `Get-Content`/`Set-Content` của PowerShell để sửa file có chữ Trung hoặc tiếng Việt, dễ hỏng mã hoá.

## 5. Việc tiếp theo

1. **Người dùng duyệt** bản Dễ: nội dung tiếng Trung, độ khó (đang nhắm HSK 3–4), số liệu nghiệp vụ (đang là giả định).
2. **Chế độ Vừa:** đã xong cho ải thu mua. Cần người dùng **thử với key thật** và xem AI chấm có hợp lý không; chỉnh lời dặn AI trong `prototype/ai.js` (`TURN_SYSTEM`, `SENT_SYSTEM`) nếu cần. Gợi ý cho từng lượt nằm ở `mission.mid` trong `content-mission.js`.
3. **Chế độ Khó:** đã xong. Cần người dùng duyệt nội dung hai kịch bản mới (`content-missions-2.js`) và từ điển (`glossary.js`).
4. **Trò chơi thao tác:** màn hình máy tính giả lập (hộp thư, bảng báo giá 比价表), 3 cấp độ.
5. **Hình còn thiếu:** biểu cảm cho rồng, khỉ, lợn (và đủ bộ cho trâu, hổ); hướng dẫn viên gấu trúc, cú mèo, chim cánh cụt. Nền cảnh và bản đồ hiện vẽ bằng code; nếu có tranh vẽ tay cùng phong cách thì có thể thay vào.
6. **Mở rộng bản đồ thành thành phố:** thêm khu phố, trung tâm thương mại, ngân hàng…; mỗi toà nhà là một ải.
7. **Ải tiếp theo đã đề xuất:** 参观工厂 (khảo sát nhà máy).
8. **Về sau:** sổ lỗi sai (错题本), chạm vào từ để xem nghĩa, giọng đọc mp3, đăng nhập thật, chấm phát âm, hệ thống chức danh.

## 6. Cấu trúc thư mục `game/`

```
game/
├── TOM-TAT-DU-AN.md        ← file này
├── README.md               ← cách chạy ngắn gọn
├── gamesource art/         ← ảnh gốc (Gemini) + ảnh tham khảo giao diện
├── characters/             ← nhân vật đã tách nền
│   ├── nhom-12-con-giap/, nhom-2/, tho-bieu-cam/   ← dáng đứng
│   └── bieu-cam/<con-vật>/                          ← biểu cảm
├── prototype/              ← bản chạy thử
│   ├── content.js          ← bài học, bài đánh giá
│   ├── content-mission.js  ← nhân vật, kịch bản chế độ Dễ
│   ├── content-missions-2.js ← kịch bản chế độ Vừa và Khó, nhân vật mới
│   ├── glossary.js         ← từ điển tra cứu
│   ├── art.js              ← bản đồ isometric + nền cảnh (SVG)
│   ├── ai.js               ← kết nối Gemini bằng key của học viên, chấm bài chế độ Vừa
│   ├── app.js, style.css, index.html
│   └── screenshots/
└── tools/                  ← crop-characters.js, contact-sheet.js, screenshots.js, serve.js
```
