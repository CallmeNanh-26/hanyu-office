// Từ điển tra cứu khi bấm vào một từ. Mỗi dòng: chữ Hán|pinyin|nghĩa tiếng Việt|+
// Dấu + ở cuối = từ mở rộng, vượt phạm vi bài học: game tự ghi chú nghĩa ngay dưới câu có từ đó
// (trừ khi từ đã có trong danh sách từ vựng của một bài học).
// Từ trong bài học (content.js) và gợi ý từ vựng của các nhiệm vụ cũng tự động được thêm vào.
// Câu ví dụ: lấy từ bài học nếu có, không thì lấy một câu trong game có chứa từ đó.
window.GLOSSARY_RAW = `
采购|cǎigòu|thu mua, mua hàng
采购部|cǎigòubù|phòng thu mua
原材料|yuáncáiliào|nguyên vật liệu
供应商|gōngyìngshāng|nhà cung cấp
报价|bàojià|báo giá
报价单|bàojiàdān|bảng báo giá
单价|dānjià|đơn giá
价格|jiàgé|giá cả
吨|dūn|tấn
不锈钢|bùxiùgāng|thép không gỉ (inox)
不锈钢板|bùxiùgāng bǎn|thép tấm inox
钢板|gāngbǎn|thép tấm
钢材|gāngcái|vật liệu thép
预算|yùsuàn|ngân sách
交货|jiāohuò|giao hàng
交货期|jiāohuòqī|thời hạn giao hàng
到货|dàohuò|hàng về, hàng tới
发货|fāhuò|gửi hàng, xuất hàng
付款|fùkuǎn|thanh toán
付款方式|fùkuǎn fāngshì|phương thức thanh toán
定金|dìngjīn|tiền đặt cọc
全款|quánkuǎn|toàn bộ số tiền|+
预付|yùfù|trả trước|+
余款|yúkuǎn|số tiền còn lại|+
质量|zhìliàng|chất lượng
质检报告|zhìjiǎn bàogào|báo cáo kiểm định chất lượng
合同|hétong|hợp đồng
签合同|qiān hétong|ký hợp đồng
优惠|yōuhuì|ưu đãi
长期合作|chángqī hézuò|hợp tác lâu dài
合作|hézuò|hợp tác
汇报|huìbào|báo cáo (với cấp trên)
请示|qǐngshì|xin chỉ thị, xin ý kiến|+
有效期|yǒuxiàoqī|thời hạn hiệu lực
过期|guòqī|hết hạn
提前|tíqián|sớm hơn, đẩy lên trước
分批|fēnpī|chia đợt
经理|jīnglǐ|trưởng phòng, giám đốc
主任|zhǔrèn|chủ nhiệm, trưởng (bộ phận)
会计|kuàijì|kế toán
公司|gōngsī|công ty
项目|xiàngmù|dự án
生产|shēngchǎn|sản xuất
开始生产|kāishǐ shēngchǎn|bắt đầu sản xuất
产品|chǎnpǐn|sản phẩm
新产品|xīn chǎnpǐn|sản phẩm mới
水壶|shuǐhú|ấm đun nước
智能电水壶|zhìnéng diànshuǐhú|ấm siêu tốc thông minh|+
零件|língjiàn|linh kiện
温控器|wēnkòngqì|bộ điều chỉnh nhiệt|+
样品|yàngpǐn|hàng mẫu
新样品|xīn yàngpǐn|mẫu mới
测试|cèshì|thử nghiệm|+
测试报告|cèshì bàogào|báo cáo thử nghiệm|+
测试结果|cèshì jiéguǒ|kết quả thử nghiệm|+
误差|wùchā|sai số|+
温度|wēndù|nhiệt độ
标准|biāozhǔn|tiêu chuẩn
合格|hégé|đạt chuẩn
不合格|bù hégé|không đạt chuẩn
起订量|qǐdìngliàng|số lượng đặt tối thiểu|+
订单|dìngdān|đơn đặt hàng
下订单|xià dìngdān|đặt hàng
订|dìng|đặt (hàng)
订购|dìnggòu|đặt mua
数量|shùliàng|số lượng
批|pī|lô, đợt (hàng)
第一批|dì-yī pī|lô thứ nhất
第二批|dì-èr pī|lô thứ hai
台风|táifēng|bão|+
海运|hǎiyùn|vận chuyển đường biển|+
陆运|lùyùn|vận chuyển đường bộ|+
运费|yùnfèi|phí vận chuyển|+
运输|yùnshū|vận chuyển|+
双方|shuāngfāng|hai bên|+
仓库|cāngkù|nhà kho|+
库存|kùcún|hàng tồn kho|+
推迟|tuīchí|hoãn lại, trì hoãn|+
取消|qǔxiāo|huỷ bỏ
不可抗力|bùkěkànglì|bất khả kháng|+
划痕|huáhén|vết trầy xước|+
换货|huànhuò|đổi hàng
索赔|suǒpéi|đòi bồi thường|+
打折|dǎzhé|giảm giá
打八折|dǎ bā zhé|giảm 20% (còn 80%)|+
涨价|zhǎngjià|tăng giá|+
加价|jiājià|tăng giá, cộng thêm giá|+
证明|zhèngmíng|chứng minh, giấy chứng nhận|+
照片|zhàopiàn|ảnh chụp
红包|hóngbāo|phong bì (tiền)|+
回扣|huíkòu|tiền lại quả|+
规定|guīdìng|quy định
公司规定|gōngsī guīdìng|quy định công ty
发票|fāpiào|hoá đơn
财务|cáiwù|tài chính|+
财务部|cáiwùbù|phòng tài chính|+
负责|fùzé|chịu trách nhiệm, phụ trách
批准|pīzhǔn|phê duyệt|+
拒绝|jùjué|từ chối
处理|chǔlǐ|xử lý
解决|jiějué|giải quyết
问题|wèntí|vấn đề
建议|jiànyì|đề xuất, kiến nghị
推荐|tuījiàn|giới thiệu, đề xuất
比较|bǐjiào|so sánh; khá là
比价|bǐjià|so sánh giá
询价|xúnjià|hỏi giá
谈判|tánpàn|đàm phán
商量|shāngliang|bàn bạc
沟通|gōutōng|trao đổi|+
安排|ānpái|sắp xếp
确认|quèrèn|xác nhận
回复|huífù|trả lời, phản hồi
联系|liánxì|liên lạc
考虑|kǎolǜ|cân nhắc
决定|juédìng|quyết định
条件|tiáojiàn|điều kiện
目标|mùbiāo|mục tiêu
达到|dádào|đạt được
超过|chāoguò|vượt quá
成本|chéngběn|giá thành, chi phí|+
压力|yālì|áp lực|+
市场价|shìchǎng jià|giá thị trường|+
稳定|wěndìng|ổn định
便宜|piányi|rẻ
便宜一点|piányi yìdiǎn|rẻ hơn một chút
贵|guì|đắt
尽快|jǐnkuài|càng sớm càng tốt
马上|mǎshàng|ngay lập tức
最晚|zuì wǎn|chậm nhất
之前|zhīqián|trước (khi)
之内|zhīnèi|trong vòng
以后|yǐhòu|sau khi, sau này
如果|rúguǒ|nếu
的话|dehuà|(nếu) … thì
能不能|néng bu néng|có thể … không
先|xiān|trước tiên
再|zài|rồi, lại, nữa
比如|bǐrú|ví dụ như
一定|yídìng|nhất định
必须|bìxū|bắt buộc phải
着急|zháojí|sốt ruột, lo lắng
别着急|bié zháojí|đừng lo
理解|lǐjiě|thông cảm, hiểu
不好意思|bù hǎoyìsi|ngại quá, xin lỗi
麻烦|máfan|phiền phức; làm phiền
谢谢|xièxie|cảm ơn
对不起|duìbuqǐ|xin lỗi
欢迎|huānyíng|hoan nghênh
您好|nín hǎo|xin chào (kính trọng)
请问|qǐngwèn|xin hỏi
愉快|yúkuài|vui vẻ
合作愉快|hézuò yúkuài|hợp tác vui vẻ
消息|xiāoxi|tin tức
坏消息|huài xiāoxi|tin xấu
电话|diànhuà|điện thoại
打电话|dǎ diànhuà|gọi điện thoại
邮件|yóujiàn|thư điện tử
报告|bàogào|báo cáo
工厂|gōngchǎng|nhà máy
培训|péixùn|đào tạo
新员工|xīn yuángōng|nhân viên mới
实习生|shíxíshēng|thực tập sinh|+
转正|zhuǎnzhèng|lên nhân viên chính thức|+
爽快|shuǎngkuai|dứt khoát, thẳng thắn|+
没意思|méi yìsi|mất vui, chán|+
开玩笑|kāi wánxiào|nói đùa|+
遗憾|yíhàn|tiếc|+
亲自|qīnzì|đích thân|+
加急费|jiājífèi|phí làm gấp|+
尽力|jìnlì|cố gắng hết sức|+
剩下|shèngxià|còn lại|+
通知|tōngzhī|thông báo|+
至少|zhìshǎo|ít nhất|+
拜托|bàituō|nhờ cậy, làm ơn|+
打算|dǎsuàn|định, dự định|+
原来|yuánlái|ban đầu, lúc đầu|+
份上|fèn shang|(nể) tình, (vì) mối quan hệ|+
生产线|shēngchǎnxiàn|dây chuyền sản xuất|+
包装|bāozhuāng|bao bì, đóng gói|+
单据|dānjù|chứng từ, giấy tờ|+
司机|sījī|tài xế|+
预计|yùjì|dự kiến|+
查|chá|tra, kiểm tra
名片|míngpiàn|danh thiếp
师傅|shīfu|bác, anh (gọi thợ, tài xế)|+
补发|bǔfā|gửi bù|+
影响|yǐngxiǎng|ảnh hưởng|+
货车|huòchē|xe tải|+
签字|qiānzì|ký tên
件|jiàn|kiện, cái (lượng từ)
数|shǔ|đếm
拍照片|pāi zhàopiàn|chụp ảnh
写清楚|xiě qīngchu|ghi rõ
承认|chéngrèn|thừa nhận|+
来得及|lái de jí|còn kịp|+
打扰|dǎrǎo|làm phiền|+
随时|suíshí|bất cứ lúc nào|+
运输中|yùnshū zhōng|đang vận chuyển|+
骗人|piàn rén|lừa người|+
具体|jùtǐ|cụ thể|+
马虎|mǎhu|qua loa, cẩu thả|+
准确|zhǔnquè|chính xác|+
答应|dāying|đồng ý, hứa|+
确实|quèshí|đúng là, quả thật|+
收货|shōuhuò|nhận hàng
另外|lìngwài|ngoài ra|+
换|huàn|đổi
准确的|zhǔnquè de|chính xác|+
`;
