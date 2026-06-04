// Script para deploy manual a GitHub Pages
// Crea un commit con el contenido de frontend/ en la rama gh-pages
// Uso: node deploy-gh-pages.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, 'frontend');
const TMP_DIR = path.join(__dirname, '_gh_pages_tmp');

console.log('🚀 Preparando deploy a GitHub Pages...');

// 1. Limpiar temp
if (fs.existsSync(TMP_DIR)) {
  fs.rmSync(TMP_DIR, { recursive: true });
}

// 2. Copiar frontend a temp
fs.cpSync(FRONTEND_DIR, TMP_DIR, { recursive: true });

// 3. Crear .nojekyll para evitar problemas con archivos _*
fs.writeFileSync(path.join(TMP_DIR, '.nojekyll'), '');

// 4. Inicializar git en temp y hacer commit
const cmds = [
  `cd "${TMP_DIR}" && git init`,
  `cd "${TMP_DIR}" && git checkout -b gh-pages`,
  `cd "${TMP_DIR}" && git add -A`,
  `cd "${TMP_DIR}" && git commit -m "Deploy SISGEN v2.1 - $(date)"`,
  `cd "${TMP_DIR}" && git remote add origin https://github.com/eliecerzunigab-gif/APP_CARCELES_CHILE.git`,
  `cd "${TMP_DIR}" && git push -f origin gh-pages`
];

for (const cmd of cmds) {
  console.log(`> ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}

// 5. Limpiar
fs.rmSync(TMP_DIR, { recursive: true });

console.log('✅ Deploy completado!');
console.log('🌐 URL: https://eliecerzunigab-gif.github.io/APP_CARCELES_CHILE/');
