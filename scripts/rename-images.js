const fs = require('fs');
const path = require('path');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const rootDir = path.resolve(__dirname, '..');
const defaultImagesDir = path.join(rootDir, 'resource', 'images');
const tempPrefix = '.rename-images-tmp-';

function parseArgs(argv) {
  let targetDir = defaultImagesDir;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dir' || arg === '--images-dir') {
      targetDir = resolveFromRoot(argv[index + 1], arg);
      index += 1;
      continue;
    }

    if (!arg.startsWith('-')) {
      targetDir = resolveFromRoot(arg, 'directory');
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return targetDir;
}

function resolveFromRoot(value, name) {
  if (!value) {
    throw new Error(`Missing value for ${name}`);
  }

  return path.isAbsolute(value) ? value : path.resolve(rootDir, value);
}

function isImageFile(filename) {
  return IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

function naturalCompare(a, b) {
  return a.localeCompare(b, 'zh-CN', {
    numeric: true,
    sensitivity: 'base',
  });
}

function readImageFiles(targetDir) {
  if (!fs.existsSync(targetDir)) {
    throw new Error(`Directory does not exist: ${targetDir}`);
  }

  const stats = fs.statSync(targetDir);
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${targetDir}`);
  }

  return fs.readdirSync(targetDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isImageFile(entry.name))
    .map((entry) => entry.name)
    .sort(naturalCompare);
}

function renameImages(targetDir) {
  const files = readImageFiles(targetDir);

  files.forEach((filename, index) => {
    const currentPath = path.join(targetDir, filename);
    const tempPath = path.join(targetDir, `${tempPrefix}${index + 1}${path.extname(filename)}`);
    fs.renameSync(currentPath, tempPath);
  });

  files.forEach((filename, index) => {
    const extension = path.extname(filename);
    const tempPath = path.join(targetDir, `${tempPrefix}${index + 1}${extension}`);
    const nextName = `${index + 1}${extension}`;
    const nextPath = path.join(targetDir, nextName);

    fs.renameSync(tempPath, nextPath);
    console.log(`${filename} -> ${nextName}`);
  });

  return files.length;
}

function main() {
  const targetDir = parseArgs(process.argv.slice(2));
  const total = renameImages(targetDir);

  console.log(`Renamed ${total} image files in ${targetDir}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
