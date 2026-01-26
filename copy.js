// copy.js
const fs = require("fs");
const path = require("path");

// Folders we never want to dump
const excludedFolders = [
  "node_modules",
  ".git",
  ".vite",
  ".next",
  "dist",
  "uploads", // 🚫 skip uploads
  "frontend", // 🚫 skip nested frontend folders
  "backend",
  "venv",
  ".gemini",
  ".idea",
  ".vscode",
  "static",
  "__pycache__",
  "public",
  "downloads",
  "logs",
  "reports"
];

// Files we never want to dump
const excludedFiles = [
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  ".DS_Store",
  "database.db",
  "database1.db",
  "database2.db",
  "access.log",
  "login.log",
  "1.xlsx",
  "2.xlsx",
  "requests.xlsx",
  "my_account.session",
];

function dumpFiles(src, base = src, result = []) {
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const stat = fs.lstatSync(srcPath);

    // Skip excluded folders
    if (stat.isDirectory() && excludedFolders.includes(item)) continue;
    // Skip excluded files
    if (stat.isFile() && excludedFiles.includes(item)) continue;

    if (stat.isFile()) {
      const relPath = path.relative(base, srcPath);
      const content = fs.readFileSync(srcPath, "utf-8");
      result.push(`==== FILE: ${relPath} ====\n${content}\n\n`);
    } else if (stat.isDirectory()) {
      dumpFiles(srcPath, base, result);
    }
  }
  return result;
}

// CLI usage: node copy.js <folder>
const [src] = process.argv.slice(2);
if (!src) {
  console.error("Usage: node copy.js <folder>");
  process.exit(1);
}

const absSrc = path.resolve(src);
const folderName = path.basename(absSrc);
const outputFile = `${folderName}.txt`;

const allContents = dumpFiles(absSrc);
fs.writeFileSync(outputFile, allContents.join(""), "utf-8");

console.log(`✅ Dumped all files into ${outputFile}`);
