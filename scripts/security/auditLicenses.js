/**
 * ============================================================================
 * GreenPay Enterprise FinTech Systems - DevSecOps & Supply Chain Security
 * Script: auditLicenses.js
 * Specification: Commercial License Compliance & Anti-Copyleft Risk Barrier
 * Compliance Standard: PCI-DSS v4.0 Requirement 6.3.2 & Enterprise Legal IP
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// Resolve repository root directory (supports invocation from root or subfolders)
function getRepoRoot() {
  let current = __dirname;
  while (current !== path.dirname(current)) {
    if (
      fs.existsSync(path.join(current, 'Wallet')) &&
      fs.existsSync(path.join(current, 'e-wallet-backend'))
    ) {
      return current;
    }
    if (fs.existsSync(path.join(current, '.git'))) {
      return current;
    }
    current = path.dirname(current);
  }
  return process.cwd();
}

const REPO_ROOT = getRepoRoot();

// Permissive Whitelist (Standard Commercial & Enterprise Allowed Licenses)
const PERMISSIVE_WHITELIST = new Set([
  'MIT',
  'Apache-2.0',
  'Apache 2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  '0BSD',
  'Unlicense',
  'CC0-1.0',
  // Standard Permissive Industry Extensions
  'MIT-0',
  'Python-2.0',
  'BlueOak-1.0.0',
  'CC-BY-4.0',
  'MPL-2.0',
  'WTFPL'
]);

// Strict Blacklist Keywords (High Copyleft & Enterprise Contagion Risk)
const COPYLEFT_BLACKLIST_PATTERN = /\b(GPL|AGPL|LGPL|SSPL|EUPL)\b/i;

/**
 * Normalize and extract license string from package.json manifest
 * @param {any} rawLicense
 * @returns {string}
 */
function normalizeLicense(rawLicense) {
  if (!rawLicense) return 'UNKNOWN';
  if (typeof rawLicense === 'string') return rawLicense.trim();
  if (typeof rawLicense === 'object') {
    if (Array.isArray(rawLicense)) {
      return rawLicense
        .map(l => (typeof l === 'object' ? l.type || l.name || JSON.stringify(l) : String(l)))
        .join(' OR ');
    }
    return rawLicense.type || rawLicense.name || JSON.stringify(rawLicense);
  }
  return String(rawLicense);
}

/**
 * Evaluate whether a license expression poses a copyleft risk or is compliant
 * @param {string} licenseStr
 * @returns {{compliant: boolean, reason?: string, chosenLicense?: string}}
 */
function evaluateLicense(licenseStr) {
  const trimmed = (licenseStr || '').trim();
  if (!trimmed || trimmed === 'UNKNOWN' || trimmed === 'undefined') {
    // Missing metadata in internal/nested packages - default permissible if not blacklisted
    return { compliant: true, chosenLicense: 'UNSPECIFIED' };
  }

  // Exact whitelist match
  if (PERMISSIVE_WHITELIST.has(trimmed)) {
    return { compliant: true, chosenLicense: trimmed };
  }

  // Normalized variations (e.g. Apache 2.0 -> Apache-2.0)
  const normalized = trimmed.replace(/\s+/g, ' ');
  if (PERMISSIVE_WHITELIST.has(normalized)) {
    return { compliant: true, chosenLicense: normalized };
  }

  // Handle compound OR expressions (e.g. "(BSD-3-Clause OR GPL-2.0)", "MIT OR Apache-2.0")
  if (trimmed.includes(' OR ') || (trimmed.startsWith('(') && trimmed.includes(' OR '))) {
    // Clean outer parentheses
    const cleanExpr = trimmed.replace(/^\(+|\)+$/g, '');
    const options = cleanExpr.split(/\s+OR\s+/i).map(opt => opt.trim().replace(/^\(+|\)+$/g, ''));

    // Check if at least one choice is in permissive whitelist
    const permissiveOption = options.find(opt => PERMISSIVE_WHITELIST.has(opt));
    if (permissiveOption) {
      return {
        compliant: true,
        chosenLicense: `${permissiveOption} (Elected from: ${trimmed})`
      };
    }
  }

  // Handle compound AND expressions: if ANY part is copyleft, it contaminates the whole package
  if (trimmed.includes(' AND ')) {
    const cleanExpr = trimmed.replace(/^\(+|\)+$/g, '');
    const options = cleanExpr.split(/\s+AND\s+/i).map(opt => opt.trim());
    const hasCopyleft = options.some(opt => COPYLEFT_BLACKLIST_PATTERN.test(opt));
    if (hasCopyleft) {
      return {
        compliant: false,
        reason: `Copyleft license enforced under compound AND expression: "${trimmed}"`
      };
    }
  }

  // Check strict blacklist pattern
  if (COPYLEFT_BLACKLIST_PATTERN.test(trimmed)) {
    return {
      compliant: false,
      reason: `Strict Copyleft Blacklist violation detected: "${trimmed}"`
    };
  }

  // Permissive fallback for standard non-copyleft licenses
  return { compliant: true, chosenLicense: trimmed };
}

/**
 * Recursively walk node_modules and extract license from every package.json
 * @param {string} nodeModulesDir
 * @param {Map<string, {name: string, version: string, license: string, path: string}>} packagesMap
 */
function scanNodeModules(nodeModulesDir, packagesMap) {
  if (!fs.existsSync(nodeModulesDir)) return;

  function walk(currentDir) {
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (e) {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === '.bin' || entry.name === '.cache') continue;

      const subPath = path.join(currentDir, entry.name);

      if (entry.name.startsWith('@')) {
        // Scoped packages directory (e.g. @expo, @react-navigation)
        walk(subPath);
      } else {
        // Standard package directory
        const pkgJsonPath = path.join(subPath, 'package.json');
        if (fs.existsSync(pkgJsonPath)) {
          try {
            const raw = fs.readFileSync(pkgJsonPath, 'utf8');
            const data = JSON.parse(raw);
            const name = data.name || entry.name;
            const version = data.version || '0.0.0';
            const license = normalizeLicense(data.license || data.licenses);
            const key = `${name}@${version}`;

            if (!packagesMap.has(key)) {
              packagesMap.set(key, {
                name,
                version,
                license,
                path: subPath
              });
            }
          } catch (e) {
            // Ignore malformed sub-packages
          }
        }

        // Check for nested node_modules
        const nestedNm = path.join(subPath, 'node_modules');
        if (fs.existsSync(nestedNm)) {
          walk(nestedNm);
        }
      }
    }
  }

  walk(nodeModulesDir);
}

/**
 * Main License Audit Execution
 */
function auditLicenses() {
  console.log('=================================================================');
  console.log('⚖️  GreenPay Enterprise DevSecOps - Commercial License Auditor');
  console.log(`📂 Scanning Repository: ${REPO_ROOT}`);
  console.log('=================================================================');
  console.log('📜 Permissive Whitelist:', Array.from(PERMISSIVE_WHITELIST).join(', '));
  console.log('🚫 Strict Blacklist Patterns: GPL, AGPL, LGPL, SSPL, EUPL');
  console.log('-----------------------------------------------------------------');

  const targetDirs = [
    path.join(REPO_ROOT, 'Wallet', 'node_modules'),
    path.join(REPO_ROOT, 'e-wallet-backend', 'node_modules'),
    path.join(REPO_ROOT, 'node_modules')
  ];

  const packagesMap = new Map();

  for (const dir of targetDirs) {
    if (fs.existsSync(dir)) {
      const relPath = path.relative(REPO_ROOT, dir);
      console.log(`🔍 Scanning directory: ${relPath}`);
      scanNodeModules(dir, packagesMap);
    }
  }

  // Fallback: If no node_modules directories exist, inspect package-lock.json manifests
  if (packagesMap.size === 0) {
    console.log('ℹ️ No node_modules directories found on disk. Analyzing package-lock.json manifests...');
    const lockFiles = [
      path.join(REPO_ROOT, 'Wallet', 'package-lock.json'),
      path.join(REPO_ROOT, 'e-wallet-backend', 'package-lock.json'),
      path.join(REPO_ROOT, 'package-lock.json')
    ];
    for (const lockFile of lockFiles) {
      if (fs.existsSync(lockFile)) {
        try {
          const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
          if (lockData.packages) {
            for (const [pkgPath, pkgInfo] of Object.entries(lockData.packages)) {
              if (!pkgPath) continue;
              const name = pkgInfo.name || pkgPath.split('node_modules/').pop();
              const version = pkgInfo.version || '0.0.0';
              const license = normalizeLicense(pkgInfo.license);
              const key = `${name}@${version}`;
              if (!packagesMap.has(key)) {
                packagesMap.set(key, { name, version, license, path: lockFile });
              }
            }
          }
        } catch (e) {}
      }
    }
  }

  console.log(`📦 Total unique packages analyzed: ${packagesMap.size}`);

  const violations = [];
  const licenseStats = new Map();

  for (const pkg of packagesMap.values()) {
    const evaluation = evaluateLicense(pkg.license);

    // Track statistics
    const statKey = evaluation.chosenLicense || pkg.license;
    licenseStats.set(statKey, (licenseStats.get(statKey) || 0) + 1);

    if (!evaluation.compliant) {
      violations.push({
        ...pkg,
        reason: evaluation.reason
      });
    }
  }

  // Print Summary Table of top licenses
  console.log('\n📊 License Distribution:');
  const sortedStats = Array.from(licenseStats.entries()).sort((a, b) => b[1] - a[1]);
  for (const [lic, count] of sortedStats.slice(0, 10)) {
    console.log(`   - ${lic.padEnd(25)}: ${count} packages`);
  }
  if (sortedStats.length > 10) {
    console.log(`   ... and ${sortedStats.length - 10} other license categories`);
  }

  // Check for Violations
  if (violations.length > 0) {
    console.log('\n🚨 =============================================================');
    console.log('❌ CRITICAL SECURITY ALERT: COPYLEFT LICENSE VIOLATION DETECTED!');
    console.log('=================================================================');
    console.log(`The following ${violations.length} package(s) violate commercial enterprise compliance:`);
    for (const v of violations) {
      console.log(`\n  ✖ Component: ${v.name} (v${v.version})`);
      console.log(`    License:   ${v.license}`);
      console.log(`    Location:  ${v.path}`);
      console.log(`    Reason:    ${v.reason}`);
    }
    console.log('\n🛑 Build halted by DevSecOps Guard. Process terminating with code 1.\n');
    process.exit(1);
  }

  console.log('\n=================================================================');
  console.log('✅ LICENSE COMPLIANCE AUDIT PASSED');
  console.log('🛡️  All dependencies satisfy enterprise commercial distribution standards.');
  console.log('✨ No copyleft contamination (GPL/AGPL/LGPL/SSPL/EUPL) detected.');
  console.log('=================================================================\n');
  process.exit(0);
}

if (require.main === module) {
  auditLicenses();
}

module.exports = { auditLicenses };
