import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const gameRoot = process.argv[2];
if (!gameRoot) throw new Error('請提供遊戲專案資料夾路徑');
const source = await import(pathToFileURL(resolve(gameRoot, 'src/content.js')).href);
const { dropPools } = await import(pathToFileURL(resolve(gameRoot, 'src/loot.js')).href);
const output = new URL('./docs/world.json', import.meta.url);
const existing = JSON.parse(readFileSync(output, 'utf8'));
const monsters = Object.fromEntries(Object.entries(source.monsters).map(([id, monster]) =>
  [id, { ...monster, drops: dropPools[id] || [] }]));
const usedItemIds = new Set(Object.values(monsters).flatMap(monster => [monster.drop, ...monster.drops.map(drop => drop.id)]));
const items = Object.fromEntries([...usedItemIds].filter(id => source.items[id])
  .map(id => [id, { name: source.items[id].name, slot: source.items[id].slot }]));
const world = {
  ...existing,
  jobs: source.jobs, items,
  maps: source.maps, monsters,
  fieldBosses: source.fieldBosses
};
writeFileSync(output, JSON.stringify(world, null, 2) + '\n');
console.log(`Wiki 同步 ${Object.keys(world.maps).length} 張地圖、${Object.keys(monsters).length} 種普通怪。`);
