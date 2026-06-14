const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'public', 'locales');
const enDir = path.join(localesDir, 'en');
const arDir = path.join(localesDir, 'ar');

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const files = fs.readdirSync(enDir).filter(f => f.endsWith('.json'));

console.log('Comparing locale files between en and ar:\n');

files.forEach(file => {
  const enPath = path.join(enDir, file);
  const arPath = path.join(arDir, file);

  if (!fs.existsSync(arPath)) {
    console.log(`[Missing File] Arabic file missing for ${file}`);
    return;
  }

  const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const arContent = JSON.parse(fs.readFileSync(arPath, 'utf8'));

  const enKeys = getKeys(enContent);
  const arKeys = getKeys(arContent);

  const missingInAr = enKeys.filter(k => !arKeys.includes(k));
  const missingInEn = arKeys.filter(k => !enKeys.includes(k));

  if (missingInAr.length > 0 || missingInEn.length > 0) {
    console.log(`=== Namespace: ${file} ===`);
    if (missingInAr.length > 0) {
      console.log(`  Missing in Arabic (ar):`);
      missingInAr.forEach(k => console.log(`    - ${k}`));
    }
    if (missingInEn.length > 0) {
      console.log(`  Missing in English (en):`);
      missingInEn.forEach(k => console.log(`    - ${k}`));
    }
    console.log('');
  } else {
    console.log(`[OK] Namespace ${file} matches perfectly.`);
  }
});
