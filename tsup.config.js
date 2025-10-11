'use strict';

const { join, relative, sep } = require('node:path');
const { readdirSync } = require('node:fs');
const { defineConfig } = require('tsup');

const srcDir = join(__dirname, 'src');

const collectSourceFiles = (dir) => {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__specs__' || entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
};

const jsFiles = collectSourceFiles(srcDir);

const entry = Object.fromEntries(
  jsFiles.map((file) => {
    const rel = relative(srcDir, file).replace(/\.js$/, '');
    const posixKey = rel.split(sep).join('/');
    return [posixKey, file];
  }),
);

module.exports = defineConfig({
  entry,
  bundle: false,
  splitting: false,
  format: ['cjs'],
  outDir: 'dist',
  target: 'es2015',
  sourcemap: false,
  minify: false,
  clean: true,
  skipNodeModulesBundle: true,
  keepNames: true,
});
