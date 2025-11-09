import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const allowList = new Set([
  path.join('src', 'shared', 'styles', 'input-skin.scss')
]);

const disallowed = [];

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectFiles(fullPath);
    }
    if (/\.(scss|css)$/i.test(entry.name)) {
      return [fullPath];
    }
    return [];
  }));
  return files.flat();
}

function checkFocusBoxShadow(filePath, content) {
  if (allowList.has(path.relative(root, filePath))) {
    return;
  }
  const focusPattern = /(?:&?:focus(?:-within)?|\.ion-focused|(?:input|textarea|select)[^{;]{0,80}:focus(?:-within)?)[^{}]*\{[^}]*box-shadow[^}]*\}/gis;
  const matches = content.match(focusPattern);
  if (matches) {
    matches.forEach((match) => {
      disallowed.push({
        filePath,
        message: 'Avoid defining focus box-shadows outside the shared input skin.',
        snippet: match.trim().slice(0, 120)
      });
    });
  }
}

function checkInputWrapperUnderline(filePath, content) {
  const underlinePattern = /\.input-wrapper[^{}]*\{[^}]*border-bottom[^}]*\}/gis;
  const matches = content.match(underlinePattern);
  if (matches) {
    matches.forEach((match) => {
      disallowed.push({
        filePath,
        message: 'Do not reintroduce borders on Ionic input wrappers.',
        snippet: match.trim().slice(0, 120)
      });
    });
  }
}

async function main() {
  const files = await collectFiles(srcDir);
  await Promise.all(files.map(async (filePath) => {
    const content = await readFile(filePath, 'utf8');
    checkFocusBoxShadow(filePath, content);
    checkInputWrapperUnderline(filePath, content);
  }));

  if (disallowed.length > 0) {
    console.error('\nInput visual regression guard failed. The following patterns are not allowed:');
    disallowed.forEach(({ filePath, message, snippet }) => {
      const relative = path.relative(root, filePath);
      console.error(`\n- ${relative}`);
      console.error(`  ${message}`);
      console.error(`  Snippet: ${snippet}`);
    });
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unable to complete input visual check:', error);
  process.exit(1);
});
