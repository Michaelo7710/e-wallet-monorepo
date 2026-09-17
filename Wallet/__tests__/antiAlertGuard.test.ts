declare const __dirname: string;

const { execSync } = require('child_process');
const path = require('path');
const { auditContent, stripComments } = require('../scripts/ci/guard-anti-alert.js');

describe('TASK-DEVOPS-01: CI Anti-Regression Guard Tests', () => {
  const guardScriptPath = path.resolve(__dirname, '../scripts/ci/guard-anti-alert.js');

  it('harus memverifikasi bahwa codebase src/ saat ini 100% bebas dari raw Alert (Exit Code 0)', () => {
    let output = '';
    let exitCode = 0;

    try {
      output = execSync(`node "${guardScriptPath}"`, {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf8',
      });
    } catch (err: any) {
      exitCode = err.status || 1;
      output = err.stdout || err.message;
    }

    expect(exitCode).toBe(0);
    expect(output).toContain('STATUS: LULUS (CLEAN)');
    expect(output).toContain('100% kode sumber steril dari Alert react-native');
  });

  it('harus menggagalkan build jika terdeteksi import Alert dari react-native (Negative Test)', () => {
    const violationImportCode = "import { View, Text, Alert } from 'react-native';";
    const importRegex = /import\s+{[^}]*\bAlert\b[^}]*}\s+from\s+['"]react-native['"]/;

    expect(importRegex.test(violationImportCode)).toBe(true);

    const validImportCode = "import { feedback } from '@core/feedback';";
    expect(importRegex.test(validImportCode)).toBe(false);
  });

  it('harus menggagalkan build jika terdeteksi pemanggilan Alert.alert(...) (Negative Test)', () => {
    const violationCallCode = "Alert.alert('Peringatan', 'Terjadi kesalahan sistem');";
    const callRegex = /\bAlert\.alert\s*\(/;

    expect(callRegex.test(violationCallCode)).toBe(true);

    const validCallCode = "feedback.dialog.error('Peringatan', 'Terjadi kesalahan sistem');";
    expect(callRegex.test(validCallCode)).toBe(false);
  });
});

describe('TASK-DEVOPS-02: Advanced Multi-line & Require Detection Guard Tests', () => {
  it('harus mendeteksi import Alert multi-baris dari react-native', () => {
    const multiLineImportCode = `
import {
  View,
  Text,
  Alert,
  TouchableOpacity
} from 'react-native';
    `;
    const violations = auditContent(multiLineImportCode, 'test/MultiLineImport.tsx');
    expect(violations.length).toBe(1);
    expect(violations[0].type).toBe('FORBIDDEN_IMPORT');
    expect(violations[0].file).toBe('test/MultiLineImport.tsx');
    expect(violations[0].line).toBe(2);
  });

  it('harus mendeteksi import Alert dengan alias (as RNAlert)', () => {
    const aliasImportCode = `
import { Alert as RNAlert, StyleSheet } from 'react-native';
    `;
    const violations = auditContent(aliasImportCode, 'test/AliasImport.tsx');
    expect(violations.length).toBe(1);
    expect(violations[0].type).toBe('FORBIDDEN_IMPORT');
    expect(violations[0].line).toBe(2);
  });

  it('harus mendeteksi re-export Alert dari react-native', () => {
    const exportCode = `
export { Alert } from 'react-native';
    `;
    const violations = auditContent(exportCode, 'test/ExportAlert.ts');
    expect(violations.length).toBe(1);
    expect(violations[0].type).toBe('FORBIDDEN_IMPORT');
  });

  it('harus mendeteksi pemanggilan require("react-native") dengan destructuring multi-baris', () => {
    const multiLineRequireCode = `
const {
  View,
  Alert,
  Text
} = require('react-native');
    `;
    const violations = auditContent(multiLineRequireCode, 'test/MultiLineRequire.js');
    expect(violations.length).toBe(1);
    expect(violations[0].type).toBe('FORBIDDEN_REQUIRE');
    expect(violations[0].line).toBe(2);
  });

  it('harus mendeteksi require("react-native") dengan alias (Alert: CustomAlert)', () => {
    const aliasRequireCode = `
const { Alert: CustomAlert } = require('react-native');
    `;
    const violations = auditContent(aliasRequireCode, 'test/AliasRequire.js');
    expect(violations.length).toBe(1);
    expect(violations[0].type).toBe('FORBIDDEN_REQUIRE');
  });

  it('harus mendeteksi direct property access require("react-native").Alert', () => {
    const directPropRequireCode = `
const Alert = require('react-native').Alert;
    `;
    const violations = auditContent(directPropRequireCode, 'test/DirectPropRequire.js');
    expect(violations.length).toBe(1);
    expect(violations[0].type).toBe('FORBIDDEN_REQUIRE_PROP');
    expect(violations[0].line).toBe(2);
  });

  it('harus mengabaikan penyebutan Alert di dalam komentar satu baris dan blok', () => {
    const commentedCode = `
// import { Alert } from 'react-native';
// const { Alert } = require('react-native');
/*
 * Dilarang menggunakan:
 * Alert.alert('Test', 'Error');
 * import {
 *   Alert
 * } from 'react-native';
 */
import { feedback } from '@core/feedback';

export const handleAction = () => {
  // Alert.alert('Halo');
  feedback.toast.success('Berhasil');
};
    `;
    const violations = auditContent(commentedCode, 'test/CommentedFile.tsx');
    expect(violations.length).toBe(0);
  });

  it('harus menghitung nomor baris pelanggaran secara presisi meskipun ada komentar blok sebelumnya', () => {
    const codeWithCommentAndViolation = `/**
 * Modul autentikasi
 * Harap jangan ubah kode di bawah ini
 */
import React from 'react';
import {
  View,
  Alert
} from 'react-native';
    `;
    const violations = auditContent(codeWithCommentAndViolation, 'test/PreciseLine.tsx');
    expect(violations.length).toBe(1);
    expect(violations[0].line).toBe(6);
  });
});
