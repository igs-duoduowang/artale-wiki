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
  sword:'劍',wand:'短杖',bow:'弓',dagger:'短劍',knuckle:'指虎',gun:'火槍'
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
function showDetail(item){
  const panel=document.querySelector('#detail');if(!panel)return;
  const npcs=item.acquisition?.npcs||[];
  const drops=item.acquisition?.monsters||[];
  const quests=item.acquisition?.quests||[];
  const success=item.kind==='scrolls' ? item.name.match(/(10|30|60|70|100)%/)?.[0] : null;
  panel.hidden=false;
  panel.innerHTML=`<button class="close" aria-label="關閉物品詳情">關閉</button><div class="eyebrow">${item.kind==='scrolls'?'卷軸':'裝備'}詳情</div><h2>${esc(item.name)}</h2><p class="muted">${esc(typeName(item.type))} · ${esc(level(item.level))}${success?' · 成功率 '+esc(success):''}</p>
    <div class="detail-grid"><div><small>屬性</small><p>${esc(stats(item.stats))}</p></div><div><small>裝備需求</small><p>${esc(item.requirements?stats(item.requirements,true):'不適用')}</p></div>
    <div><small>職業</small><p>${esc(item.jobs?.map(x=>jobNames[x]||x).join('、')||'來源未列出')}</p></div><div><small>NPC 販售</small><p>${npcs.length?npcs.map(x=>`${esc(x.name)} · ${number(x.price)} 楓幣`).join('<br>'):'來源未列出'}</p></div>
    <div><small>怪物掉落</small><p>${drops.length?drops.map(x=>esc(x.name)).join('、'):'來源未列出'}</p></div><div><small>任務取得</small><p>${quests.length?quests.map(x=>esc(x.name)).join('、'):'來源未列出'}</p></div></div>
    <p class="source-note">這是玩家社群圖鑑資料；本遊戲尚未讓所有圖鑑裝備穿戴或使用卷軸。<a href="${item.kind==='scrolls'?'https://www.artalemaplestory.com/zh/scrolls':'https://www.artalemaplestory.com/zh/equipment'}" target="_blank" rel="noopener noreferrer">查看資料來源 ↗</a></p>`;
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
    `<div class="notice">這是資料快照，不保證全部已在台服開放；文字版遊戲目前也尚未實作所有裝備穿戴及卷軸強化。<a href="changelog.html">查看資料說明</a></div>
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
function shopsPage(catalog){
  const byId=new Map([...catalog.equipment,...catalog.scrolls].map(x=>[x.id,x]));
  root.innerHTML=head('MERCHANT DIRECTORY','NPC 商店','按 NPC 查詢圖鑑記錄的裝備、卷軸售價；同一件物品可能由多間商店販售。')+
    '<div class="notice">這些是來源圖鑑列出的 NPC 商店資料。目前文字版遊戲的購買功能只支援少量試作商品，圖鑑商店商品尚不能直接購買。</div><div class="tools"><label class="field">搜尋 NPC<input id="shop-query" type="search" placeholder="例如 山姆、卡爾"></label><label class="field">選擇商店<select id="shop-select"><option value="">請選擇 NPC</option></select></label></div><div class="results-meta" id="shop-meta"></div><div class="data-wrap"><table><thead><tr><th>商品</th><th>類別／部位</th><th>價格</th></tr></thead><tbody id="offers"></tbody></table></div><div class="pagination"></div><section id="detail" class="detail" hidden></section>';
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
function home(){root.innerHTML=`<section class="hero"><div class="hero-content"><div class="eyebrow">TEXT ADVENTURE · GAME WIKI</div><h1>每一次冒險，<br>都有資料可查。</h1><p>文字版阿泰爾的裝備、卷軸、NPC 商店與世界資訊，整理成適合手機查閱的冒險資料站。</p><div class="hero-actions"><a class="btn btn-primary" href="equipment.html">查裝備圖鑑 →</a><a class="btn btn-secondary" href="guide.html">閱讀新手指南</a></div></div></section>
  <section class="stats-strip" aria-label="資料總覽"><div class="stat-box"><strong>1,840</strong><span>裝備資料</span></div><div class="stat-box"><strong>274</strong><span>卷軸資料</span></div><div class="stat-box"><strong>47</strong><span>附售價的 NPC 商店</span></div><div class="stat-box"><strong>25</strong><span>目前文字版地圖</span></div></section>
  <section class="section"><div class="section-head"><div><div class="eyebrow">EXPLORE</div><h2>冒險資料</h2></div><p>從一件裝備，查到它的屬性與取得來源。</p></div><div class="grid">
  ${card('🛡️','裝備圖鑑','依部位、等級與名稱尋找武器防具，查看能力和來源。','equipment.html')}
  ${card('📜','卷軸圖鑑','查強化部位、成功率、屬性與來源。','scrolls.html')}
  ${card('🏪','NPC 商店','依 NPC 查裝備與卷軸的資料庫售價。','shops.html')}
  ${card('🗺️','地圖','查看已開放地圖、進入等級與怪物組成。','maps.html')}
  ${card('👾','怪物','了解目前文字版怪物的等級、經驗與掉落。','monsters.html')}
  ${card('🌟','職業','查看目前可選的一轉職業與裝備方向。','jobs.html')}</div></section>
  <section class="notice"><strong>資料範圍：</strong>圖鑑採公開玩家社群資料快照；地圖、怪物、職業採目前 Telegram 文字版遊戲資料。圖鑑中的裝備、卷軸尚未全部接入實際玩法。<a href="changelog.html">查看更新紀錄與來源 →</a></section>`;}
function guide(){root.innerHTML=head('START HERE','新手指南','這是 Telegram 裡的放置型文字冒險。選好地圖後開始狩獵，再打開面板就會結算離線進度。')+
  `<div class="steps"><div class="step"><b>1</b><h3>建立角色</h3><p>到文字版阿泰爾機器人輸入 /start。主面板會顯示等級、血量、楓幣、目前地圖和狩獵狀態。</p></div><div class="step"><b>2</b><h3>選地圖狩獵</h3><p>按「地圖」選擇練功地點，再按「狩獵」。打開面板會結算經驗、楓幣和掉落。</p></div><div class="step"><b>3</b><h3>轉職與查資料</h3><p>法師 Lv.8、其他一轉職業 Lv.10 可轉職。可在本網站查裝備、卷軸和 NPC 商店資料。</p></div></div>
  <div class="prose section"><h2>常用指令</h2><p><code>/status</code> 更新面板、<code>/character</code> 角色、<code>/ap</code> 能力值配點、<code>/skills</code> 技能配點與掛機選用、<code>/maps</code> 地圖、<code>/hunt</code> 狩獵、<code>/stop</code> 停止、<code>/bag</code> 背包、<code>/shop</code> 試作商店、<code>/catalog</code> 道具圖鑑、<code>/find 名稱</code> 搜尋、<code>/shops</code> NPC 商店圖鑑。</p><h2>狩獵與補給</h2><p>升級可自行分配 5 AP；轉職後升級取得 3 SP。已選技能會在掛機與野王戰鬥中使用，實際扣除 MP。MP 不足時會自動購買並使用藍水，買不起則改用普通攻擊。紅水剩 5 瓶以下會使用楓幣補到 30 瓶。楓幣不足、怪物傷害超過最大 HP、進入安全區或手動休息時可能停止狩獵。離線結算一次最多 8 小時。</p><h2>目前實作到哪裡？</h2><p>已有楓之島 21 張地圖、維多利亞島 4 張地圖、五種一轉職業、首批攻擊技能與紅寶王雛形。技能傷害、MP 消耗與藍水價格是文字版換算，尚非阿泰爾正式公式。沒有任務系統；多數圖鑑裝備仍未接入穿戴與卷軸強化。</p></div>`;}
function mapsPage(world){const entries=Object.entries(world.maps);root.innerHTML=head('WORLD ATLAS','地圖','目前 Telegram 文字版遊戲的地圖。點區域可縮小範圍；名稱與怪物組成以遊戲資料為準。')+
  '<div class="notice">目前可直接從地圖選單移動，尚未重現原作的傳送點連接。</div><div class="tools"><label class="field">區域<select id="region"><option value="">全部區域</option><option value="island">楓之島</option><option value="victoria">維多利亞島</option></select></label><label class="field">搜尋地圖<input id="map-query" type="search" placeholder="輸入地圖或怪物名稱"></label></div><div class="list-cards" id="map-list"></div>';
  const render=()=>{const reg=root.querySelector('#region').value,q=root.querySelector('#map-query').value.trim();root.querySelector('#map-list').innerHTML=entries.filter(([,map])=>(!reg||map.region===reg)&&(!q||map.name.includes(q)||map.monsters.some(id=>world.monsters[id]?.name.includes(q)))).map(([,map])=>`<article class="list-card"><span class="pill">${map.region==='island'?'楓之島':'維多利亞島'}</span><h3>${esc(map.name)}</h3><p>進入等級 ${esc(level(map.minLevel))} · ${map.monsters.length?map.monsters.map(id=>esc(world.monsters[id]?.name||id)).join('、'):'安全區'}${map.fieldBoss?' · 👑 '+esc(world.fieldBosses[map.fieldBoss]?.name):''}</p></article>`).join('')||'<p class="muted">找不到符合的地圖。</p>';};root.querySelector('#region').onchange=render;root.querySelector('#map-query').oninput=render;render();}
function monstersPage(world){const entries=Object.entries(world.monsters).sort((a,b)=>a[1].level-b[1].level);root.innerHTML=head('BESTIARY','怪物','目前文字版遊戲已放入的普通怪物。數值含試作設定，與阿泰爾正式版不一定一致。')+
  '<div class="notice">怪物攻擊、楓幣範圍和掉率仍是文字版試作值，不能當成原版遊戲的掉率。</div><div class="tools"><label class="field">搜尋怪物<input id="monster-query" type="search" placeholder="輸入怪物或掉落名稱"></label></div><div class="data-wrap"><table><thead><tr><th>怪物</th><th>等級</th><th>HP</th><th>EXP</th><th>試作掉落</th></tr></thead><tbody id="monster-rows"></tbody></table></div>';
  const render=()=>{const q=root.querySelector('#monster-query').value.trim();root.querySelector('#monster-rows').innerHTML=entries.filter(([,m])=>!q||m.name.includes(q)||world.items[m.drop]?.name.includes(q)).map(([,m])=>`<tr><td><strong>${esc(m.name)}</strong></td><td>${m.level}</td><td>${number(m.hp)}</td><td>${number(m.exp)}</td><td>${esc(world.items[m.drop]?.name||'未列出')}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">找不到怪物。</td></tr>';};root.querySelector('#monster-query').oninput=render;render();}
function jobsPage(world){const descriptions={beginner:'從楓之島出發的初心者。',warrior:'近戰武器與較高的升級 HP。',magician:'使用短杖，以 INT 為主要能力。',bowman:'使用弓，以 DEX 為主要能力。',thief:'使用短劍，以 LUK 為主要能力。',pirate:'使用指虎或火槍。'};root.innerHTML=head('CLASS GUIDE','職業','目前開放五種第一次轉職、AP 配點與首批可用的攻擊技能。')+
  `<div class="notice">升級獲得 5 AP；轉職時取得 1 SP，之後每級取得 3 SP。用 Telegram 的「能力值」和「技能」按鈕配點。技能數值為文字版戰鬥換算，並非正式版阿泰爾完整技能樹。</div><div class="grid">${Object.entries(world.jobs).map(([id,job])=>`<article class="card"><span class="icon">${({beginner:'🍁',warrior:'⚔️',magician:'✨',bowman:'🏹',thief:'🗡️',pirate:'⚓'})[id]}</span><h3>${esc(job.name)}</h3><p>${esc(descriptions[id])}<br>轉職需求：${id==='beginner'?'初始職業':id==='magician'?'Lv.8':'Lv.10'}<br>可用武器：${esc(job.weapon.map(typeName).join('、'))}</p>${(world.skills||[]).filter(skill=>skill.job===id).map(skill=>`<p><strong>${esc(skill.name)}</strong> · ${esc(skill.weapons.join('、'))}<br>Lv.1：${skill.hits} 段 × ${skill.firstPercent}%／MP ${skill.firstMp}<br>Lv.${skill.maxLevel}：${skill.hits} 段 × ${skill.maxPercent}%／MP ${skill.maxMp}</p>`).join('')}</article>`).join('')}</div><p class="source-note">技能名稱參考 Artale 玩家資料；本網站數值取自目前 Telegram 文字版程式，完整技能樹及原版公式仍待核對。</p>`;}
function changelog(){root.innerHTML=head('VERSION HISTORY','更新紀錄','資料快照與網站功能的改動記錄。每次新增來源或修正資料，都會標明範圍與時間。')+
  `<div class="timeline"><article><time>2026-10-22 · 創角與補償</time><h2>加入創角骰點與舊角色重設券</h2><p>新角色可反覆骰四項初始能力，總計 25 點、每項至少 4 點，確認後開始遊戲。更新前已建立的角色各獲得一張初始能力重設券，可預覽、重骰與取消；確認才消耗券，只替換初始能力，升級後已分配的 AP 保留。</p></article><article><time>2026-10-22 · 角色成長</time><h2>加入能力值與首批實戰技能</h2><p>新增 AP／SP 配點、MP、藍水和五種一轉職業的首批攻擊技能；掛機與野王會依選用技能計算傷害與 MP 消耗。舊角色已自動加過的主能力值保留，只補可用點數。技能倍率、MP 與藍水價格為文字版試作值，非正式版阿泰爾公式。</p></article><article><time>2026-10-22 · 網站首版</time><h2>冒險資料站建立</h2><p>參考文字 RO 資料站的分類瀏覽方式，新增首頁、新手指南、裝備、卷軸、NPC 商店、地圖、怪物與職業頁。網站資料與 Telegram 角色存檔分離，不顯示個人帳號資料。</p></article>
  <article><time>2026-10-22 · 圖鑑快照</time><h2>匯入裝備、卷軸和商店</h2><p>從 <a href="https://www.artalemaplestory.com/zh/equipment" target="_blank" rel="noopener noreferrer">ArtaleMapleStory.com 裝備圖鑑</a>與<a href="https://www.artalemaplestory.com/zh/scrolls" target="_blank" rel="noopener noreferrer">卷軸圖鑑</a>的公開資料模組擷取 1,840 件裝備、274 張卷軸、47 間有明列售價的 NPC 商店。來源網頁列表顯示 1,733 件裝備，與資料模組筆數不同；尚未逐筆確認額外項目是否在台灣服開放。掉率未匯入，也沒有把圖鑑商品誤標為本遊戲可購買。</p></article>
  <article><time>2026-10-22 · 遊戲資料</time><h2>加入現行文字版世界資訊</h2><p>地圖 25 張、普通怪物 10 種、初心者與五種一轉職業，取自本機文字版遊戲程式。怪物攻擊、掉率與部分經濟數值為試作值，會隨遊戲更新再校準。</p></article></div>`;}

(async()=>{try{if(page==='index')home();else if(page==='guide')guide();else if(page==='changelog')changelog();else if(page==='equipment'||page==='scrolls')itemCatalog(await data('catalog.json'),page);else if(page==='shops')shopsPage(await data('catalog.json'));else if(page==='maps'||page==='monsters'||page==='jobs'){const world=await data('world.json');({maps:mapsPage,monsters:monstersPage,jobs:jobsPage})[page](world);}else error('找不到這個頁面。');}catch(err){console.error(err);error('資料載入失敗，請重新整理或稍後再試。');}})();
