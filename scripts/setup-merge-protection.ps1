# scripts/setup-merge-protection.ps1
# Chạy 1 lần để kích hoạt merge strategy "ours" trong .gitattributes
# Sau khi chạy, các file được đánh dấu trong .gitattributes sẽ không bị
# ghi đè khi merge từ origin/main.

Write-Host "[Setup] Kích hoạt merge driver 'ours' cho git..." -ForegroundColor Cyan
git config merge.ours.driver true

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Merge driver 'ours' đã được kích hoạt." -ForegroundColor Green
    Write-Host "[OK] Các file trong .gitattributes sẽ được giữ nguyên khi merge từ main." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Không thể cấu hình git merge driver." -ForegroundColor Red
}
