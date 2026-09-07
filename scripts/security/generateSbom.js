/**
 * ============================================================================
 * GreenPay Enterprise FinTech Systems - DevSecOps & Supply Chain Security
 * Script: generateSbom.js
 * Specification: OWASP CycloneDX v1.5 JSON Software Bill of Materials (SBOM)
 * Compliance Standard: PCI-DSS v4.0 Requirement 6.3.2 & Executive Order 14028
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
const OUTPUT_DIR = path.join(REPO_ROOT, 'reports', 'security');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'sbom-cyclonedx.json');

// Standard SPDX License Identifiers (Common in JavaScript Ecosystem)
const KNOWN_SPDX_IDS = new Set([
  '0BSD', 'AFL-1.1', 'AFL-1.2', 'AFL-2.0', 'AFL-2.1', 'AFL-3.0',
  'AGPL-1.0', 'AGPL-3.0', 'AGPL-3.0-only', 'AGPL-3.0-or-later',
  'Apache-1.0', 'Apache-1.1', 'Apache-2.0', 'APL-1.0', 'Artistic-1.0', 'Artistic-2.0',
  'BlueOak-1.0.0', 'BSD-1-Clause', 'BSD-2-Clause', 'BSD-3-Clause', 'BSD-4-Clause',
  'BSL-1.0', 'CC-BY-3.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'CC0-1.0',
  'CDDL-1.0', 'CDDL-1.1', 'CPL-1.0', 'EPL-1.0', 'EPL-2.0', 'EUPL-1.1', 'EUPL-1.2',
  'GPL-1.0', 'GPL-2.0', 'GPL-2.0-only', 'GPL-2.0-or-later', 'GPL-3.0', 'GPL-3.0-only', 'GPL-3.0-or-later',
  'ISC', 'LGPL-2.0', 'LGPL-2.1', 'LGPL-3.0', 'MIT', 'MIT-0', 'MPL-1.1', 'MPL-2.0',
  'MS-PL', 'MS-RL', 'OFL-1.1', 'PostgreSQL', 'Python-2.0', 'Unlicense', 'UPL-1.0', 'WTFPL', 'Zlib'
]);

/**
 * Generate standard Package URL (purl) compliant with CycloneDX and PackageURL specs
 * @param {string} name
 * @param {string} version
 * @returns {string}
 */
function generatePurl(name, version) {
  if (!name) return `pkg:npm/unknown@${version || '0.0.0'}`;
  if (name.startsWith('@')) {
    const parts = name.split('/');
    const scope = parts[0].slice(1);
    const pkg = parts[1] || '';
    return `pkg:npm/%40${encodeURIComponent(scope)}/${encodeURIComponent(pkg)}@${version || '0.0.0'}`;
  }
  return `pkg:npm/${encodeURIComponent(name)}@${version || '0.0.0'}`;
}

/**
 * Parse integrity string (e.g. sha512-... or sha1-...) to CycloneDX Hash structure
 * @param {string} integrity
 * @returns {Array<{alg: string, content: string}>}
 */
function parseIntegrity(integrity) {
  if (!integrity || typeof integrity !== 'string') return [];
  const hashes = [];
  const entries = integrity.trim().split(/\s+/);

  for (const entry of entries) {
    const dashIdx = entry.indexOf('-');
    if (dashIdx === -1) continue;

    const algStr = entry.substring(0, dashIdx).toLowerCase();
    const base64Hash = entry.substring(dashIdx + 1);

    let alg;
    if (algStr === 'sha512') alg = 'SHA-512';
    else if (algStr === 'sha384') alg = 'SHA-384';
    else if (algStr === 'sha256') alg = 'SHA-256';
    else if (algStr === 'sha1') alg = 'SHA-1';
    else if (algStr === 'md5') alg = 'MD5';
    else alg = algStr.toUpperCase();

    try {
      // CycloneDX schema expects hexadecimal hash content
      const hexContent = Buffer.from(base64Hash, 'base64').toString('hex');
      hashes.push({ alg, content: hexContent });
    } catch (e) {
      // Fallback if decoding fails
      hashes.push({ alg, content: base64Hash });
    }
  }

  return hashes;
}

/**
 * Format license into CycloneDX v1.5 license array format
 * @param {any} licenseData
 * @returns {Array}
 */
function formatCycloneDxLicenses(licenseData) {
  if (!licenseData) return [{ license: { name: 'UNKNOWN' } }];

  let licenseStr = '';
  if (typeof licenseData === 'string') {
    licenseStr = licenseData.trim();
  } else if (typeof licenseData === 'object') {
    if (Array.isArray(licenseData)) {
      return licenseData.flatMap(formatCycloneDxLicenses);
    }
    if (licenseData.type) {
      licenseStr = String(licenseData.type).trim();
    } else if (licenseData.name) {
      licenseStr = String(licenseData.name).trim();
    }
  }

  if (!licenseStr) return [{ license: { name: 'UNKNOWN' } }];

  // Check for expressions like (MIT OR Apache-2.0)
  if (licenseStr.includes(' OR ') || licenseStr.includes(' AND ') || licenseStr.startsWith('(')) {
    return [{ expression: licenseStr }];
  }

  // Normalize common variations
  const normalized = licenseStr === 'Apache 2.0' ? 'Apache-2.0' : licenseStr;

  if (KNOWN_SPDX_IDS.has(normalized)) {
    return [{ license: { id: normalized } }];
  }

  return [{ license: { name: licenseStr } }];
}

/**
 * Look up additional package metadata (description, license, etc.) from disk node_modules
 * @param {string} pkgName
 * @param {string[]} searchPaths
 * @returns {{description: string, license: any, homepage: string, repository: any}}
 */
function lookupPackageJson(pkgName, searchPaths) {
  for (const basePath of searchPaths) {
    const pkgJsonPath = path.join(basePath, 'node_modules', pkgName, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const raw = fs.readFileSync(pkgJsonPath, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          description: parsed.description || '',
          license: parsed.license || parsed.licenses,
          homepage: parsed.homepage || '',
          repository: parsed.repository
        };
      } catch (err) {
        // Continue searching
      }
    }
  }
  return { description: '', license: null, homepage: '', repository: null };
}

/**
 * Main SBOM Generation Engine
 */
function generateSbom() {
  console.log('=================================================================');
  console.log('🛡️  GreenPay Enterprise DevSecOps - CycloneDX SBOM Generator v1.5');
  console.log(`📂 Repository Root: ${REPO_ROOT}`);
  console.log('=================================================================');

  const targetProjects = [
    {
      id: 'backend',
      name: 'e-wallet-backend',
      dir: path.join(REPO_ROOT, 'e-wallet-backend'),
      pkgJson: path.join(REPO_ROOT, 'e-wallet-backend', 'package.json'),
      lockJson: path.join(REPO_ROOT, 'e-wallet-backend', 'package-lock.json')
    },
    {
      id: 'frontend',
      name: 'Wallet',
      dir: path.join(REPO_ROOT, 'Wallet'),
      pkgJson: path.join(REPO_ROOT, 'Wallet', 'package.json'),
      lockJson: path.join(REPO_ROOT, 'Wallet', 'package-lock.json')
    },
    {
      id: 'root',
      name: 'greenpay-monorepo-root',
      dir: REPO_ROOT,
      pkgJson: path.join(REPO_ROOT, 'package.json'),
      lockJson: path.join(REPO_ROOT, 'package-lock.json')
    }
  ];

  const nodeModulesSearchPaths = [
    path.join(REPO_ROOT, 'e-wallet-backend'),
    path.join(REPO_ROOT, 'Wallet'),
    REPO_ROOT
  ];

  // Map of unique components: Key = `${name}@${version}`
  const uniqueComponents = new Map();
  const directDependencyPurls = new Set();

  for (const project of targetProjects) {
    if (!fs.existsSync(project.pkgJson)) {
      continue;
    }

    console.log(`🔍 Inspecting project manifest: [${project.name}]`);

    // 1. Read package.json for direct dependencies
    let pkgJsonData = {};
    try {
      pkgJsonData = JSON.parse(fs.readFileSync(project.pkgJson, 'utf8'));
    } catch (e) {
      console.warn(`⚠️ Warning: Failed to parse ${project.pkgJson}: ${e.message}`);
    }

    const directDeps = Object.keys({
      ...(pkgJsonData.dependencies || {}),
      ...(pkgJsonData.devDependencies || {}),
      ...(pkgJsonData.optionalDependencies || {})
    });

    // 2. Read package-lock.json for full dependency tree (direct & transitive)
    if (fs.existsSync(project.lockJson)) {
      try {
        const lockContent = fs.readFileSync(project.lockJson, 'utf8');
        const lockData = JSON.parse(lockContent);

        // Handle lockfileVersion 2 & 3 (packages object)
        if (lockData.packages && typeof lockData.packages === 'object') {
          for (const [pkgPath, pkgInfo] of Object.entries(lockData.packages)) {
            // Skip root self-reference
            if (!pkgPath || pkgPath === '') continue;

            let name = pkgInfo.name;
            if (!name) {
              const marker = 'node_modules/';
              const lastIdx = pkgPath.lastIndexOf(marker);
              if (lastIdx !== -1) {
                name = pkgPath.substring(lastIdx + marker.length);
              } else {
                name = pkgPath;
              }
            }

            const version = pkgInfo.version || '0.0.0';
            const componentKey = `${name}@${version}`;

            // Disk metadata lookup if lockfile lacks description/license
            let description = pkgInfo.description || '';
            let license = pkgInfo.license;

            if (!description || !license) {
              const diskMeta = lookupPackageJson(name, nodeModulesSearchPaths);
              if (!description) description = diskMeta.description;
              if (!license) license = diskMeta.license;
            }

            const purl = generatePurl(name, version);
            const isDirect = directDeps.includes(name);
            if (isDirect) directDependencyPurls.add(purl);

            if (!uniqueComponents.has(componentKey)) {
              const hashes = parseIntegrity(pkgInfo.integrity);
              const licenses = formatCycloneDxLicenses(license);

              uniqueComponents.set(componentKey, {
                type: 'library',
                'bom-ref': purl,
                name: name,
                version: version,
                description: description || `${name} package`,
                scope: isDirect ? 'required' : 'optional',
                hashes: hashes.length > 0 ? hashes : undefined,
                licenses: licenses,
                purl: purl,
                properties: [
                  {
                    name: 'greenpay:source-project',
                    value: project.name
                  },
                  {
                    name: 'greenpay:dependency-type',
                    value: isDirect ? 'direct' : 'transitive'
                  }
                ]
              });
            }
          }
        }

        // Handle lockfileVersion 1 (dependencies tree fallback)
        if (lockData.dependencies && typeof lockData.dependencies === 'object') {
          function traverseV1(deps) {
            for (const [depName, depInfo] of Object.entries(deps)) {
              const version = depInfo.version || '0.0.0';
              const componentKey = `${depName}@${version}`;

              if (!uniqueComponents.has(componentKey)) {
                const diskMeta = lookupPackageJson(depName, nodeModulesSearchPaths);
                const purl = generatePurl(depName, version);
                const isDirect = directDeps.includes(depName);
                if (isDirect) directDependencyPurls.add(purl);

                uniqueComponents.set(componentKey, {
                  type: 'library',
                  'bom-ref': purl,
                  name: depName,
                  version: version,
                  description: diskMeta.description || `${depName} package`,
                  scope: isDirect ? 'required' : 'optional',
                  hashes: parseIntegrity(depInfo.integrity),
                  licenses: formatCycloneDxLicenses(diskMeta.license),
                  purl: purl,
                  properties: [
                    {
                      name: 'greenpay:source-project',
                      value: project.name
                    },
                    {
                      name: 'greenpay:dependency-type',
                      value: isDirect ? 'direct' : 'transitive'
                    }
                  ]
                });
              }

              if (depInfo.dependencies) {
                traverseV1(depInfo.dependencies);
              }
            }
          }
          traverseV1(lockData.dependencies);
        }
      } catch (err) {
        console.warn(`⚠️ Warning: Failed to parse lockfile ${project.lockJson}: ${err.message}`);
      }
    }
  }

  // Convert map to sorted component list for deterministic output
  const componentsList = Array.from(uniqueComponents.values()).sort((a, b) =>
    a.name.localeCompare(b.name) || a.version.localeCompare(b.version)
  );

  // Generate UUID v4 for CycloneDX serialNumber
  const serialUuid = crypto.randomUUID();
  const creationDate = new Date().toISOString();

  // Root CycloneDX Manifest Spec v1.5
  const cyclonedxManifest = {
    $schema: 'http://cyclonedx.org/schema/bom-1.5.json',
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber: `urn:uuid:${serialUuid}`,
    version: 1,
    metadata: {
      timestamp: creationDate,
      lifecycles: [
        {
          phase: 'build'
        }
      ],
      tools: [
        {
          vendor: 'GreenPay Security Engineering',
          name: 'greenpay-sbom-generator',
          version: '1.5.0'
        }
      ],
      authors: [
        {
          name: 'Principal DevSecOps & Mobile Security Architect',
          email: 'devsecops@greenpay.enterprise'
        }
      ],
      manufacture: {
        name: 'GreenPay Enterprise FinTech Systems',
        url: ['https://greenpay.enterprise']
      },
      component: {
        type: 'application',
        'bom-ref': 'pkg:npm/greenpay-platform@1.0.0',
        name: 'GreenPay Mobile & Backend Core',
        version: '1.0.0',
        description: 'GreenPay Mobile & Backend Core - Enterprise Monorepo Platform (React Native & Node.js Microservices)',
        licenses: [
          {
            license: {
              id: 'Proprietary'
            }
          }
        ],
        properties: [
          {
            name: 'compliance:regulation',
            value: 'PCI-DSS v4.0 Requirement 6.3.2'
          },
          {
            name: 'security:ecosystem',
            value: 'FinTech Banking & Digital Wallet'
          },
          {
            name: 'architecture:monorepo-structure',
            value: 'Wallet (Frontend React Native) + e-wallet-backend (Backend Express/MongoDB)'
          }
        ]
      }
    },
    components: componentsList,
    dependencies: [
      {
        ref: 'pkg:npm/greenpay-platform@1.0.0',
        dependsOn: Array.from(directDependencyPurls).sort()
      }
    ]
  };

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
  }

  // Write CycloneDX SBOM to file
  const jsonContent = JSON.stringify(cyclonedxManifest, null, 2);
  fs.writeFileSync(OUTPUT_FILE, jsonContent, 'utf8');

  console.log('-----------------------------------------------------------------');
  console.log(`✅ CycloneDX v1.5 SBOM generated successfully!`);
  console.log(`📄 Output File: ${OUTPUT_FILE}`);
  console.log(`📊 Total unique components indexed: ${componentsList.length}`);
  console.log(`🔑 Serial Number: urn:uuid:${serialUuid}`);
  console.log(`🕒 Timestamp: ${creationDate}`);
  console.log('=================================================================');

  return componentsList.length;
}

if (require.main === module) {
  generateSbom();
}

module.exports = { generateSbom };
