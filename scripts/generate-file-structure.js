import { readdir, stat, copyFile, watch } from 'fs/promises';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFile, mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

async function getDirectoryStructure(dirPath) {
  const items = await readdir(dirPath);
  const itemsWithStats = await Promise.all(
    items.map(async (name) => {
      const fullPath = join(dirPath, name);
      const stats = await stat(fullPath);
      const isDirectory = stats.isDirectory();
      const relativePath = '/src/' + relative(join(rootDir, 'src'), fullPath).replace(/\\/g, '/');

      const item = {
        name,
        type: isDirectory ? 'folder' : 'file',
        path: relativePath,
      };

      if (isDirectory) {
        item.children = await getDirectoryStructure(fullPath);
      }

      return item;
    })
  );

  // 按照文件夹在前，文件在后，然后按名称排序
  return itemsWithStats.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === 'folder' ? -1 : 1;
  });
}

async function copyDirectory(src, dest) {
  const entries = await readdir(src, { withFileTypes: true });

  await mkdir(dest, { recursive: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await mkdir(dirname(destPath), { recursive: true });
      await copyFile(srcPath, destPath);
    }
  }
}

async function generateStructure() {
  try {
    const srcDataDir = join(rootDir, 'src/data');
    const publicDir = join(rootDir, 'public');
    const assetsDataDir = join(publicDir, 'assets/data');

    // 生成文件结构
    const structure = await getDirectoryStructure(srcDataDir);

    // 确保目标目录存在
    await mkdir(publicDir, { recursive: true });

    // 写入 JSON 文件
    await writeFile(
      join(publicDir, 'file-structure.json'),
      JSON.stringify(structure, null, 2)
    );

    // 复制文件到 assets 目录
    await copyDirectory(srcDataDir, assetsDataDir);

    console.log('File structure generated and assets copied successfully!');
  } catch (error) {
    console.error('Error:', error);
    if (!process.argv.includes('--watch')) {
      process.exit(1);
    }
  }
}

async function watchMode() {
  const srcDataDir = join(rootDir, 'src/data');
  
  console.log('Watching for file changes...');
  
  try {
    const watcher = watch(srcDataDir, { recursive: true });
    
    for await (const event of watcher) {
      console.log('Detected change:', event);
      await generateStructure();
    }
  } catch (error) {
    console.error('Watch error:', error);
    process.exit(1);
  }
}

// 主函数
if (process.argv.includes('--watch')) {
  watchMode();
} else {
  generateStructure();
} 