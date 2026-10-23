const root = document.querySelector('#app');
const page = document.body.dataset.page;
document.querySelector(`[data-nav="${page}"]`)?.setAttribute('aria-current', 'page');

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const number = value => Number(value).toLocaleString('zh-TW');
const level = value => value ? `Lv.${value}` : '無等級限制';
const typeNames = {
  HAT:'帽子',TOP:'上衣',BOTTOM:'褲裙',OVERALL:'套服',SHOES:'鞋子',GLOVES:'手套',CAPE:'披風',SHIELD:'盾牌',
  EARRINGS:'耳環',RING:'戒指',PENDANT:'墜飾',BELT:'腰帶',SHOULDERPAD:'肩飾',MEDAL:'勳章',
  'ONE-HANDED SWORD':'單手劍','TWO-HANDED SWORD':'雙手劍','ONE-HANDED AXE':'單手斧','TWO-HANDED AXE':'雙手斧',
  'ONE-HANDED BLUNT WEAPON':'單手棍','TWO-HANDED BLUNT WEAPON':'雙手棍',SPEAR:'槍',POLEARM:'矛',WAND:'短杖',STAFF:'長杖',
  BOW:'弓',CROSSBOW:'弩',DAGGER:'短劍',CLAW:'拳套',KNUCKLE:'指虎',GUN:'火槍',ARROW:'箭矢',
  'THROWING-STAR':'飛鏢',BULLET:'子彈','EYE ACCESSORY':'眼飾','FACE ACCESSORY':'臉飾',
  sword:'劍',wand:'短杖',bow:'弓',dagger:'短劍',claw:'拳套',knuckle:'指虎',gun:'火槍'
};
const statNames = {str:'STR',dex:'DEX',int:'INT',luk:'LUK',hp:'HP',mp:'MP',atk:'物攻',matk:'魔攻',def:'物防',mdef:'魔防',accuracy:'命中',avoidability:'迴避',speed:'速度',jump:'跳躍',upgradeSlots:'可衝次數'};
const jobNames = {BEGINNER:'初心者',WARRIOR:'劍士',MAGICIAN:'法師',BOWMAN:'弓箭手',THIEF:'盜賊',PIRATE:'海盜'};
const typeName = value => typeNames[value] || value || '未分類';

function head(kicker,title,summary){return `<div class="page-head"><div class="eyebrow">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(summary)}</p></div>`;}
function card(icon,title,description,url){return `<a class="card" href="${url}"><span class="icon" aria-hidden="true">${icon}</span><h3>${esc(title)}</h3><p>${esc(description)}</p></a>`;}
function error(message){root.innerHTML=head('資料讀取','暫時無法顯示',message)+'<p><a href="index.html">回首頁</a></p>';}
async function data(file){const response=await fetch(file);if(!response.ok)throw new Error(`無法讀取 ${file}`);return response.json();}
function stats(values={},requirements=false){return Object.entries(values).filter(([key,val])=>!requirements||Number(val)>0).map(([key,val])=>{
  const amount=typeof val==='object'&&val!==null ? val.middle ?? val.value ?? '?' : val;
  const range=Array.isArray(val?.range)&&val.range[0]!==val.range[1] ? ` (${val.range.join('–')})` : '';
  return `${statNames[key]||key} ${key==='upgradeSlots'||requirements?'':'+'}${amount}${range}`;
}).join(' · ')||'來源未列出';}
function pagination(total,current,onChange){
  const max=Math.max(1,Math.ceil(total/20));
  const bar=document.querySelector('.pagination');if(!bar)return;
  bar.innerHTML=`<button id="previous" ${current<=1?'disabled':''}>← 上一頁</button><span>${current} / ${max} 頁</span><button id="next" ${current>=max?'disabled':''}>下一頁 →</button>`;
  bar.querySelector('#previous').onclick=()=>onChange(current-1);
  bar.querySelector('#next').onclick=()=>onChange(current+1);
}
// 遊戲資料（world.json）；裝備、卷軸、雜物頁用來顯示文字版掉落來源與收購價。
let gameWorld=null;
// 反查文字版裡哪些怪會掉這件物品、掉率，以及那隻怪出現在哪些地圖。
function dropSources(world,id){
  if(!world)return[];
  const mapsOf=monsterId=>Object.values(world.maps).filter(map=>map.monsters.includes(monsterId)).map(map=>map.name);
  return Object.entries(world.monsters).map(([monsterId,monster])=>({monster,chance:(monster.drops||[]).filter(drop=>drop.id===id).reduce((sum,drop)=>sum+drop.chance,0),maps:mapsOf(monsterId)}))
    .filter(entry=>entry.chance>0).sort((a,b)=>b.chance-a.chance||a.monster.level-b.monster.level);
}
function dropTable(world,id){
  const rows=dropSources(world,id);
  return rows.length?`<div class="data-wrap"><table><thead><tr><th>怪物</th><th>等級</th><th>掉率</th><th>出現地圖</th></tr></thead><tbody>${rows.map(row=>`<tr><td><strong>${esc(row.monster.name)}</strong></td><td>${row.monster.level}</td><td>${Math.round(row.chance*1000)/10}%</td><td>${row.maps.length?row.maps.map(esc).join('、'):'尚無地圖'}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">目前文字版沒有怪物會掉這件物品。</p>';
}
const itemPage=(world,id)=>{const slot=world?.items[id]?.slot;return slot==='material'?`materials.html?id=${encodeURIComponent(id)}`:id.startsWith('sc_')?`scrolls.html?id=${encodeURIComponent(id)}`:id.startsWith('eq_')?`equipment.html?id=${encodeURIComponent(id)}`:null;};
function showDetail(item){
  const panel=document.querySelector('#detail');if(!panel)return;
  const gamePrice=gameWorld?.gearPrices?.[item.id];
  const npcs=item.acquisition?.npcs||[];
  const drops=item.acquisition?.monsters||[];
  const quests=item.acquisition?.quests||[];
  const success=item.kind==='scrolls' ? item.name.match(/(10|30|60|70|100)%/)?.[0] : null;
  panel.hidden=false;
  panel.innerHTML=`<button class="close" aria-label="關閉物品詳情">關閉</button><div class="eyebrow">${item.kind==='scrolls'?'卷軸':'裝備'}詳情</div><h2>${esc(item.name)}</h2><p class="muted">${esc(typeName(item.type))} · ${esc(level(item.level))}${success?' · 成功率 '+esc(success):''}</p>
    <div class="detail-grid"><div><small>屬性</small><p>${esc(stats(item.stats))}</p></div><div><small>裝備需求</small><p>${esc(item.requirements?stats(item.requirements,true):'不適用')}</p></div>
    <div><small>職業</small><p>${esc(item.jobs?.map(x=>jobNames[x]||x).join('、')||'來源未列出')}</p></div><div><small>NPC 販售</small><p>${npcs.length?npcs.map(x=>`${esc(x.name)} · ${number(x.price)} 楓幣`).join('<br>'):'來源未列出'}</p></div>
    <div><small>怪物掉落</small><p>${drops.length?drops.map(x=>esc(x.name)).join('、'):'來源未列出'}</p></div><div><small>任務取得</small><p>${quests.length?quests.map(x=>esc(x.name)).join('、'):'來源未列出'}</p></div>
    ${gamePrice?`<div><small>文字版商店售價</small><p>${number(gamePrice[0])} 楓幣${gamePrice[2]?'（圖鑑 NPC 售價）':'（文字版暫定）'}</p></div><div><small>賣給 NPC</small><p>${number(gamePrice[1])} 楓幣（售價一半）</p></div>`:''}</div>
    <h3>文字版哪些怪會掉</h3>${dropTable(gameWorld,item.id)}
    <p class="source-note">「文字版哪些怪會掉」與掉率是 Telegram 文字版的設定，並非 Artale 官方掉率。</p>
    <p class="source-note">這是玩家社群圖鑑資料；本遊戲商店已開放圖鑑裝備與卷軸；特殊屬性仍在逐步接入戰鬥公式。<a href="${item.kind==='scrolls'?'https://www.artalemaplestory.com/zh/scrolls':'https://www.artalemaplestory.com/zh/equipment'}" target="_blank" rel="noopener noreferrer">查看資料來源 ↗</a></p>`;
  panel.querySelector('.close').onclick=()=>{panel.hidden=true;history.replaceState(null,'',location.pathname);};
  history.replaceState(null,'',`?id=${encodeURIComponent(item.id)}`);
  panel.scrollIntoView({behavior:'smooth',block:'start'});
}
function itemCatalog(catalog,kind){
  const list=kind==='equipment'?catalog.equipment:catalog.scrolls;
  const title=kind==='equipment'?'裝備圖鑑':'卷軸圖鑑';
  const source=kind==='equipment'?'https://www.artalemaplestory.com/zh/equipment':'https://www.artalemaplestory.com/zh/scrolls';
  const types=[...new Set(list.map(x=>x.type))].sort((a,b)=>typeName(a).localeCompare(typeName(b),'zh-Hant'));
  root.innerHTML=head('ITEM DATABASE',title,`收錄 ${number(list.length)} 筆玩家社群資料，包含屬性、取得來源與有列出的 NPC 售價。可點名稱查看詳情。`)+
    `<div class="notice">這是資料快照，不保證全部已在台服開放；文字版商店已可購買並使用圖鑑裝備與卷軸；部分特殊屬性仍未套入戰鬥公式。<a href="changelog.html">查看資料說明</a></div>
    <div class="tools"><label class="field">搜尋名稱<input id="query" type="search" placeholder="輸入物品名稱或英文名稱" autocomplete="off"></label><label class="field">部位<select id="type"><option value="">全部部位</option>${types.map(x=>`<option value="${esc(x)}">${esc(typeName(x))}</option>`).join('')}</select></label>
    ${kind==='equipment'?'<label class="field">最高需求等級<select id="level"><option value="">全部等級</option><option value="10">Lv.10 以下</option><option value="30">Lv.30 以下</option><option value="70">Lv.70 以下</option><option value="120">Lv.120 以下</option></select></label>':'<label class="field">成功率<select id="rate"><option value="">全部成功率</option><option>10%</option><option>30%</option><option>60%</option><option>70%</option><option>100%</option></select></label>'}</div>
    <div class="results-meta"><span id="count"></span><a href="${source}" target="_blank" rel="noopener noreferrer">資料來源 ↗</a></div><div class="data-wrap"><table><thead><tr><th>名稱</th><th>部位</th><th>${kind==='equipment'?'等級':'成功率'}</th><th>主要屬性</th><th>NPC 商店</th></tr></thead><tbody id="rows"></tbody></table></div><div class="pagination"></div><section id="detail" class="detail" hidden></section>`;
  const query=root.querySelector('#query'),type=root.querySelector('#type'),extra=root.querySelector(kind==='equipment'?'#level':'#rate');
  let current=1;
  const filtered=()=>list.filter(item=>{
    const q=query.value.trim().toLocaleLowerCase();
    return (!q||item.name.toLocaleLowerCase().includes(q)||item.sourceName.toLocaleLowerCase().includes(q))&&
      (!type.value||item.type===type.value)&&
      (!extra.value||(kind==='equipment'?(item.level||0)<=Number(extra.value):item.name.includes(extra.value)));
  }).sort((a,b)=>(a.level||0)-(b.level||0)||a.name.localeCompare(b.name,'zh-Hant'));
  const render=()=>{
    const rows=filtered();const max=Math.max(1,Math.ceil(rows.length/20));current=Math.min(current,max);
    root.querySelector('#count').textContent=`符合 ${number(rows.length)} 筆 · 顯示第 ${current} 頁`;
    root.querySelector('#rows').innerHTML=rows.length?rows.slice((current-1)*20,current*20).map(item=>`<tr><td><button class="item-link" data-id="${item.id}">${esc(item.name)}</button></td><td><span class="pill">${esc(typeName(item.type))}</span></td><td>${kind==='equipment'?esc(level(item.level)):esc(item.name.match(/(10|30|60|70|100)%/)?.[0]||'—')}</td><td>${esc(stats(item.stats))}</td><td>${item.acquisition.npcs.length?`${item.acquisition.npcs.length} 間`:'—'}</td></tr>`).join(''):'<tr><td colspan="5" class="empty">找不到符合的物品，試試其他名稱或篩選條件。</td></tr>';
    root.querySelectorAll('[data-id]').forEach(button=>button.onclick=()=>showDetail(list.find(item=>item.id===button.dataset.id)));
    pagination(rows.length,current,p=>{current=p;render();window.scrollTo({top:0,behavior:'smooth'});});
  };
  for(const input of [query,type,extra])input.addEventListener(input===query?'input':'change',()=>{current=1;render();});
  render();const id=new URLSearchParams(location.search).get('id');if(id){const item=list.find(x=>x.id===id);if(item)showDetail(item);}
}
function materialsPage(world){
  const list=Object.entries(world.items).filter(([,item])=>item.slot==='material').map(([id,item])=>({id,...item,sources:dropSources(world,id)}))
    .sort((a,b)=>(b.sources.length>0)-(a.sources.length>0)||(a.sources[0]?.monster.level??999)-(b.sources[0]?.monster.level??999)||a.name.localeCompare(b.name,'zh-Hant'));
  root.innerHTML=head('ETC ITEMS','雜物',`怪物掉落的雜物與 NPC 收購價。文字版 v${world.version} 撿到雜物會自動依收購價換成楓幣（可在遊戲「設定」關閉）。`)+
    '<div class="notice">收購價採經典楓之谷 GMS v83 的 NPC 收購價：阿泰爾沒有公開收購價，這是目前最接近的參考，尚待遊戲內核對。任務用品在經典資料中收購價為 1 楓幣，照實採用。掉率是文字版設定，並非 Artale 官方掉率。</div>'+
    `<div class="tools"><label class="field">搜尋雜物<input id="material-query" type="search" placeholder="輸入雜物或怪物名稱"></label><label class="field">範圍<select id="material-scope"><option value="dropped">文字版會掉落</option><option value="">全部 ${list.length} 種</option></select></label></div>
    <div id="detail" class="detail" hidden></div><div class="results-meta"><span id="count"></span></div>
    <div class="data-wrap"><table><thead><tr><th>雜物</th><th>收購價</th><th>哪些怪會掉</th></tr></thead><tbody id="rows"></tbody></table></div>`;
  const query=root.querySelector('#material-query'),scope=root.querySelector('#material-scope');
  const show=item=>{const panel=root.querySelector('#detail');panel.hidden=false;
    panel.innerHTML=`<button class="close" aria-label="關閉雜物詳情">關閉</button><div class="eyebrow">雜物詳情</div><h2>${esc(item.name)}</h2>
      <div class="detail-grid"><div><small>賣給 NPC</small><p>${number(item.sellPrice)} 楓幣</p></div><div><small>價格來源</small><p>${esc(item.priceSource)}</p></div></div>
      <h3>文字版哪些怪會掉</h3>${dropTable(world,item.id)}`;
    panel.querySelector('.close').onclick=()=>{panel.hidden=true;history.replaceState(null,'',location.pathname);};
    history.replaceState(null,'',`?id=${encodeURIComponent(item.id)}`);panel.scrollIntoView({behavior:'smooth',block:'start'});};
  const render=()=>{const q=query.value.trim();const rows=list.filter(item=>(!scope.value||item.sources.length)&&(!q||item.name.includes(q)||item.sources.some(source=>source.monster.name.includes(q))));
    root.querySelector('#count').textContent=`符合 ${number(rows.length)} 種`;
    root.querySelector('#rows').innerHTML=rows.map(item=>`<tr><td><button class="item-link" data-id="${esc(item.id)}">${esc(item.name)}</button></td><td>${number(item.sellPrice)} 楓幣</td><td>${item.sources.length?item.sources.map(source=>`${esc(source.monster.name)} Lv.${source.monster.level} ${Math.round(source.chance*1000)/10}%`).join('<br>'):'<span class="muted">文字版尚未掉落</span>'}</td></tr>`).join('')||'<tr><td colspan="3" class="empty">找不到雜物。</td></tr>';
    root.querySelectorAll('[data-id]').forEach(button=>button.onclick=()=>show(list.find(item=>item.id===button.dataset.id)));};
  query.oninput=render;scope.onchange=render;render();
  const id=new URLSearchParams(location.search).get('id');const target=list.find(item=>item.id===id);if(target){if(!target.sources.length)scope.value='';render();show(target);}
}
function shopsPage(catalog){
  const byId=new Map([...catalog.equipment,...catalog.scrolls].map(x=>[x.id,x]));
  root.innerHTML=head('MERCHANT DIRECTORY','NPC 商店','按 NPC 查詢圖鑑記錄的裝備、卷軸售價；同一件物品可能由多間商店販售。')+
    '<div class="notice">這裡保留來源圖鑑的 NPC 售價資料；Telegram 遊戲已改為單一商店，沒有 NPC 售價的商品會顯示文字版暫定價格。</div><div class="tools"><label class="field">搜尋 NPC<input id="shop-query" type="search" placeholder="例如 山姆、卡爾"></label><label class="field">選擇商店<select id="shop-select"><option value="">請選擇 NPC</option></select></label></div><div class="results-meta" id="shop-meta"></div><div class="data-wrap"><table><thead><tr><th>商品</th><th>類別／部位</th><th>價格</th></tr></thead><tbody id="offers"></tbody></table></div><div class="pagination"></div><section id="detail" class="detail" hidden></section>';
  const query=root.querySelector('#shop-query'),select=root.querySelector('#shop-select'),meta=root.querySelector('#shop-meta');let current=1;
  const fill=()=>{const term=query.value.trim().toLocaleLowerCase();const matching=catalog.shops.filter(x=>x.name.toLocaleLowerCase().includes(term));select.innerHTML='<option value="">請選擇 NPC</option>'+matching.map(shop=>`<option value="${shop.id}">${esc(shop.name)} · ${shop.offers.length} 件</option>`).join('');if(!matching.some(x=>x.id===select.value))select.value=matching.length===1?matching[0].id:'';meta.textContent=`${matching.length} 間符合的 NPC 商店`;render();};
  const render=()=>{const shop=catalog.shops.find(x=>x.id===select.value);const offers=shop?[...shop.offers].sort((a,b)=>a.price-b.price):[];const max=Math.max(1,Math.ceil(offers.length/20));current=Math.min(current,max);
    meta.textContent=shop?`${shop.name} · ${number(offers.length)} 件商品`:`${catalog.shops.length} 間有售價資料的 NPC 商店`;
    root.querySelector('#offers').innerHTML=shop?offers.slice((current-1)*20,current*20).map(offer=>{const item=byId.get(offer.itemId);return `<tr><td><button class="item-link" data-id="${item.id}">${esc(item.name)}</button></td><td>${esc(typeName(item.type))}</td><td>${number(offer.price)} 楓幣</td></tr>`;}).join(''):'<tr><td colspan="3" class="empty">選擇 NPC 後顯示販售商品。</td></tr>';
    root.querySelectorAll('[data-id]').forEach(button=>button.onclick=()=>showDetail(byId.get(button.dataset.id)));
    pagination(offers.length,current,p=>{current=p;render();});
    if(shop)history.replaceState(null,'',`?npc=${encodeURIComponent(shop.id)}`);
  };
  query.oninput=()=>{current=1;fill();};select.onchange=()=>{current=1;render();};fill();
  const npc=new URLSearchParams(location.search).get('npc');if(npc&&catalog.shops.some(x=>x.id===npc)){select.value=npc;render();}
}
function home(world){const version=world?.version;const materials=world?Object.values(world.items).filter(item=>item.slot==='material').length:0;root.innerHTML=`<section class="hero"><div class="hero-content"><div class="eyebrow">TEXT ADVENTURE · GAME WIKI${version?` · 遊戲 v${esc(version)}`:''}</div><h1>每一次冒險，<br>都有資料可查。</h1><p>文字版阿泰爾的裝備、卷軸、雜物收購價、NPC 商店與世界資訊，整理成適合手機查閱的冒險資料站。</p><div class="hero-actions"><a class="btn btn-primary" href="equipment.html">查裝備圖鑑 →</a><a class="btn btn-secondary" href="guide.html">閱讀新手指南</a>${version?`<a class="btn btn-secondary" href="changelog.html#v${esc(version.replace(/\./g,'-'))}">v${esc(version)} 更新內容</a>`:''}</div></div></section>
  <section class="stats-strip" aria-label="資料總覽"><div class="stat-box"><strong>1,840</strong><span>裝備資料</span></div><div class="stat-box"><strong>274</strong><span>卷軸資料</span></div><div class="stat-box"><strong>${world?number(materials):'—'}</strong><span>雜物與收購價</span></div><div class="stat-box"><strong>${world?number(Object.keys(world.maps).length):'168'}</strong><span>目前文字版地圖</span></div></section>
  <section class="section"><div class="section-head"><div><div class="eyebrow">EXPLORE</div><h2>冒險資料</h2></div><p>從一件裝備，查到它的屬性與取得來源。</p></div><div class="grid">
  ${card('🛡️','裝備圖鑑','依部位、等級與名稱尋找武器防具，查看能力和來源。','equipment.html')}
  ${card('📜','卷軸圖鑑','查強化部位、成功率、屬性與來源。','scrolls.html')}
  ${card('💰','雜物','查雜物的 NPC 收購價、哪些怪會掉與掉率。','materials.html')}
  ${card('🏪','NPC 商店','依 NPC 查裝備與卷軸的資料庫售價。','shops.html')}
  ${card('🗺️','地圖','查看已開放地圖、進入等級與怪物組成。','maps.html')}
  ${card('👾','怪物','了解目前文字版怪物的等級、經驗與掉落。','monsters.html')}
  ${card('🌟','職業','查看目前可選的一轉職業與裝備方向。','jobs.html')}
  ${card('📅','開發路線','從第一代完整體驗到四轉，查看每版功能與驗收目標。','roadmap.html')}</div></section>
  <section class="notice"><strong>資料範圍：</strong>圖鑑採公開玩家社群資料快照；地圖、怪物、職業採目前 Telegram 文字版遊戲資料。圖鑑裝備及卷軸已接入 Telegram 單一商店；部分特殊屬性仍未加入戰鬥公式。<a href="changelog.html">查看更新紀錄與來源 →</a></section>`;}
function guide(){root.innerHTML=head('START HERE','新手指南','進入野外後自動狩獵；機器人每分鐘在背景結算，不必按更新。')+
  `<div class="steps"><div class="step"><b>1</b><h3>建立角色</h3><p>開啟機器人並按「開始冒險」，確認初始能力。角色在有怪物的地圖自動練功。</p></div><div class="step"><b>2</b><h3>換圖與收集</h3><p>按「地圖」選大區、城鎮與詳細地圖，也可直接選城鎮；按「推薦練功地圖」可依當前武器、技能、經驗與補給估算適合的練功點。角色頁可按「下次升級預覽」查看自動配點結果。地圖都可自由前往，建議等級只供參考。打開面板可查看經驗、楓幣、材料、裝備與卷軸掉落。</p></div><div class="step"><b>3</b><h3>轉職與培養</h3><p>法師 Lv.8、其他職業 Lv.10 到級時顯示轉職選擇；一轉後先選未來二轉培養方向。</p></div></div>
  <div class="prose section"><h2>自動設定</h2><p>能力值與技能配點、掛機選招預設開啟。可用「設定」各別關閉，改在角色頁手動配點；設定也能暫停或恢復自動狩獵。舊角色已花掉的點數不會被改寫。</p><h2>掉落與強化</h2><p>初期普通怪會獨立擲出材料、裝備與卷軸。圖鑑裝備可依職業及能力需求穿戴，對應卷軸可用於已裝備的道具；成功與失敗都消耗一次強化次數。掉落機率是文字版暫定值，尚非 Artale 官方機率。</p><h2>野王與社群</h2><p>主畫面不顯示即時野王位置。只有在野外實際遇到，才會發現野王。遊戲社群管理員可在群組叫出機器人面板，再按按鈕開啟或關閉野王目擊通報。</p><h2>打怪速度與背景結算</h2><p>每隻怪＝找怪 12 秒＋出手次數×每下時間（依武器攻速 1.2～1.8 秒），越快打倒每小時擊倒越多，所以變強、換好武器就會練得更快。機器人開著時每分鐘在背景結算，不必按「更新」；機器人停機期間，重開後最多補算 8 小時。</p><h2>私訊通知</h2><p>可以轉職、狩獵停止、打到裝備或卷軸、遇到野王、每升 5 級時，機器人會私訊你，附「打開面板」按鈕。同一分鐘的事件合併成一則，可在「設定」逐項關閉。</p><h2>雜物與賣裝備</h2><p>雜物撿到就依 NPC 收購價換成楓幣，計入狩獵淨收入；可在「設定」關閉。收購價見<a href="materials.html">雜物頁</a>。裝備可在物品詳情以售價一半賣出，裝備頁也能一鍵賣出職業永遠穿不了、沒衝過卷軸的裝備，賣前會列清單確認。</p><h2>群組公告</h2><p>群組管理員在遊戲群組傳 /community_panel 開啟後，群組會收到野王目擊通知，以及玩家轉職、打到卷軸、擊敗野王的公告。</p><h2>按鈕操作</h2><p>主面板提供更新、地圖、角色、背包、商店、圖鑑與設定；其餘操作會在各頁按鈕中出現。「說明」頁有目前版本、本站與<a href="changelog.html">更新紀錄</a>的連結。</p><h2>目前開放範圍</h2><p>楓之島 21 張、維多利亞島 147 張地圖；五種一轉入口，二轉僅盜賊的刺客與俠盜。其餘技能、地圖、完整裝備與正式數值仍在<a href="roadmap.html">開發路線</a>中。</p></div>`;}
function mapsPage(world){const entries=Object.entries(world.maps),regions=world.regions||[{id:'island',name:'楓之島',districts:[]},{id:'victoria',name:'維多利亞島',districts:[]}],regionName=id=>regions.find(r=>r.id===id)?.name||id,mapName=id=>world.maps[id]?.name||id,ships=world.ships||[];
  const shipOf=(a,b)=>ships.find(s=>s.docks&&s.docks.includes(mapName(a))&&s.docks.includes(mapName(b))),routeText=route=>route.map((id,i)=>{const s=i&&shipOf(route[i-1],id);return (s?`<span class="pill">🚢 ${esc(s.name)}${s.price?` · ${s.price.toLocaleString('en-US')} 楓幣`:''}</span> → `:'')+esc(mapName(id));}).join(' → ');
  const featured=world.featuredRoute?`<div class="notice"><strong>原作路線：楓之島 → 天空之城（${world.featuredRoute.length-1} 段）</strong><br>${routeText(world.featuredRoute)}</div>`:'';
  const fares=ships.filter(s=>s.price).map(s=>`${esc(s.name)} ${s.price.toLocaleString('en-US')} 楓幣`).join('、');
  root.innerHTML=head('WORLD ATLAS','地圖','目前 Telegram 文字版遊戲的地圖。點區域可縮小範圍；名稱與怪物組成以遊戲資料為準。')+
  `<div class="notice">所有地圖可自由前往；等級只是建議。跨島不用等船、直接到達，只收船票（原作每 10 分鐘一班，票價照經典楓之谷）${fares?`：${fares}`:''}。下方「原作路線」照經典楓之谷 v83 的傳送點，從所屬城鎮的主城算起，只供參考。</div>${featured}<div class="tools"><label class="field">區域<select id="region"><option value="">全部區域</option>${regions.map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select></label><label class="field">城鎮<select id="district"><option value="">全部城鎮</option>${regions.flatMap(r=>r.districts.map(d=>`<option value="${d.id}" data-region="${r.id}">${esc(d.name)}</option>`)).join('')}</select></label><label class="field">搜尋地圖<input id="map-query" type="search" placeholder="輸入地圖或怪物名稱"></label></div><div class="list-cards" id="map-list"></div>`;
  const render=()=>{const reg=root.querySelector('#region').value,district=root.querySelector('#district').value,q=root.querySelector('#map-query').value.trim();root.querySelector('#map-list').innerHTML=entries.filter(([,map])=>(!reg||map.region===reg)&&(!district||map.district===district)&&(!q||map.name.includes(q)||map.monsters.some(id=>world.monsters[id]?.name.includes(q)))).map(([,map])=>`<article class="list-card"><span class="pill">${esc(regionName(map.region))}</span><h3>${esc(map.name)}</h3><p>建議等級 ${esc(level(map.minLevel))} · ${map.monsters.length?map.monsters.map(id=>esc(world.monsters[id]?.name||id)).join('、'):'安全區'}${map.fieldBoss?' · 👑 '+esc(world.fieldBosses[map.fieldBoss]?.name):''}</p>${map.shops?`<p>🏪 ${map.shops.map(n=>`${esc(n.type)}：${esc(n.name)}${n.place?`（${esc(n.place)}）`:''}`).join('、')}</p>`:''}${map.route?`<p class="muted">🧭 原作路線：${routeText(map.route)}</p>`:''}</article>`).join('')||'<p class="muted">找不到符合的地圖。</p>';};root.querySelector('#region').onchange=()=>{root.querySelector('#district').value='';render();};root.querySelector('#district').onchange=()=>{const option=root.querySelector('#district').selectedOptions[0];if(option?.dataset.region)root.querySelector('#region').value=option.dataset.region;render();};root.querySelector('#map-query').oninput=render;render();}
function monstersPage(world){const entries=Object.entries(world.monsters).sort((a,b)=>a[1].level-b[1].level);root.innerHTML=head('BESTIARY','怪物','目前文字版遊戲已放入的普通怪物。數值含試作設定，與阿泰爾正式版不一定一致。')+
  '<div class="notice">裝備與卷軸的掉落來源對照玩家圖鑑；下列掉率是文字版暫定值，並非 Artale 官方掉率。</div><div class="tools"><label class="field">搜尋怪物<input id="monster-query" type="search" placeholder="輸入怪物或掉落名稱"></label></div><div class="data-wrap"><table><thead><tr><th>怪物</th><th>等級</th><th>HP</th><th>EXP</th><th>文字版掉落池</th></tr></thead><tbody id="monster-rows"></tbody></table></div>';
  const drops=monster=>(monster.drops||[]).map(drop=>`${world.items[drop.id]?.name||drop.id} ${Math.round(drop.chance*1000)/10}%`);
  const dropLinks=monster=>(monster.drops||[]).map(drop=>{const label=esc(`${world.items[drop.id]?.name||drop.id} ${Math.round(drop.chance*1000)/10}%`);const url=itemPage(world,drop.id);return url?`<a href="${url}">${label}</a>`:label;});
  const render=()=>{const q=root.querySelector('#monster-query').value.trim();root.querySelector('#monster-rows').innerHTML=entries.filter(([,m])=>!q||m.name.includes(q)||drops(m).some(name=>name.includes(q))).map(([,m])=>`<tr><td><strong>${esc(m.name)}</strong></td><td>${m.level}</td><td>${number(m.hp)}</td><td>${number(m.exp)}</td><td>${dropLinks(m).join('<br>')||'未列出'}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">找不到怪物。</td></tr>';};root.querySelector('#monster-query').oninput=render;render();}
function skillNotes(world,skill){const mp=skill.kind==='support'?`<br>MP：Lv.1 ${skill.firstMp}／Lv.${skill.maxLevel} ${skill.maxMp}`:'';const prerequisites=Object.entries(skill.prerequisite||{}).map(([id,level])=>`${esc(world.skills.find(entry=>entry.id===id)?.name||id)} Lv.${level}`).join('、');return mp+(prerequisites?`<br>前置：${prerequisites}`:'');}
function jobsPage(world){const descriptions={beginner:'從楓之島出發的初心者。',warrior:'近戰武器與較高的升級 HP。',magician:'使用短杖，以 INT 為主要能力。',bowman:'使用弓，以 DEX 為主要能力。',thief:'使用短劍或拳套，以 LUK 為主要能力。',assassin:'盜賊 Lv.30 二轉；拳套與飛鏢路線。',bandit:'盜賊 Lv.30 二轉；短刀與近戰路線。',pirate:'使用指虎或火槍。'};root.innerHTML=head('CLASS GUIDE','職業','目前開放五種第一次轉職，以及盜賊的刺客與俠盜二轉。')+
  `<div class="notice">升級獲得 5 AP；首次轉職取得一轉 SP，盜賊 Lv.30 二轉取得獨立的二轉 SP。一轉技能與未用 SP 會保留。用 Telegram 的「能力值」和「技能」按鈕配點。技能數值為文字版戰鬥換算，並非 Artale 正式公式。</div><div class="grid">${Object.entries(world.jobs).map(([id,job])=>`<article class="card"><span class="icon">${({beginner:'🍁',warrior:'⚔️',magician:'✨',bowman:'🏹',thief:'🗡️',assassin:'🥷',bandit:'🗡️',pirate:'⚓'})[id]}</span><h3>${esc(job.name)}</h3><p>${esc(descriptions[id])}<br>轉職需求：${id==='beginner'?'初始職業':job.tier===2?'盜賊 Lv.30':id==='magician'?'Lv.8':'Lv.10'}<br>可用武器：${esc(job.weapon.map(typeName).join('、'))}</p>${(world.skills||[]).filter(skill=>skill.job===id||(job.tier===2&&skill.job==='thief2')).map(skill=>skill.kind?`<p><strong>${esc(skill.name)}</strong> · ${skill.kind==='passive'?'被動':'輔助'} · Lv.${skill.maxLevel}<br>${esc(skill.description)}${skillNotes(world,skill)}</p>`:`<p><strong>${esc(skill.name)}</strong> · ${esc(skill.weapons.map(typeName).join('、'))}<br>Lv.1：${skill.hits} 段 × ${skill.firstPercent}%／MP ${skill.firstMp}${skill.firstHp?`／HP ${skill.firstHp}`:''}<br>Lv.${skill.maxLevel}：${skill.hits} 段 × ${skill.maxPercent}%／MP ${skill.maxMp}${skill.maxHp?`／HP ${skill.maxHp}`:''}${skill.description?`<br>${esc(skill.description)}`:''}${skillNotes(world,skill)}</p>`).join('')}${job.tier===2?'<p>一轉盜賊技能也可繼續使用。</p>':''}</article>`).join('')}</div><p class="source-note">技能名稱參考 Artale 玩家資料；本網站數值取自目前 Telegram 文字版程式，技能前置、傷害與 MP 為文字版換算。</p>`;}
function roadmapPage(plan){root.innerHTML=head('DEVELOPMENT ROADMAP','開發路線','對照阿泰爾台服：先做能力值與戰鬥公式，補齊一轉、裝備卷軸、介面與世界，再逐代開放二轉、三轉、四轉。')+
  `<div class="notice"><strong>發布狀態：</strong>${esc(plan.status)}<br>本站的「第一代」指此文字版的一轉完整體驗；Artale 官方已有四轉，本頁不代表官方排程。</div>
  <section class="section"><div class="section-head"><div><div class="eyebrow">NOW</div><h2>目前做到哪裡</h2></div></div><ul class="roadmap-list">${plan.current.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>
  <section class="section"><div class="section-head"><div><div class="eyebrow">RULES</div><h2>開發原則</h2></div></div><ul class="roadmap-list">${plan.principles.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>
  <div class="section-head"><div><div class="eyebrow">MILESTONES</div><h2>版本清單</h2></div><p>先把 0.3～1.0 做完，讓玩家好好體驗一轉；之後依序開放各職系二轉。</p></div>
  <div class="roadmap-phases">${plan.phases.map(phase=>`<article class="roadmap-phase" id="v${esc(phase.id.replace('.','-'))}"><div class="roadmap-phase-head"><span class="roadmap-version">${esc(phase.id)}</span><div><span class="pill">${esc(phase.state)}</span><h2>${esc(phase.name)}</h2><p>${esc(phase.goal)}</p></div></div><h3>需要新增</h3><ul>${phase.features.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h3>完成條件</h3><ul>${phase.acceptance.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article>`).join('')}</div>
  <section class="section"><div class="section-head"><div><div class="eyebrow">RELEASE NOTES</div><h2>每次更新怎麼公告</h2></div></div><ul class="roadmap-list">${plan.releasePolicy.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p><a href="changelog.html">查看已發布的更新紀錄 →</a></p></section>
  <p class="source-note">本路線於 ${esc(plan.updated)} 擬定，依目前遊戲程式與 ${plan.sources.map(source=>`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.name)}</a>`).join('、')}整理。尚未查核的數值不視為官方數值。</p>`;}
function gameChangelog(versions){
  const icons={'新增':'🆕','調整':'🔧','Bug 修正':'🐞','體驗優化':'✨'};
  return `<section class="section"><div class="section-head"><div><div class="eyebrow">GAME RELEASES</div><h2>遊戲版本</h2></div><p>Telegram 文字版的改版內容，遊戲「說明」頁標示目前版本。</p></div><div class="timeline">${versions.map(version=>`<article id="v${esc(version.version.replace(/\./g,'-'))}"><time>v${esc(version.version)} · ${esc(version.date)}</time><h2>${esc(version.title)}</h2>${Object.entries(version.sections).filter(([,lines])=>lines.length).map(([name,lines])=>`<h3>${icons[name]||''} ${esc(name)}</h3><ul>${lines.map(line=>`<li>${esc(line)}</li>`).join('')}</ul>`).join('')}</article>`).join('')}</div></section><div class="section-head"><div><div class="eyebrow">SITE HISTORY</div><h2>資料站紀錄</h2></div></div>`;
}
function changelog(versions=[]){root.innerHTML=head('VERSION HISTORY','更新紀錄','遊戲改版與資料站的改動記錄。每次新增來源或修正資料，都會標明範圍與時間。')+(versions.length?gameChangelog(versions):'')+
  `<div class="timeline"><article><time>2026-10-23 · 開發路線改版</time><h2>對照阿泰爾台服重排版本順序</h2><p>依阿泰爾台服 2026-10-20 版逐項對照能力值、傷害與命中公式、一轉與全部二轉技能、卷軸規則、裝備欄與社交系統，<a href="roadmap.html">開發路線</a>改為 0.3～4.0 共 15 個版本：先做能力值與戰鬥公式，再補一轉、裝備卷軸、介面與世界，之後依序開放各職系二轉。查不到阿泰爾數值時標示「經典楓之谷，阿泰爾未證實」。這次只更新規劃，沒有變更遊戲功能。</p></article><article><time>2026-10-23 · 遊戲 v0.2.0 同步</time><h2>雜物頁、掉落來源與遊戲版本紀錄</h2><p>新增<a href="materials.html">雜物頁</a>，列出 NPC 收購價（經典楓之谷 v83 參考價）與哪些怪會掉。裝備與卷軸詳情加入文字版掉落怪物、掉率、出現地圖，以及文字版商店售價與收購價；怪物頁的掉落可直接點進物品。更新紀錄頁改為先列遊戲版本。網站資料改為遊戲改版後自動同步。</p></article><article><time>2026-10-23 · 劍士一轉技能補強</time><h2>回血、最大 HP 與防禦技能接入掛機</h2><p>劍士新增生命淨化、生命擴展、生命恢復、自身強化與劍氣縱橫，配點、前置、MP／HP 消耗和掛機效果均已接入；自動配點先學魔天一擊，再學生命淨化與生命擴展。角色頁也能按「下次升級預覽」，在不花點數的情況下查看下一級 AP／SP、能力與技能變化。劍氣縱橫目前仍是單怪回合攻擊，群攻目標尚未實作。技能名稱與類型參照 <a href="https://www.artalemaplestory.com/en/characters/hero" target="_blank" rel="noopener noreferrer">Artale 玩家圖鑑</a>，數值為文字版換算，並非官方公式。其餘一轉職業仍待補齊，1.0 尚未完成。</p></article><article><time>2026-10-23 · 練功地圖推薦</time><h2>按角色現況挑選較快的練功點</h2><p>主面板與世界地圖新增「推薦練功地圖」按鈕，依現有武器、已學技能、怪物經驗與血量及補給估算每小時經驗，排除預估反擊致命或補給花費超過怪物楓幣與雜物收入的地圖。推薦清單可直接按鈕前往；估算基於每隻怪＝找怪 12 秒＋出手次數×每下時間（依武器攻速）的規則，實際結果會隨升級與隨機事件變動，不包含野王及掉落收益。</p></article><article><time>2026-10-23 · 地圖按鈕改版</time><h2>自由前往地圖，依城鎮逐層挑選</h2><p>應玩家要求取消所有地圖入場等級限制，等級僅保留為建議；地圖頁先選楓之島或維多利亞島，再選維多利亞港、弓箭手村、魔法森林、勇士之村、墮落城市等地區與詳細地圖。世界地圖也可直接按城鎮。日常遊戲使用按鈕，不需要輸入指令；原作的傳送點與隱藏入口仍待還原。</p></article><article><time>2026-10-23 · 地圖門檻修正</time><h2>混合等級地圖按最高普通怪設定入場</h2><p>石人寺院等地圖同時有低等與高等怪，先前只看最低等怪會讓角色過早進入。文字版現在以最高普通怪等級減五作為暫定門檻，野王不計入；安全區保持開放。此暫定入場限制已在後續地圖按鈕改版取消。</p></article><article><time>2026-10-23 · 地圖搜尋</time><h2>可依地圖與怪物名稱找練功地點</h2><p>此版曾加入文字搜尋，顯示地圖、怪物與前往按鈕；後續改為不需輸入指令的大區與城鎮按鈕選單。</p></article><article><time>2026-10-23 · 維多利亞島地圖擴充</time><h2>收錄社群圖鑑的 140 張維多利亞島地圖</h2><p>遊戲現有楓之島 21 張、維多利亞島 147 張地圖；後者包含圖鑑 140 張和保留的既有試作地圖。新增 32 種普通怪、110 種材料及可追溯的裝備卷軸掉落。地圖出沒名單、怪物 HP／EXP／楓幣來自玩家社群圖鑑；攻擊、入場等級、售價和掉率是文字版暫定。傳送路線、隱藏入口、NPC、更多野王和長時間經濟測試仍未完成；1.0 尚未正式發布。</p></article><article><time>2026-10-23 · 地圖與商店</time><h2>新增維多利亞島練功地圖，整合單一商店</h2><p>維多利亞島由 4 張擴為 29 張，包含五座城市與周邊練功地圖；新怪加入材料及裝備掉落。Telegram 商店改為單一入口，可按品類、職業篩選及翻頁；1,840 件圖鑑裝備與 274 張卷軸均可購買，商品頁顯示能力、穿戴需求及價格來源。沒有 NPC 售價的商品採文字版暫定價格。地圖尚未補齊社群圖鑑全部 140 張，部分特殊裝備屬性也尚未套用戰鬥公式。</p></article><article><time>2026-10-23 · 初心者培養方向</time><h2>初心者不再預設加 STR</h2><p>確認創角後可先選預定一轉與二轉培養方向；未選之前累積 AP 會保留。選定後才依方向自動配點，一轉時再次確認二轉方向。舊版初心者若存檔數值完整吻合每級固定加 3 STR 的紀錄，會退還為可用 AP；不符合的舊存檔不自動改動。</p></article><article><time>2026-10-23 · 重骰能力顯示</time><h2>重骰前後顯示角色總能力</h2><p>使用初始能力重設券時，預覽會同時列出目前總能力與套用後總能力；確認後明列每項能力的前後數值。重設券只替換初始能力，不重置已分配的升級 AP；選擇培養方向後，自動配點可能另外改變總能力。</p></article><article><time>2026-10-23 · 玩家資料保護</time><h2>啟動前保留玩家資料，避免多開覆寫</h2><p>機器人每次啟動前會在本機保留玩家資料與 Telegram 更新序號的備份；同一份資料檔只允許一個機器人執行，避免兩個程序交錯存檔。備份不會公開到網站。自動還原、異機遷移與完整回滾演練仍未完成。</p></article><article><time>2026-10-23 · 遠程彈藥修正</time><h2>飛鏢、箭矢與子彈改為持有後持續使用</h2><p>依<a href="https://artale.live/tw/news/nwsd3a3482b9a2e0c8ccc76cc69e05" target="_blank" rel="noopener noreferrer">Artale 官方特色說明</a>，遠程彈藥在背包持有一件即可持續使用，不再每次攻擊扣數量。文字版已修正雙飛斬、弓與手槍攻擊及自動購買，新增三件基礎彈藥商店品項；售價仍屬文字版試作。</p></article><article><time>2026-10-23 · 穩定性修正</time><h2>避免重新處理同一筆指令</h2><p>角色變更與 Telegram 更新序號現在一起寫入存檔；若機器人在回覆前重啟，已處理的購買、配點等指令不會再次入帳。若沒有收到回覆，可按「更新」查看實際結果。後續已加入單一程序保護；完整還原流程仍待驗收。</p></article><article><time>2026-10-23 · 第一代測試版</time><h2>自動練功與初期裝備掉落</h2><p>主畫面改為進入野外自動狩獵，新增預設開啟的 AP／SP 自動配點與選招設定、一轉後的二轉培養方向，以及武器提醒。舊角色若尚未選方向，面板會顯示原因與選擇按鈕，未使用點數會保留。10 種普通怪加入多項掉落池：材料、與玩家圖鑑來源相符的 9 件裝備及 9 張卷軸；相關機率為文字版暫定。野王即時情報按鈕移除，社群管理員可開啟目擊通報。完整一轉技能與地區尚在路線圖中。</p></article></div>`+
  `<div class="timeline"><article><time>2026-10-23 · 規劃公告</time><h2>第一代至四轉的開發路線</h2><p>新增<a href="roadmap.html">開發路線頁</a>，明列目前未完成項目、0.1～1.0 第一代整修、二轉、三轉、四轉的功能與驗收條件。這次只發布規劃，沒有變更 Telegram 遊戲功能或掉落。</p></article></div>`+
  `<div class="timeline"><article><time>2026-10-23 · GitHub 公開版</time><h2>資料站發布與技能資訊修整</h2><p>資料站已改由 GitHub Pages 公開發布，訪客無需登入。職業頁顯示刺客與俠盜技能的中文武器名稱、輔助技能 MP 與技能前置條件。</p></article><article><time>2026-10-22 · 盜賊二轉</time><h2>刺客與俠盜技能開放</h2><p>盜賊 Lv.30 可選刺客或俠盜，新增各分支四項技能與共用兩項技能。二轉 SP 獨立、一轉技能保留；掛機與野王戰鬥加入二轉攻擊、被動及輔助效果。傷害、MP、前置和妙手術額外楓幣皆為文字版換算。</p></article><article><time>2026-10-22 · 盜賊技能</time><h2>補齊盜賊一轉六項技能</h2><p>新增幻化術、鷹之眼、詛咒術、隱身術、雙飛斬；劈空斬保留。被動、輔助與攻擊分別作用於戰鬥，雙飛斬使用拳套和飛鏢。文字版倍率、MP、飛鏢補貨與效果並非正式阿泰爾公式。</p></article><article><time>2026-10-22 · 創角與補償</time><h2>加入創角骰點與舊角色重設券</h2><p>新角色可反覆骰四項初始能力，總計 25 點、每項至少 4 點，確認後開始遊戲。更新前已建立的角色各獲得一張初始能力重設券，可預覽、重骰與取消；確認才消耗券，只替換初始能力，升級後已分配的 AP 保留。</p></article><article><time>2026-10-22 · 角色成長</time><h2>加入能力值與首批實戰技能</h2><p>新增 AP／SP 配點、MP、藍水和五種一轉職業的首批攻擊技能；掛機與野王會依選用技能計算傷害與 MP 消耗。舊角色已自動加過的主能力值保留，只補可用點數。技能倍率、MP 與藍水價格為文字版試作值，非正式版阿泰爾公式。</p></article><article><time>2026-10-22 · 網站首版</time><h2>冒險資料站建立</h2><p>參考文字 RO 資料站的分類瀏覽方式，新增首頁、新手指南、裝備、卷軸、NPC 商店、地圖、怪物與職業頁。網站資料與 Telegram 角色存檔分離，不顯示個人帳號資料。</p></article>
  <article><time>2026-10-22 · 圖鑑快照</time><h2>匯入裝備、卷軸和商店</h2><p>從 <a href="https://www.artalemaplestory.com/zh/equipment" target="_blank" rel="noopener noreferrer">ArtaleMapleStory.com 裝備圖鑑</a>與<a href="https://www.artalemaplestory.com/zh/scrolls" target="_blank" rel="noopener noreferrer">卷軸圖鑑</a>的公開資料模組擷取 1,840 件裝備、274 張卷軸、47 間有明列售價的 NPC 商店。來源網頁列表顯示 1,733 件裝備，與資料模組筆數不同；尚未逐筆確認額外項目是否在台灣服開放。掉率未匯入，也沒有把圖鑑商品誤標為本遊戲可購買。</p></article>
  <article><time>2026-10-22 · 遊戲資料</time><h2>加入現行文字版世界資訊</h2><p>地圖 25 張、普通怪物 10 種、初心者與五種一轉職業，取自本機文字版遊戲程式。怪物攻擊、掉率與部分經濟數值為試作值，會隨遊戲更新再校準。</p></article></div>`;}

(async()=>{try{if(page==='index')home(await data('world.json').catch(()=>null));else if(page==='guide')guide();else if(page==='changelog')changelog(await data('game-changelog.json').catch(()=>[]));else if(page==='roadmap')roadmapPage(await data('roadmap.json'));else if(page==='equipment'||page==='scrolls'||page==='shops'){const [catalog,world]=await Promise.all([data('catalog.json'),data('world.json').catch(()=>null)]);gameWorld=world;if(page==='shops')shopsPage(catalog);else itemCatalog(catalog,page);}else if(page==='maps'||page==='monsters'||page==='jobs'||page==='materials'){const world=await data('world.json');gameWorld=world;({maps:mapsPage,monsters:monstersPage,jobs:jobsPage,materials:materialsPage})[page](world);}else error('找不到這個頁面。');}catch(err){console.error(err);error('資料載入失敗，請重新整理或稍後再試。');}})();
