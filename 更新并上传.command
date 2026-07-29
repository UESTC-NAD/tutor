#!/bin/bash
# 双击我即可：重建首页 → 提交 → 上传
# （macOS 会用「终端」运行本文件）

# 补一下 PATH，防止双击运行时找不到 node
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

cd "$(dirname "$0")" || exit 1

echo "正在重建首页…"
node build.mjs || { echo "构建失败，已中止。"; echo; read -r -p "按回车键关闭…" _; exit 1; }

if [ -z "$(git status --porcelain)" ]; then
  echo "没有任何改动，无需上传。"
  echo; read -r -p "按回车键关闭…" _
  exit 0
fi

echo
read -r -p "这次改了什么？（直接回车用默认说明）: " msg
[ -z "$msg" ] && msg="更新教辅"

git add -A
git commit -m "$msg"
if git push; then
  echo "已上传，1–2 分钟后刷新页面即可看到。"
else
  echo "上传失败，请检查网络后再试。"
fi

echo
read -r -p "全部完成，按回车键关闭窗口…" _
