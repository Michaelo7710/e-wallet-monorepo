#!/usr/bin/env node

/**
 * ============================================================================
 * 🛡️ CI / DevSecOps Anti-Regression Guard: Alert.alert Extinction (v2.0)
 * ============================================================================
 * Memeriksa seluruh berkas kode sumber di folder `src/` untuk memastikan
 * tidak ada satupun pemanggilan atau impor `Alert` dari 'react-native'.
 * 
 * Fitur Deteksi v2.0 (TASK-DEVOPS-02):
 *  - Multi-line ES module import (import { \n Alert \n } from 'react-native')
 *  - Multi-line destructuring require (const { \n Alert \n } = require('react-native'))
 *  - Import / require aliases (Alert as RNAlert, Alert: RNAlert)
 *  - Direct require property access (require('react-native').Alert)
 *  - Direct invocation (Alert.alert(...))
 *  - Komentar aman (line/block comments disanitasi tanpa mengubah posisi baris)
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

/**
 * Membersihkan komentar blok dan komentar baris dengan spasi
 * sehingga nomor baris dan offset karakter tetap 100% presisi.
 */
function stripComments(source) {
  // Ganti komentar blok /* ... */ dengan spasi kecuali karakter newline
  let stripped = source.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    return match.replace(/[^\r\n]/g, ' ');
  });
  // Ganti komentar baris // ... dengan spasi
  stripped = stripped.replace(/\/\/.*$/gm, (match) => {
    return ' '.repeat(match.length);
  });
  return stripped;
}

/**
 * Mendapatkan nomor baris dan cuplikan teks berdasarkan indeks karakter
 */
function getLineInfo(rawContent, matchIndex, matchLength) {
  const upToMatch = rawContent.substring(0, matchIndex);
  const lineNumber = upToMatch.split('\n').length;
  const rawLines = rawContent.split('\n');
  const snippetLine = (rawLines[lineNumber - 1] || '').trim();
  const matchedText = rawContent.substring(matchIndex, matchIndex + matchLength).trim().replace(/\s+/g, ' ');

  return {
    lineNumber,
    snippet: snippetLine.length > 0 ? snippetLine : matchedText,
  };
}

/**
 * Memeriksa konten teks terhadap pola-pola larangan Alert
 * Mengembalikan array of violations.
 */
function auditContent(content, relativePath = 'unknown') {
  const violations = [];
  const cleanContent = stripComments(content);

  // Aturan 1: Multi-line / Single-line ES Module Import & Re-export
  // import { ... Alert ... } from 'react-native'
  // export { ... Alert ... } from 'react-native'
  const importExportRegex = /(?:import|export)\s*\{[\s\S]*?\bAlert\b[\s\S]*?\}\s*from\s*['"]react-native['"]/g;
  let match;
  while ((match = importExportRegex.exec(cleanContent)) !== null) {
    const { lineNumber, snippet } = getLineInfo(content, match.index, match[0].length);
    violations.push({
      file: relativePath,
      line: lineNumber,
      type: 'FORBIDDEN_IMPORT',
      snippet,
      message: 'Dilarang mengimpor `Alert` dari react-native. Gunakan `import { feedback } from "@core/feedback"`.',
    });
  }

  // Aturan 2: Multi-line / Single-line Destructuring CommonJS Require
  // const { ... Alert ... } = require('react-native')
  const requireDestructureRegex = /(?:const|let|var)\s*\{[\s\S]*?\bAlert\b[\s\S]*?\}\s*=\s*require\s*\(\s*['"]react-native['"]\s*\)/g;
  while ((match = requireDestructureRegex.exec(cleanContent)) !== null) {
    const { lineNumber, snippet } = getLineInfo(content, match.index, match[0].length);
    violations.push({
      file: relativePath,
      line: lineNumber,
      type: 'FORBIDDEN_REQUIRE',
      snippet,
      message: 'Dilarang melakukan require `Alert` dari react-native. Gunakan `@core/feedback`.',
    });
  }

  // Aturan 3: Direct Property Access Require
  // require('react-native').Alert
  // const Alert = require('react-native').Alert
  const requireDirectPropRegex = /require\s*\(\s*['"]react-native['"]\s*\)\.Alert\b/g;
  while ((match = requireDirectPropRegex.exec(cleanContent)) !== null) {
    const { lineNumber, snippet } = getLineInfo(content, match.index, match[0].length);
    violations.push({
      file: relativePath,
      line: lineNumber,
      type: 'FORBIDDEN_REQUIRE_PROP',
      snippet,
      message: 'Dilarang mengakses properti `Alert` dari require("react-native"). Gunakan `@core/feedback`.',
    });
  }

  // Aturan 4: Direct Invocation Alert.alert(...)
  const callAlertRegex = /\bAlert\.alert\s*\(/g;
  while ((match = callAlertRegex.exec(cleanContent)) !== null) {
    const { lineNumber, snippet } = getLineInfo(content, match.index, match[0].length);
    violations.push({
      file: relativePath,
      line: lineNumber,
      type: 'FORBIDDEN_CALL',
      snippet,
      message: 'Dilarang menggunakan `Alert.alert(...)`. Gunakan `feedback.dialog.*` atau `feedback.toast.*`.',
    });
  }

  return violations;
}

/**
 * Audit satu berkas
 */
function checkFileForAlert(filePath, baseDir = path.resolve(__dirname, '../..')) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(baseDir, filePath);
  return auditContent(content, relPath);
}

/**
 * Traversal direktori rekursif tanpa dependensi eksternal
 */
function scanDirectory(dir, allViolations = [], fileCounter = { count: 0 }) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath, allViolations, fileCounter);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (VALID_EXTENSIONS.has(ext)) {
        fileCounter.count++;
        const fileViolations = checkFileForAlert(fullPath);
        if (fileViolations.length > 0) {
          allViolations.push(...fileViolations);
        }
      }
    }
  }
  return { violations: allViolations, totalFilesScanned: fileCounter.count };
}

/**
 * CLI Runner jika dieksekusi langsung
 */
function runCLI() {
  console.log('===============================================================');
  console.log('🛡️  GREENPAY CI ANTI-REGRESSION GUARD: RAW ALERT DETECTOR (v2.0)');
  console.log('===============================================================');
  console.log(`📁 Memindai direktori: ${ROOT_SRC}`);

  const results = scanDirectory(ROOT_SRC);
  const { violations, totalFilesScanned } = results;

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
}

if (require.main === module) {
  runCLI();
}

module.exports = {
  stripComments,
  getLineInfo,
  auditContent,
  checkFileForAlert,
  scanDirectory,
  runCLI,
};
