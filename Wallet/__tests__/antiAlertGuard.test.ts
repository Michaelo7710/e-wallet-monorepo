declare const __dirname: string;

const { execSync } = require('child_process');
const path = require('path');

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
    // Jalankan inline node script yang menguji regex terhadap kode sampel pelanggaran
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
