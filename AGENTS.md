# Quy tắc làm việc cho Codex

- Trước khi sửa code, phải đọc luồng liên quan và ưu tiên pattern sẵn có trong repo.
- Giữ phạm vi thay đổi nhỏ, đúng yêu cầu; không refactor hoặc đổi style ngoài vùng cần thiết nếu chưa được yêu cầu.
- Không ghi đè, revert, xóa hoặc làm mất thay đổi có sẵn của người dùng. Nếu gặp thay đổi lạ trong cùng file, phải làm việc cẩn thận quanh phần đó.
- Không build feature mới với nội dung tiếng Việt không dấu. Mọi text hiển thị cho người dùng bằng tiếng Việt phải có dấu đầy đủ.
- UI mới phải có trạng thái hợp lý cho rỗng, loading, lỗi, quyền truy cập và responsive khi có liên quan.
- Sau khi sửa code, phải chạy kiểm tra phù hợp với mức rủi ro của thay đổi, tối thiểu là build/typecheck nếu app có sẵn script tương ứng.
- Nếu kiểm tra không chạy được vì môi trường, phải ghi rõ lý do và thử cách thay thế an toàn trước khi kết luận.
- Sau khi hoàn tất thay đổi code hoặc rule, phải commit thay đổi và push lên GitHub.
- Commit message phải ngắn gọn, mô tả đúng hành vi thay đổi, không gom thêm file ngoài phạm vi công việc.
- Khi báo cáo kết quả, phải nêu file chính đã sửa, kiểm tra đã chạy, commit hash và trạng thái push.

# Cấu hình Repository
- **Main Repo (GitHub)**: `https://github.com/AshuraXX2206/indiecollab.git` (Dùng để tham chiếu và merge sau này).
