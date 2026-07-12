const fs = require("fs");
const path = require("path");

const CWD = process.cwd();
const LANGUAGES = path.join(CWD, "languages");
const WIKI = path.join(CWD, "wiki");
const TOOLS = path.join(CWD, "tools");
const EXCLUDE_PATHS = ["test/", "ref/"];

//!!! Remember to change this
const targetLanguageCode = null;

// use: node tools/search-untranslated-file

if (!targetLanguageCode) {
  throw new Error("targetLanguageCode cannot be null");
}

// Recursively find all files matching a given filename under a directory
function rglob(dir, filename) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(rglob(fullPath, filename));
    } else if (entry.isFile() && entry.name === filename) {
      results.push(fullPath);
    }
  }
  return results;
}

// Convert a path to a posix-style relative path from CWD
function toRelativePosix(filePath, base) {
  return path.relative(base, filePath).split(path.sep).join("/");
}

const enFiles = rglob(WIKI, "en.yml");

const dumpMdLines = [
  "# Untranslate files",
  `Target language: \`${targetLanguageCode}\``,
  `Exclude paths: \`${JSON.stringify(EXCLUDE_PATHS)}\``,
  `Total file count: ${enFiles.length}`,
  "Untranslate file count: {COUNT}",
  "## Files",
];
const notFileLines = dumpMdLines.length;

for (const enFile of enFiles) {
  const dir = path.dirname(enFile);
  const targetFile = path.join(dir, `${targetLanguageCode}.yml`);
  let isExclude = false;

  if (fs.existsSync(targetFile)) {
    continue;
  }

  const targetFilePath = toRelativePosix(targetFile, CWD);

  for (const excludePath of EXCLUDE_PATHS) {
    if (targetFilePath.includes(excludePath)) {
      isExclude = true;
      break;
    }
  }
  if (isExclude) {
    continue;
  }

  dumpMdLines.push(`- [ ] ${targetFilePath}`);
}

const outDir = path.join(TOOLS, "generated");
fs.mkdirSync(outDir, { recursive: true });

const content = dumpMdLines
  .join("  \n")
  .replace("{COUNT}", String(dumpMdLines.length - notFileLines));

fs.writeFileSync(path.join(outDir, "untranslate_files_js.md"), content);
