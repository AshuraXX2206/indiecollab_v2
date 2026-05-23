# Thay đổi PowerShell Execution Policy

## Cách 1: Set Policy Permanent (Run as Administrator)

Mở PowerShell **Run as Administrator**, chạy:

```powershell
# Xem policy hiện tại
Get-ExecutionPolicy

# Set policy cho CurrentUser (Khuyến nghị - an toàn hơn)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Hoặc set policy cho LocalMachine (toàn hệ thống)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
```

**Giải thích các policy:**
- `Restricted` - Không chạy được script (mặc định)
- `RemoteSigned` - Chạy local script, remote script phải có signature (Khuyến nghị)
- `Unrestricted` - Chạy tất cả (không khuyến khích)

## Cách 2: Bypass cho Session hiện tại (Tạm thời)

Mở PowerShell thường (không cần Admin), chạy:

```powershell
# Bypass policy cho session này
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Kiểm tra
Get-ExecutionPolicy

# Giờ có thể chạy npm, npx, firebase
npm install -g firebase-tools
firebase --version
```

## Cách 3: Dùng Command Prompt (cmd) thay vì PowerShell

Mở **Command Prompt** hoặc **Git Bash** thay vì PowerShell:

```cmd
# Trong CMD không bị policy hạn chế
npm install -g firebase-tools
firebase --version
firebase login
```

## Xác nhận thành công

```powershell
# Kiểm tra firebase đã cài chưa
firebase --version
# Output: 15.18.0 (hoặc version mới hơn)
```

## Sau khi đổi policy

Chạy deploy Firebase:
```bash
cd "c:\Users\ACER\OneDrive\Desktop\agile-solodev-hub (1)"
firebase login
firebase init  # Nếu chưa init
firebase deploy --only firestore
firebase deploy --only auth
```

---

**Lưu ý bảo mật:**
- `RemoteSigned` là cân bằng tốt giữa bảo mật và tiện dụng
- Không dùng `Unrestricted` trên máy production
- `Bypass -Scope Process` an toàn vì chỉ ảnh hưởng session hiện tại
