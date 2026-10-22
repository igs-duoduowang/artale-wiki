import { writeFileSync } from 'node:fs';

const pages = [
  ['index', '首頁', '文字版阿泰爾的冒險入口'],
  ['guide', '新手指南', '從建立角色到第一次轉職'],
  ['equipment', '裝備圖鑑', '依名稱、部位與等級搜尋裝備'],
  ['scrolls', '卷軸圖鑑', '查看成功率、強化部位與屬性'],
  ['shops', 'NPC 商店', '查詢 NPC 販售裝備與卷軸的資料'],
  ['maps', '地圖', '目前文字版遊戲的地圖與怪物'],
  ['monsters', '怪物', '目前文字版遊戲的怪物資料'],
  ['jobs', '職業', '一轉職業與盜賊二轉分支'],
  ['changelog', '更新紀錄', '資料來源與網站更新歷程']
];
const nav = pages.map(([id, name]) => `<a href="${id}.html" data-nav="${id}">${name}</a>`).join('');
for (const [id, name, description] of pages) {
  const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#182b2a">
  <meta name="description" content="${description}。文字版阿泰爾資料站。">
  <title>${name}｜文字版阿泰爾資料站</title>
  <link rel="icon" href="avatar.png">
  <link rel="stylesheet" href="styles.css">
  <script defer src="app.js"></script>
</head>
<body data-page="${id}">
  <a class="skip" href="#main">跳到主要內容</a>
  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="index.html"><img src="avatar.png" alt="" width="35" height="35"><span>文字版<span class="brand-accent">阿泰爾</span><small>冒險資料站</small></span></a>
      <nav aria-label="主要導覽">${nav}</nav>
    </div>
  </header>
  <main id="main" class="container" tabindex="-1"><div id="app"></div></main>
  <footer class="site-footer"><div class="container"><span>文字版阿泰爾資料站 · 玩家製作的文字遊戲資料</span><span>圖鑑快照不代表台服目前全部可取得 · <a href="changelog.html">資料與更新紀錄</a></span></div></footer>
</body>
</html>\n`;
  writeFileSync(new URL(`./docs/${id}.html`, import.meta.url), html);
}
console.log(`已產生 ${pages.length} 個頁面`);
