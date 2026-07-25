# 狗哥的教辅库

一个部署在 **GitHub Pages** 上的静态教辅资料站。把整理好的习题详解做成单页 HTML（含 MathJax 公式和少量交互按钮），发布到网上，学生用 iPad / iPhone 的 Safari 打开阅读，可「添加到主屏幕」当 App 用。

- **线上地址**：<https://uestc-nad.github.io/tutor/>
- **仓库**：<https://github.com/uestc-nad/tutor>（Public —— 免费版 Pages 要求公开）
- **结构**：按学生分组，每个学生一个独立入口页，只列出归属于他的教辅（仅靠 URL 区隔，非鉴权）
- **当前规模**：6 份教辅，1 名学生（代号 `s01`）

> 本文档同时作为交接说明：读完应能在不看全部源码的前提下理解结构、约束与工作流。

## 为什么要建这个站

在 iPadOS 的「文件」App 里直接点开 HTML，Safari 走的是 **Quick Look 预览模式，JavaScript 被禁用**，后果是：

- 靠 MathJax/KaTeX 实时渲染的公式 → 显示成裸的 `\( ... \)` 代码
- 靠 JS 生成的目录、跳转、折叠按钮 → 根本不出现，或点了没反应

只要改成用 Safari 打开一个真正的 `https://` 网址，这两个问题同时消失。

## 日常工作流

```bash
cd ~/other/Tutoring/tutor
# 1. 把新的教辅 HTML 拖进 lessons/ 文件夹
# 2. 需要指定归属学生或覆盖标题时，编辑 lessons/manifest.json（见下）
./update.sh
```

`update.sh`（macOS 一键更新）依次完成：运行 `node build.mjs` 重建首页 → 检查是否有实际改动（无改动就提前退出）→ 提示输入提交说明 → `git add -A` → `git commit` → `git push`。推送后 GitHub Pages 约 1–2 分钟完成部署。

只想重建首页、不上传，单独运行即可：

```bash
node build.mjs
```

## 加一份新教辅

把 AI 生成的 HTML 丢进 `lessons/`，跑一次构建就会自动排进首页（新教辅排在最上面）。标题、学科、题量、日期都会自动识别，不满意再用 `manifest.json` 覆盖。

### 覆盖标题 / 学科 / 备注 / 归属

`lessons/manifest.json` 的键是 `lessons/` 下的文件名（含扩展名），四个字段全部可选：

```json
"圆周运动.html": {
  "title": "《圆周运动》",
  "subject": "物理",
  "note": "受力分析专题",
  "student": "s01"
}
```

- 缺省时 `title`/`subject` 自动推断，`note` 为空，`student` 落到 `s01`
- **给非默认学生的教辅必须显式写 `student` 字段**，否则会被归到 `s01`
- 学科目前支持 `数学` / `化学` / `物理` / `其他`；想加新学科，在 `build.mjs` 顶部的 `SUBJECTS` 里加一行关键词

### students.json

学生登记表，键即代号，直接成为 URL 路径段（`s01` → `/tutor/s01/`）：

```json
{
  "s01": {
    "name": "狗哥的教辅库",
    "sub": "公式与交互都能正常使用的在线版本"
  }
}
```

`name` 是页面顶部大标题，`sub` 是副标题（可空）。代号刻意用 `s01`/`s02` 这类无意义标识，避免真实姓名出现在公开 URL 中。

**新增学生**：在 `students.json` 加一条记录，把相应教辅的 `student` 指向新代号，然后 `./update.sh`。

## 关键约束（改动前务必了解）

1. **教辅 HTML 必须平铺在 `lessons/` 下，不能放进子文件夹。** 每份教辅 `<head>` 用 `<script defer src="../assets/mathjax-tex-svg.js">` 引用公式库，文件位于 `lessons/` 时 `../assets/` 正好解析到仓库根的 `assets/`。一旦移进子目录，相对路径断裂，所有公式失效。学生分组因此**不是靠目录**，而是靠 `manifest.json` 的 `student` 字段。
2. **站点完全公开，没有任何访问控制。** `lessons/` 下的文件可被直接猜测访问。生成的页面已加 `<meta name="robots" content="noindex, nofollow">`，但只是对爬虫的请求，非强制。**因此：页面内容中不得出现学生真实姓名、学校、联系方式、成绩等个人信息。**
3. **从 `students.json` 删除学生不会清理目录。** `build.mjs` 只负责生成、不做清理，删学生后需手动 `rm -rf <代号>` 再重新构建（刻意设计，避免误删）。
4. **学生代号一旦发布就不应更改**，否则已发出的链接会 404。
5. **中文文件名**：生成链接时用 `encodeURIComponent()` 编码，涉及路径拼接的改动都要注意。

## 构建脚本 build.mjs 做了什么

执行 `node build.mjs`：扫描 `lessons/*.html` → 逐个提取元数据（标题读 `<title>`；学科按关键词打分，命中 ≥3 次才算；题量统计 `class` 里 `q`/`qno`/`q-num`/`qhead` 标记；特性标签识别公式预渲染/实时渲染/交互按钮；日期取 `git log` 最后提交时间，未提交则回退文件 mtime）→ 按日期倒序 → 为每个学生生成 `<代号>/index.html` → 生成根目录 `index.html` → 终端打印分组报告。

> **日期为什么读 Git 提交时间**：Git 不保存文件时间戳，克隆后所有文件 mtime 都会变成克隆当天。读提交时间可保证在任何机器上结果一致。

**凡「自动生成」的文件（`index.html`、`<代号>/index.html`）都不要手工编辑**，下次构建会被完全覆盖。

## 关于公式渲染

`assets/mathjax-tex-svg.js` 是**自托管**的 MathJax（SVG 输出版，单文件，不依赖字体文件），这样国内访问不会因为 CDN 抽风而白屏。新教辅如需实时渲染公式，在 `<head>` 里这样引用：

```html
<script>
  MathJax = {
    tex: {inlineMath: [['\\(','\\)']], displayMath: [['\\[','\\]']]},
    svg: {fontCache: 'global'}
  };
</script>
<script defer src="../assets/mathjax-tex-svg.js"></script>
```

注意路径是 `../assets/`（教辅在 `lessons/` 子目录里）。如果 AI 生成的文件写的是 `https://cdn.jsdelivr.net/...` 之类 CDN 地址，换成上面这段即可。

## 本地预览

```bash
python3 -m http.server 8000
```

浏览器打开 <http://localhost:8000> 。同一 Wi-Fi 下，iPad 也能用 `http://电脑局域网IP:8000` 直接访问，适合还没推送时临时给学生看。

## 部署（GitHub Pages）

已经配好，日常无需再动：Source = `Deploy from a branch`，Branch = `main`，目录 = `/ (root)`，SSH 推送（`git@github.com:uestc-nad/tutor.git`）。仓库根有 `.nojekyll`，Pages 跳过 Jekyll 处理，原样发布静态文件。第一次访问把网址用 Safari 打开 → 分享 → 添加到主屏幕。

<details>
<summary>常见问题</summary>

- **iPad 上还是旧内容**：Safari 缓存，下拉刷新，或在网址后加 `?v=2` 强制刷新。
- **公式显示成 `\( ... \)` 代码**：那份教辅的 MathJax 引用地址不对，检查 `<head>` 里是不是 `<script defer src="../assets/mathjax-tex-svg.js"></script>`。
- **想让网址短一点**：把仓库名改成 `uestc-nad.github.io`，网址就变成 `https://uestc-nad.github.io/`（不带 `/tutor`），代价是每个账号只能有一个这种仓库。
- **确实需要密码保护**：仓库必须公开才能免费用 Pages。若要访问控制，可迁移到 Cloudflare Pages（免费版支持站点密码）。

</details>

## 与 AI 协作时的注意事项

- 开发环境是 **macOS**，给命令请用 bash / zsh。
- 修改 `build.mjs` 时保持**零外部依赖**：不引入 npm 包，只用 Node 内置模块，任何机器装个 Node 就能跑。
- 生成的 HTML 全部内联样式与脚本，是刻意为之（单文件、离线可用、无请求瀑布），不要拆成外部 `.css` / `.js`。
- 页面主要使用场景是 iPad / iPhone 竖屏 Safari，UI 改动移动端优先（触摸目标 ≥44px、深色模式、`safe-area-inset`）。
