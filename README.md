# 文字版阿泰爾資料站

公開的靜態玩家資料站。網站有首頁、新手指南、裝備、卷軸、NPC 商店、地圖、怪物、職業及更新紀錄九頁，訪客不需要登入。`dist/` 是 GitHub Pages 發布的內容。

網站資料不包含 Telegram token、角色存檔或玩家個人資料。裝備與卷軸圖鑑是社群資料快照，不代表全部已在台服開放或已在文字版遊戲實作。詳細來源與版本請看網站的「更新紀錄」。

## 更新與發布

修改 `dist/app.js` 或資料後，執行 `node build-pages.mjs`（若修改共用頁首或導覽）、`node --check dist/app.js`、`node check-site.mjs`。每次變動也應更新 `dist/app.js` 的 `changelog()`。

推送到 GitHub 的 `main` 分支會執行 `.github/workflows/pages.yml`，將 `dist/` 發布至 GitHub Pages。首次建立儲存庫時，請在 Settings → Pages 將 Build and deployment 的 Source 設為 **GitHub Actions**。發布網址為 `https://<帳號>.github.io/<儲存庫>/`。

回復舊版可在 Git 中還原先前提交並推送 `main`；GitHub Actions 會重新發布還原後的內容。
