const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const appDir = 'c:\\\\Users\\\\User\\\\Desktop\\\\safcha dash 2\\\\safcha-dashboard\\\\app';
const files = walk(appDir);
let changedCount = 0;

const regex1 = /export const dynamic = 'force-dynamic';\r?\n?/g;
const regex2 = /export const dynamic = "force-dynamic";\r?\n?/g;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (regex1.test(content) || regex2.test(content)) {
        let newContent = content.replace(regex1, '').replace(regex2, '');
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Removed from:', file);
        changedCount++;
    }
});

console.log(`\nSuccess! Removed force-dynamic from ${changedCount} files.`);
