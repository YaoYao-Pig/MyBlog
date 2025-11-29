import fs from 'fs';
import path from 'path';

const contentDir = path.join(process.cwd(), 'public', 'content');
const outputFile = path.join(process.cwd(), 'public', 'structure.json');

function getDirectoryTree(dir) {
    const name = path.basename(dir);
    const item = {
        name: name,
        type: 'folder',
        children: []
    };

    const files = fs.readdirSync(dir);

    for (const file of files) {
        if (file.startsWith('.') || file === 'node_modules') continue;

        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            item.children.push(getDirectoryTree(fullPath));
        } else if (file.endsWith('.md')) {
            // 我们不在这里读取完整内容，只记录路径，由前端按需加载
            // 路径需要是相对于 public/content 的
            const relativePath = path.relative(contentDir, fullPath).replace(/\\/g, '/');
            item.children.push({
                name: file,
                type: 'file',
                path: relativePath
            });
        }
    }
    return item;
}

try {
    if (!fs.existsSync(contentDir)) {
        console.error("❌ Error: public/content directory not found!");
        process.exit(1);
    }
    const tree = getDirectoryTree(contentDir);
    // 根节点特殊处理，它的名字应该是 'root'
    tree.name = 'root';
    
    fs.writeFileSync(outputFile, JSON.stringify(tree, null, 2));
    console.log("✅ structure.json generated successfully!");
} catch (e) {
    console.error("Error generating tree:", e);
}

