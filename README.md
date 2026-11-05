# kien-tools-test

Mã đo dùng chung cho các skill audit content Kiến 247 và Kiến Môi Trường.

| File | Chạy ở đâu | Việc |
|---|---|---|
| `trinh-duyet/do-co-ban.js` | Tab trình duyệt (và Node) | Đo trang: chỉ số, bản đồ heading, từ khoá chính + phụ, Title/H1/Meta, link (trang của mình); đọc kết quả Google (`KDO.serp()`) |
| `may/co-ban.js` | Node | `chon` chọn đối thủ · `kwphu` sinh từ khoá phụ · `plan` bảng so sánh · `meta` chấm Title/H1/Meta · `do` đo file HTML |

Skill luôn gọi theo tag phiên bản (ví dụ `@v1`). Sửa mã thì tạo tag mới, không sửa tag cũ.
