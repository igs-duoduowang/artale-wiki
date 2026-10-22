# 文字版阿泰爾資料站

公開的靜態玩家資料站。網站有首頁、新手指南、裝備、卷軸、NPC 商店、地圖、怪物、職業及更新紀錄九頁，訪客不需要登入。`docs/` 是 GitHub Pages 發布的內容。

網站資料不包含 Telegram token、角色存檔或玩家個人資料。裝備與卷軸圖鑑是社群資料快照，不代表全部已在台服開放或已在文字版遊戲實作。詳細來源與版本請看網站的「更新紀錄」。

## 更新與發布

修改 `docs/app.js` 或資料後，執行 `node build-pages.mjs`（若修改共用頁首或導覽）、`node --check docs/app.js`、`node check-site.mjs`。每次變動也應更新 `docs/app.js` 的 `changelog()`。

GitHub Pages 從 `main` 分支的 `/docs` 目錄發布；首次發布時需將 Pages source 設為該分支與目錄。往後推送 `main` 即更新公開網站。發布網址為 `https://igs-duoduowang.github.io/artale-wiki/`。

回復舊版可在 Git 中還原先前提交並推送 `main`；GitHub Pages 會重新發布還原後的內容。
