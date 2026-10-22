import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const pages = ['index', 'guide', 'equipment', 'scrolls', 'shops', 'maps', 'monsters', 'jobs', 'changelog'];
for (const page of pages) {
  const html = readFileSync(new URL(`./dist/${page}.html`, import.meta.url), 'utf8');
  assert.ok(html.includes(`data-page="${page}"`));
  assert.ok(html.includes('app.js'));
  for (const target of pages) assert.ok(html.includes(`href="${target}.html"`), `${page} missing ${target}`);
}
const catalog = JSON.parse(readFileSync(new URL('./dist/catalog.json', import.meta.url)));
const world = JSON.parse(readFileSync(new URL('./dist/world.json', import.meta.url)));
assert.equal(catalog.equipment.length, 1840);
assert.equal(catalog.scrolls.length, 274);
assert.equal(catalog.shops.length, 47);
assert.equal(Object.keys(world.maps).length, 25);
assert.equal(world.skills.length, 8);
const ids = new Set([...catalog.equipment, ...catalog.scrolls].map(item => item.id));
assert.equal(ids.size, 2114);
for (const shop of catalog.shops) for (const offer of shop.offers) assert.ok(ids.has(offer.itemId));
for (const asset of ['app.js', 'styles.css', 'avatar.png', 'city-cover.png']) assert.ok(existsSync(new URL(`./dist/${asset}`, import.meta.url)));
console.log('9 頁、2,114 件道具、47 間 NPC 商店、25 張地圖檢查通過。');
