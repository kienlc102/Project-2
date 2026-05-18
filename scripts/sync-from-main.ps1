# scripts/sync-from-main.ps1
# Pull code moi nhat tu origin/main vao branch long
# Cac file quiz/flashcard/AI/config se duoc giu nguyen (nhờ .gitattributes)
#
# PREREQUISITE: Chay scripts/setup-merge-protection.ps1 truoc (1 lan duy nhat)

param(
    [switch]$DryRun  # Neu truyen -DryRun, chi fetch va hien thi diff, khong merge
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Sync tu origin/main -> branch long     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Kiem tra branch hien tai
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne "long") {
    Write-Host "[WARN] Ban dang o branch '$currentBranch', khong phai 'long'." -ForegroundColor Yellow
    $confirm = Read-Host "Tiep tuc? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "Huy." -ForegroundColor Red
        exit 1
    }
}

# 2. Kiem tra working tree sach
$status = git status --porcelain
if ($status) {
    Write-Host "[ERROR] Working tree chua sach. Hay commit hoac stash truoc." -ForegroundColor Red
    git status --short
    exit 1
}

# 3. Fetch origin
Write-Host "[1/3] Fetching origin/main..." -ForegroundColor Cyan
git fetch origin main
Write-Host "      Done." -ForegroundColor Green

# 4. Hien thi files se thay doi
Write-Host "[2/3] Files se thay doi khi merge (khong tinh cac file da bao ve):" -ForegroundColor Cyan
git diff --name-only HEAD origin/main | Where-Object { $_ -ne "" } | ForEach-Object {
    Write-Host "      $_" -ForegroundColor White
}

if ($DryRun) {
    Write-Host "[DryRun] Khong thuc hien merge. Ket thuc." -ForegroundColor Yellow
    exit 0
}

# 5. Merge
Write-Host "[3/3] Merging origin/main (cac file bao ve se duoc giu nguyen)..." -ForegroundColor Cyan
$mergeResult = git merge origin/main --no-edit 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] Co conflict can xu ly thu cong:" -ForegroundColor Yellow
    git status --short | Where-Object { $_ -match "^(UU|AA|DD)" } | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Sau khi giai quyet conflict, chay:" -ForegroundColor Yellow
    Write-Host "  git add ." -ForegroundColor White
    Write-Host "  git commit" -ForegroundColor White
} else {
    Write-Host "[OK] Merge thanh cong!" -ForegroundColor Green
    Write-Host "     Cac feature quiz/flashcard/AI van duoc giu nguyen." -ForegroundColor Green
}
