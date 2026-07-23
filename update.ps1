# 教辅站点一键更新：重建首页 -> 提交 -> 推送到 GitHub
# 双击同目录下的 update.bat 即可运行，不用记命令

$SITE_URL = "https://uestc-nad.github.io/tutor/"

function Pause-Exit($code) {
    Write-Host ""
    Read-Host "按回车关闭"
    exit $code
}

try {
    Set-Location $PSScriptRoot

    Write-Host ""
    Write-Host "  教辅站点 · 一键更新" -ForegroundColor Cyan
    Write-Host "  ---------------------------------"
    Write-Host ""

    # 环境检查
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "  找不到 node 命令。" -ForegroundColor Red
        Write-Host "  请先到 https://nodejs.org 安装 Node.js，装完重开本窗口。"
        Pause-Exit 1
    }
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Host "  找不到 git 命令。" -ForegroundColor Red
        Write-Host "  请先到 https://git-scm.com 安装 Git，装完重开本窗口。"
        Pause-Exit 1
    }

    # 1. 重建首页
    Write-Host "[1/4] 扫描 lessons/ 重建首页" -ForegroundColor Yellow
    node build.mjs
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  重建首页失败，上面是错误信息。" -ForegroundColor Red
        Write-Host "  常见原因：某个教辅 HTML 文件损坏或编码不对。"
        Pause-Exit 1
    }

    # 2. 检查改动
    Write-Host ""
    Write-Host "[2/4] 检查有什么变化" -ForegroundColor Yellow
    git add -A
    $changes = git -c core.quotepath=false diff --cached --name-status
    if (-not $changes) {
        Write-Host ""
        Write-Host "  没有任何改动，网站已是最新，不需要更新。" -ForegroundColor Green
        Pause-Exit 0
    }
    foreach ($line in $changes) {
        $mark, $file = $line -split "`t", 2
        $desc = switch ($mark.Substring(0,1)) {
            "A" { "新增" }
            "M" { "修改" }
            "D" { "删除" }
            "R" { "改名" }
            default { $mark }
        }
        Write-Host "   $desc  $file"
    }

    # 3. 提交
    Write-Host ""
    $msg = Read-Host "[3/4] 这次改了什么？(直接回车用默认说明)"
    if ([string]::IsNullOrWhiteSpace($msg)) {
        $msg = "更新教辅 $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    git commit -q -m $msg
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  提交失败，上面是错误信息。" -ForegroundColor Red
        Pause-Exit 1
    }

    # 4. 推送
    Write-Host ""
    Write-Host "[4/4] 上传到 GitHub" -ForegroundColor Yellow
    git push
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  上传失败。" -ForegroundColor Red
        Write-Host "  改动已经存在本地存档里，没有丢失，联网后重新双击本脚本即可。"
        Write-Host "  如果提示登录，按提示用 UESTC-NAD 账号授权一次就好。"
        Pause-Exit 1
    }

    Write-Host ""
    Write-Host "  完成！1~2 分钟后网站生效：" -ForegroundColor Green
    Write-Host "  $SITE_URL" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  iPad 上刷新页面就能看到新内容。"
    Pause-Exit 0
}
catch {
    Write-Host ""
    Write-Host "  出错了：$_" -ForegroundColor Red
    Pause-Exit 1
}
