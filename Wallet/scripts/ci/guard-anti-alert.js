#!/usr/bin/env node

/**
 * ============================================================================
 * 🛡️ CI / DevSecOps Anti-Regression Guard: Alert.alert Extinction
 * ============================================================================
 * Memeriksa seluruh berkas kode sumber di folder `src/` untuk memastikan
 * tidak ada satupun pemanggilan atau impor `Alert` dari 'react-native'.
 * Seluruh komponen WAJIB menggunakan `@core/feedback` (feedback.dialog / feedback.toast).
 *
 * Exit Code:
 *  0 = Steril, tidak ada pelanggaran (CI Pass)
 *  1 = Terdeteksi pelanggaran import/call Alert (CI Fail)
 * ============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT_SRC = path.resolve(__dirname, '../../src');
const VALID_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

let totalFilesScanned = 0;
const violations = [];

/**
 * Traversal direktori rekursif tanpa dependensi eksternal
 */
function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (VALID_EXTENSIONS.has(ext)) {
        checkFileForAlert(fullPath);
      }
    }
  }
}

/**
 * Audit isi berkas baris-per-baris
 */
function checkFileForAlert(filePath) {
  totalFilesScanned++;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    // Lewati baris komentar
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      return;
    }

    // 1. Deteksi import Alert dari react-native
    const importAlertRegex = /import\s+{[^}]*\bAlert\b[^}]*}\s+from\s+['"]react-native['"]/;
    if (importAlertRegex.test(line)) {
      violations.push({
        file: path.relative(path.resolve(__dirname, '../..'), filePath),
        line: lineNumber,
        type: 'FORBIDDEN_IMPORT',
        snippet: trimmed,
        message: 'Dilarang mengimpor `Alert` dari react-native. Gunakan `import { feedback } from "@core/feedback"`.',
      });
    }

    // 2. Deteksi pemanggilan Alert.alert
    const callAlertRegex = /\bAlert\.alert\s*\(/;
    if (callAlertRegex.test(line)) {
      violations.push({
        file: path.relative(path.resolve(__dirname, '../..'), filePath),
        line: lineNumber,
        type: 'FORBIDDEN_CALL',
        snippet: trimmed,
        message: 'Dilarang menggunakan `Alert.alert(...)`. Gunakan `feedback.dialog.*` atau `feedback.toast.*`.',
      });
    }
  });
}

console.log('===============================================================');
console.log('🛡️  GREENPAY CI ANTI-REGRESSION GUARD: RAW ALERT DETECTOR');
console.log('===============================================================');
console.log(`📁 Memindai direktori: ${ROOT_SRC}`);

scanDirectory(ROOT_SRC);

console.log(`📊 Total berkas dipindai: ${totalFilesScanned} berkas`);

if (violations.length === 0) {
  console.log('===============================================================');
  console.log('✅ STATUS: LULUS (CLEAN)');
  console.log('🎉 100% kode sumber steril dari Alert react-native.');
  console.log('🚀 Seluruh notifikasi mematuhi arsitektur Unified Feedback System.');
  console.log('===============================================================');
  process.exit(0);
} else {
  console.error('===============================================================');
  console.error(`❌ STATUS: GAGAL! Ditemukan ${violations.length} pelanggaran:`);
  console.error('===============================================================');

  violations.forEach((v, i) => {
    console.error(`\n[Pelanggaran #${i + 1}]`);
    console.error(`  Berkas : ${v.file}:${v.line}`);
    console.error(`  Tipe   : ${v.type}`);
    console.error(`  Baris  : ${v.snippet}`);
    console.error(`  Pesan  : ${v.message}`);
  });

  console.error('\n🚫 CI Build digagalkan secara otomatis untuk mencegah regresi.');
  process.exit(1);
}
