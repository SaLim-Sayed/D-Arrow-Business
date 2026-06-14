const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

const allFiles = walk(srcDir);
console.log(`Scanning ${allFiles.length} files for hardcoded text patterns...\n`);

allFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // A simple regex to find JSX text: e.g., >Text<, but not >{...}<
  // Also check for common placeholder texts or attributes like placeholder="some English"
  const lines = content.split('\n');
  let hasHardcoded = false;
  let fileOutput = [];

  lines.forEach((line, index) => {
    // Basic match for JSX text nodes: >[A-Za-z ]+<
    const jsxTextMatch = line.match(/>\s*([A-Za-z][A-Za-z0-9\s,\.\?!'\-]{2,})\s*</);
    // Basic match for placeholder attributes with raw string: placeholder="[A-Za-z ]+"
    const placeholderMatch = line.match(/placeholder=["']([A-Za-z][A-Za-z0-9\s,\.\?!'\-]{2,})["']/);
    // Basic match for title or label attributes: label="[A-Za-z ]+"
    const labelAttrMatch = line.match(/\b(label|title|description|aria-label)=["']([A-Za-z][A-Za-z0-9\s,\.\?!'\-]{2,})["']/);

    // Filter out matches that look like code/imports or use t(...)
    if (jsxTextMatch && !line.includes('t(') && !line.includes('console.') && !line.includes('//')) {
      fileOutput.push(`  L${index + 1}: JSX text: "${jsxTextMatch[1].trim()}"`);
      hasHardcoded = true;
    }
    if (placeholderMatch && !line.includes('t(') && !line.includes('//')) {
      fileOutput.push(`  L${index + 1}: attribute placeholder: "${placeholderMatch[1].trim()}"`);
      hasHardcoded = true;
    }
    if (labelAttrMatch && !line.includes('t(') && !line.includes('//') && !line.includes('import ') && !line.includes('export ')) {
      fileOutput.push(`  L${index + 1}: attribute ${labelAttrMatch[1]}: "${labelAttrMatch[2].trim()}"`);
      hasHardcoded = true;
    }
  });

  if (hasHardcoded) {
    const relPath = path.relative(path.join(__dirname, '..'), filePath);
    console.log(`File: ${relPath}`);
    fileOutput.forEach(line => console.log(line));
    console.log('');
  }
});
