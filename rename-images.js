const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'resource', 'images');

// 读取所有文件
const files = fs.readdirSync(imagesDir)
  .filter(file => file.endsWith('.png'))
  .sort();

console.log(`找到 ${files.length} 个图片文件`);

// 重命名文件
files.forEach((file, index) => {
  const oldPath = path.join(imagesDir, file);
  const newName = `${index + 1}.png`;
  const newPath = path.join(imagesDir, newName);

  fs.renameSync(oldPath, newPath);
  console.log(`${file} -> ${newName}`);
});

console.log('重命名完成！');