#!/bin/bash
cd "$(dirname "$0")" || exit 1

echo "正在重建首页…"
node build.mjs || { echo "构建失败，已中止。"; exit 1; }

if [ -z "$(git status --porcelain)" ]; then
  echo "没有任何改动，无需上传。"
  exit 0
fi

echo
read -r -p "这次改了什么？（直接回车用默认说明）: " msg
[ -z "$msg" ] && msg="更新教辅"

git add -A
git commit -m "$msg"
git push && echo "已上传，1–2 分钟后刷新页面即可看到。"
