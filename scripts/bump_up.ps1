param (
    [Parameter(Mandatory=$true)]
    [string]$Version
)

# バージョン番号の形式を確認（vx.x.xの形式）
if ($Version -notmatch '^v\d+\.\d+\.\d+$') {
    Write-Error "バージョン番号は 'vx.x.x' の形式で入力してください。例: v1.2.3"
    exit 1
}

# 'v'を除いたバージョン番号
$VersionNumber = $Version.Substring(1)

Write-Host "バージョンを $Version に更新します..."

# 必要なファイルの存在確認
$RequiredFiles = @(
    "package.json",
    "src-tauri/tauri.conf.json",
    "src-tauri/Cargo.toml"
)

$AllFilesExist = $true
foreach ($file in $RequiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Error "$file が見つかりません。"
        $AllFilesExist = $false
    }
}

if (-not $AllFilesExist) {
    Write-Error "必要なファイルが見つからないため、処理をキャンセルします。"
    exit 1
}

Write-Host "すべての必要なファイルが見つかりました。処理を続行します。"

# package.jsonのバージョン更新
$PackageJsonPath = "package.json"
$PackageJson = Get-Content $PackageJsonPath -Raw | ConvertFrom-Json
$PackageJson.version = $VersionNumber
$PackageJson | ConvertTo-Json -Depth 100 | Set-Content $PackageJsonPath
Write-Host "package.json のバージョンを $VersionNumber に更新しました。"

# tauri.conf.jsonのバージョン更新
$TauriConfPath = "src-tauri/tauri.conf.json"
$TauriConf = Get-Content $TauriConfPath -Raw | ConvertFrom-Json
$TauriConf.version = $VersionNumber
$TauriConf | ConvertTo-Json -Depth 100 | Set-Content $TauriConfPath
Write-Host "src-tauri/tauri.conf.json のバージョンを $VersionNumber に更新しました。"

# Cargo.tomlのバージョン更新
$CargoTomlPath = "src-tauri/Cargo.toml"
$CargoToml = Get-Content $CargoTomlPath
$UpdatedCargoToml = @()
$VersionReplaced = $false

foreach ($line in $CargoToml) {
    if (-not $VersionReplaced -and $line -match '^version\s*=\s*"[\d\.]+"') {
        $UpdatedCargoToml += $line -replace '(version\s*=\s*)"[\d\.]+"', "`$1""$VersionNumber"""
        $VersionReplaced = $true
    } else {
        $UpdatedCargoToml += $line
    }
}

$UpdatedCargoToml | Set-Content $CargoTomlPath
Write-Host "src-tauri/Cargo.toml のバージョンを $VersionNumber に更新しました。"

# Gitコミットの作成
$CommitMessage = "Bump up to $Version"
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m $CommitMessage
Write-Host "コミットを作成しました: $CommitMessage"

# Gitタグの作成
git tag $Version
Write-Host "タグを作成しました: $Version"

# 次の手順の案内
Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "次のコマンドを実行して変更をリモートにプッシュしてください：" -ForegroundColor Green
Write-Host "git push" -ForegroundColor Yellow
Write-Host "git push --tags" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Green

# 変更を元に戻す方法の案内
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "もし変更をキャンセルする場合は、以下のコマンドを実行してください：" -ForegroundColor Cyan
Write-Host "1. タグを削除するには:" -ForegroundColor Cyan
Write-Host "   git tag -d $Version" -ForegroundColor Yellow
Write-Host "   (リモートにプッシュ済みの場合): git push origin --delete $Version" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. コミットを元に戻すには:" -ForegroundColor Cyan
Write-Host "   git reset --hard HEAD~1" -ForegroundColor Yellow
Write-Host "   (強制プッシュが必要な場合、注意して実行): git push --force" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan

Write-Host "バージョン $Version への更新が完了しました！"
