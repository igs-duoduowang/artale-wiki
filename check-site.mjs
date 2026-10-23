import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const pages = ['index', 'guide', 'equipment', 'scrolls', 'materials', 'shops', 'maps', 'monsters', 'jobs', 'roadmap', 'changelog'];
for (const page of pages) {
  const html = readFileSync(new URL(`./docs/${page}.html`, import.meta.url), 'utf8');
  assert.ok(html.includes(`data-page="${page}"`));
  assert.ok(html.includes('app.js'));
  for (const target of pages) assert.ok(html.includes(`href="${target}.html"`), `${page} missing ${target}`);
}
const catalog = JSON.parse(readFileSync(new URL('./docs/catalog.json', import.meta.url)));
const world = JSON.parse(readFileSync(new URL('./docs/world.json', import.meta.url)));
assert.equal(catalog.equipment.length, 1840);
assert.equal(catalog.scrolls.length, 274);
assert.equal(catalog.shops.length, 47);
assert.equal(Object.keys(world.maps).length, 168);
assert.equal(Object.keys(world.monsters).length, 47);
assert.ok(Object.values(world.monsters).every(monster => monster.drops?.length >= 1));
assert.ok(world.monsters.snail.drops.some(drop => drop.id === 'eq_b14c71893bc3'));
assert.equal(world.skills.length, 32);
for (const name of ['精準強化', '百步穿楊', '霸王箭', '集中術', '斷魂箭', '二連箭'])
  assert.ok(world.skills.some(skill => skill.job === 'bowman' && skill.name === name), `missing bowman ${name}`);
assert.equal(world.jobs.assassin.parent, 'thief');
assert.equal(world.jobs.bandit.parent, 'thief');
for (const name of ['精準暗器', '強力投擲', '吸血術', '精準之刀', '妙手術', '迴旋斬', '恢復術', '速度激發'])
  assert.ok(world.skills.some(skill => skill.name === name), `missing ${name}`);
for (const name of ['生命淨化', '生命擴展', '生命恢復', '自身強化', '魔天一擊', '劍氣縱橫'])
  assert.ok(world.skills.some(skill => skill.job === 'warrior' && skill.name === name), `missing warrior ${name}`);
const ids = new Set([...catalog.equipment, ...catalog.scrolls].map(item => item.id));
assert.equal(ids.size, 2114);
for (const shop of catalog.shops) for (const offer of shop.offers) assert.ok(ids.has(offer.itemId));
for (const asset of ['app.js', 'styles.css', 'avatar.png', 'city-cover.png']) assert.ok(existsSync(new URL(`./docs/${asset}`, import.meta.url)));
const roadmap = JSON.parse(readFileSync(new URL('./docs/roadmap.json', import.meta.url)));
assert.deepEqual(roadmap.phases.map(x => x.id), ['0.0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '2.0', '3.0', '4.0']);
for (const phase of roadmap.phases) {
  assert.ok(phase.features.length >= 3, `${phase.id} missing features`);
  assert.ok(phase.acceptance.length >= 1, `${phase.id} missing acceptance`);
}
for (const phrase of ['自動配點', '掉落', '野王', '二轉', '三轉', '四轉'])
  assert.ok(JSON.stringify(roadmap).includes(phrase), `roadmap missing ${phrase}`);
// 遊戲同步資料：版本、雜物收購價、裝備價格與遊戲更新紀錄。
assert.match(world.version, /^\d+\.\d+\.\d+$/);
const materials = Object.values(world.items).filter(item => item.slot === 'material');
assert.ok(materials.length >= 100, 'missing materials');
assert.ok(materials.every(item => Number.isFinite(item.sellPrice) && item.priceSource), 'material without price');
assert.equal(world.items.snail_shell.sellPrice, 2);
assert.ok(Object.values(world.gearPrices).every(([price, sell]) => sell === Math.floor(price / 2)), 'gear sell price is not half');
const gameChangelog = JSON.parse(readFileSync(new URL('./docs/game-changelog.json', import.meta.url)));
assert.equal(gameChangelog[0].version, world.version);
console.log(`${pages.length} 頁、2,114 件道具、${materials.length} 種雜物、47 間 NPC 商店、168 張地圖、遊戲 v${world.version} 及完整路線圖檢查通過。`);
