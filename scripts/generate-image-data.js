const fs = require('fs');
const path = require('path');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const rootDir = path.resolve(__dirname, '..');
const defaultResourceDir = path.join(rootDir, 'resource');
const defaultImagesDir = path.join(defaultResourceDir, 'images');
const defaultOutputPath = path.join(defaultResourceDir, 'images-data.json');

function formatDateTime(date) {
  const pad = (value) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function parseArgs(argv) {
  const options = {
    imagesDir: defaultImagesDir,
    outputPath: defaultOutputPath,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--images-dir') {
      options.imagesDir = resolveFromRoot(argv[index + 1], '--images-dir');
      index += 1;
      continue;
    }

    if (arg === '--output') {
      options.outputPath = resolveFromRoot(argv[index + 1], '--output');
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function resolveFromRoot(value, name) {
  if (!value) {
    throw new Error(`Missing value for ${name}`);
  }

  return path.isAbsolute(value) ? value : path.resolve(rootDir, value);
}

function parseGroupName(dirname) {
  const normalizedName = dirname.replace(/^[\[\u3010]\s*/, '').replace(/\s*[\]\u3011]$/, '');
  const match = normalizedName.match(/^(\S+)\s+(.+)$/);

  if (!match) {
    return {
      time: '',
      title: normalizedName,
    };
  }

  return {
    time: match[1],
    title: match[2],
  };
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

function toResourcePath(filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join('/');
}

function readImageGroups(imagesDir) {
  if (!fs.existsSync(imagesDir)) {
    throw new Error(`Images directory does not exist: ${imagesDir}`);
  }

  return fs.readdirSync(imagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => naturalCompare(a.name, b.name))
    .map((entry) => {
      const groupDir = path.join(imagesDir, entry.name);
      const { time, title } = parseGroupName(entry.name);
      const images = fs.readdirSync(groupDir, { withFileTypes: true })
        .filter((fileEntry) => fileEntry.isFile() && isImageFile(fileEntry.name))
        .sort((a, b) => naturalCompare(a.name, b.name))
        .map((fileEntry) => {
          const filePath = path.join(groupDir, fileEntry.name);
          const extension = path.extname(fileEntry.name).slice(1).toLowerCase();
          const stats = fs.statSync(filePath);

          return {
            path: toResourcePath(filePath),
            size: stats.size,
            filename: fileEntry.name,
            extension,
          };
        });

      return {
        time,
        title,
        directory: entry.name,
        images,
      };
    });
}

function buildJson(groups) {
  return {
    totalGroups: groups.length,
    totalImages: groups.reduce((total, group) => total + group.images.length, 0),
    groups,
    generatedAt: formatDateTime(new Date()),
  };
}

function writeJson(outputPath, data) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function main() {
  const { imagesDir, outputPath } = parseArgs(process.argv.slice(2));
  const groups = readImageGroups(imagesDir);
  const jsonData = buildJson(groups);

  writeJson(outputPath, jsonData);

  console.log(`Generated ${jsonData.totalGroups} groups and ${jsonData.totalImages} images.`);
  console.log(`Output: ${outputPath}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
