import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const gameRoot = process.argv[2];
if (!gameRoot) throw new Error('請提供遊戲專案資料夾路徑');
const source = await import(pathToFileURL(resolve(gameRoot, 'src/content.js')).href);
const { dropPools } = await import(pathToFileURL(resolve(gameRoot, 'src/loot.js')).href);
const { skills, skillDetails } = await import(pathToFileURL(resolve(gameRoot, 'src/progression.js')).href);
const output = new URL('./docs/world.json', import.meta.url);
const existing = JSON.parse(readFileSync(output, 'utf8'));
const monsters = Object.fromEntries(Object.entries(source.monsters).map(([id, monster]) =>
  [id, { ...monster, drops: dropPools[id] || [] }]));
const usedItemIds = new Set(Object.values(monsters).flatMap(monster => [monster.drop, ...monster.drops.map(drop => drop.id)]));
const items = Object.fromEntries([...usedItemIds].filter(id => source.items[id])
  .map(id => [id, { name: source.items[id].name, slot: source.items[id].slot }]));
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
  jobs: source.jobs, items, skills: skillCatalog,
  maps: source.maps, monsters,
  fieldBosses: source.fieldBosses
};
writeFileSync(output, JSON.stringify(world, null, 2) + '\n');
console.log(`Wiki 同步 ${Object.keys(world.maps).length} 張地圖、${Object.keys(monsters).length} 種普通怪。`);
