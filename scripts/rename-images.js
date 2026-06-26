const fs = require('fs');
const path = require('path');
const { Command } = require('commander');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const rootDir = path.resolve(__dirname, '..');
const tempPrefix = '.rename-images-tmp-';

function normalizeArgs(argv) {
  // npm run rename-images --input <dir> exposes --input as npm_config_input and passes <dir> as a positional.
  if (process.env.npm_config_input && argv.length === 1 && !argv[0].startsWith('-')) {
    return ['--input', argv[0]];
  }

  return argv;
}

function readOptions(argv) {
  const program = new Command();

  program
    .name('rename-images')
    .description('Rename image files in a directory to a numeric sequence.')
    .requiredOption('--input <dir>', 'input image directory')
    .showHelpAfterError()
    .parse(normalizeArgs(argv), { from: 'user' });

  return {
    targetDir: resolveFromRoot(program.opts().input, 'input directory'),
  };
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
    .filter((entry) => entry.isFile() && isImageFile(entry.name) && !entry.name.startsWith(tempPrefix))
    .map((entry) => entry.name)
    .sort(naturalCompare);
}

function renameImages(targetDir) {
  const files = readImageFiles(targetDir);

  console.log(`Input directory: ${targetDir}`);
  console.log(`Found ${files.length} image files.`);

  // First rename every image to a temporary name to avoid collisions with existing numeric filenames.
  files.forEach((filename, index) => {
    const currentPath = path.join(targetDir, filename);
    const tempPath = path.join(targetDir, `${tempPrefix}${index + 1}${path.extname(filename)}`);

    if (fs.existsSync(tempPath)) {
      throw new Error(`Temporary file already exists: ${tempPath}`);
    }

    fs.renameSync(currentPath, tempPath);
  });

  console.log('Temporary rename phase completed.');

  // Then rename the temporary files to the final 1.ext, 2.ext, 3.ext sequence.
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
  const { targetDir } = readOptions(process.argv.slice(2));
  const total = renameImages(targetDir);

  console.log(`Rename completed. Total: ${total}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
