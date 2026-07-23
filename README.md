# 狗哥的教辅库

把 AI 生成的教辅 HTML 放到网上，让公式渲染和交互按钮在 iPad 上正常工作。

## 为什么要建这个站

在 iPadOS 的「文件」App 里直接点开 HTML，Safari 走的是 **Quick Look 预览模式，JavaScript 被禁用**。
后果就是：

- 靠 MathJax/KaTeX 实时渲染的公式 → 显示成裸的 `\( ... \)` 代码
- 靠 JS 生成的目录、跳转、折叠按钮 → 根本不出现，或点了没反应

只要改成用 Safari 打开一个真正的 `https://` 网址，这两个问题同时消失。

## 加一份新教辅

1. 把 AI 生成的 HTML 丢进 `lessons/` 文件夹
2. 在本目录运行：

```bash
node build.mjs
```

3. 首页 `index.html` 会自动重建，新教辅出现在最上面（按修改时间排序）
4. 提交并推送，等一两分钟 GitHub Pages 就更新了

### 改标题 / 学科 / 备注

`lessons/manifest.json` 里可以覆盖自动识别的结果：

```json
"第19题详解.html": {
  "title": "第19题 · 翻折 · 详解",
  "subject": "数学",
  "note": "立体几何翻折专题单题精讲"
}
```

改完再跑一次 `node build.mjs`。学科目前支持 `数学` / `化学` / `物理` / `其他`，
想加新学科就在 `build.mjs` 顶部的 `SUBJECTS` 里加一行关键词。

## 关于公式渲染

`assets/mathjax-tex-svg.js` 是**自托管**的 MathJax（SVG 输出版，单文件，不依赖字体文件），
这样国内访问不会因为 CDN 抽风而白屏。

新教辅如果要实时渲染公式，在 `<head>` 里这样引用：

```html
<script>
  MathJax = {
    tex: {inlineMath: [['\\(','\\)']], displayMath: [['\\[','\\]']]},
    svg: {fontCache: 'global'}
  };
</script>
<script defer src="../assets/mathjax-tex-svg.js"></script>
```

注意路径是 `../assets/`，因为教辅文件在 `lessons/` 子目录里。

如果 AI 生成的文件里写的是 `https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js`
之类的 CDN 地址，换成上面这段即可。

## 本地预览

```bash
python -m http.server 8000
```

然后浏览器打开 http://localhost:8000 。

同一个 Wi-Fi 下，iPad 也能用 `http://电脑的局域网IP:8000` 直接访问，
适合临时给弟弟看、还没来得及推送的时候。

## 部署到 GitHub Pages

见 `部署步骤.md`。
