import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const gameRoot = process.argv[2];
if (!gameRoot) throw new Error('請提供遊戲專案資料夾路徑');
const load = file => import(pathToFileURL(resolve(gameRoot, file)).href);
const source = await load('src/content.js');
// 新版遊戲在 content.js 匯出合併同名材料後的掉落表；舊版才退回 loot.js。
const dropPools = source.dropPools || (await load('src/loot.js')).dropPools;
const { sellPrice } = await load('src/engine.js');
const { skills, skillDetails } = await load('src/progression.js');
const changelog = JSON.parse(readFileSync(resolve(gameRoot, 'src/data/changelog.json'), 'utf8'));
const output = new URL('./docs/world.json', import.meta.url);
const existing = JSON.parse(readFileSync(output, 'utf8'));
const monsters = Object.fromEntries(Object.entries(source.monsters).map(([id, monster]) =>
  [id, { ...monster, drops: dropPools[id] || [] }]));
const usedItemIds = new Set(Object.values(monsters).flatMap(monster => [monster.drop, ...monster.drops.map(drop => drop.id)]));
const aliases = source.materialAliases || {};
const itemIds = new Set([...usedItemIds, ...Object.keys(source.items).filter(id => source.items[id].slot === 'material' && !aliases[id])]);
const items = Object.fromEntries([...itemIds].filter(id => source.items[id]).map(id => {
  const item = source.items[id];
  return [id, { name: item.name, slot: item.slot,
    ...(item.slot === 'material' ? { sellPrice: item.price, priceSource: item.priceSource || '文字版暫定售價' } : {}) }];
}));
// 圖鑑裝備在文字版商店的 [售價, NPC 收購價（售價一半）, 售價是否來自圖鑑 NPC 1／0]；用陣列讓檔案保持輕量。
const gearPrices = Object.fromEntries(Object.entries(source.items)
  .filter(([id, item]) => id.startsWith('eq_') && item.price > 0)
  .map(([id, item]) => [id, [item.price, sellPrice(item), item.priceSource === '圖鑑 NPC 售價' ? 1 : 0]]));
const previousSkills = new Map(existing.skills.map(skill => [skill.id, skill]));
const skillCatalog = Object.entries(skills).map(([id, skill]) => {
  const first = skillDetails(id, 1);
  const max = skillDetails(id, skill.maxLevel);
  return {
    id, name: skill.name, job: skill.job, tier: skill.tier || 1,
    ...(skill.kind ? { kind: skill.kind } : {}),
    weapons: skill.weapon || [], maxLevel: skill.maxLevel,
    ...(!skill.kind ? { hits: first.hits, firstPercent: first.damagePercent, maxPercent: max.damagePercent } : {}),
    firstMp: first.mpCost, maxMp: max.mpCost,
    ...(first.hpCost ? { firstHp: first.hpCost, maxHp: max.hpCost } : {}),
    ...(skill.prerequisite ? { prerequisite: skill.prerequisite } : {}),
    ...(previousSkills.get(id)?.description || skill.effect ? { description: previousSkills.get(id)?.description || skill.effect(1) } : {})
  };
});
const world = {
  ...existing,
  version: changelog.versions[0].version,
  jobs: source.jobs, items, gearPrices, skills: skillCatalog,
  maps: source.maps, monsters,
  fieldBosses: source.fieldBosses
};
writeFileSync(output, JSON.stringify(world, null, 2).replace(/\[\n\s+(\d+),\n\s+(\d+),\n\s+([01])\n\s+\]/g, '[$1, $2, $3]') + '\n');
writeFileSync(new URL('./docs/game-changelog.json', import.meta.url), JSON.stringify(changelog.versions, null, 2) + '\n');
const materials = Object.values(items).filter(item => item.slot === 'material').length;
console.log(`Wiki 同步遊戲 v${world.version}：${Object.keys(world.maps).length} 張地圖、${Object.keys(monsters).length} 種普通怪、${materials} 種雜物、${Object.keys(gearPrices).length} 件裝備價格。`);
