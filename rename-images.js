const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'resource', 'images');
const resourceDir = path.join(__dirname, 'resource');

// 读取所有图片文件
const files = fs.readdirSync(imagesDir)
  .filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
  })
  .sort();

console.log(`找到 ${files.length} 个图片文件`);

// 创建临时目录用于重命名
const tempDir = path.join(imagesDir, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// 先移动到临时目录
files.forEach((file, index) => {
  const oldPath = path.join(imagesDir, file);
  const tempPath = path.join(tempDir, file);
  fs.renameSync(oldPath, tempPath);
});

// 生成图片数据数组
const imagesData = [];

// 从临时目录重命名并移回，同时收集数据
files.forEach((file, index) => {
  const tempPath = path.join(tempDir, file);
  const ext = path.extname(file);
  const newName = `${index + 1}${ext}`;
  const newPath = path.join(imagesDir, newName);
  
  // 获取文件信息
  const stats = fs.statSync(tempPath);
  
  // 重命名并移回
  fs.renameSync(tempPath, newPath);
  
  // 收集图片数据
  imagesData.push({
    id: index + 1,
    filename: newName,
    originalName: file,
    path: `resource/images/${newName}`,
    size: stats.size,
    extension: ext.substring(1)
  });
  
  console.log(`${file} -> ${newName}`);
});

// 删除临时目录
fs.rmdirSync(tempDir);

// 生成 JSON 文件
const jsonData = {
  total: imagesData.length,
  images: imagesData,
  generatedAt: new Date().toISOString()
};

const jsonPath = path.join(resourceDir, 'images-data.json');
fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');

console.log('\n重命名完成！');
console.log(`共处理 ${imagesData.length} 个图片文件`);
console.log(`JSON 文件已生成: ${jsonPath}`);