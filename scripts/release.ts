import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PACKAGES = ['packages/core', 'packages/react'];

interface PackageJson {
  name: string;
  version: string;
}

function readPackageJson(dir: string): PackageJson {
  const path = join(ROOT, dir, 'package.json');
  return JSON.parse(readFileSync(path, 'utf-8')) as PackageJson;
}

function writePackageJson(dir: string, pkg: PackageJson): void {
  const path = join(ROOT, dir, 'package.json');
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

function getCommitsSinceLastTag(): string {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', {
      encoding: 'utf-8',
    }).trim();

    const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
    return execSync(`git log ${range} --oneline`, { encoding: 'utf-8' });
  } catch {
    return '';
  }
}

function hasReleasableCommits(): boolean {
  const gitLog = getCommitsSinceLastTag();
  if (!gitLog.trim()) return false;

  const lines = gitLog.trim().split('\n');
  const nonReleaseCommits = lines.filter((line) => !line.includes('chore: release v'));
  return nonReleaseCommits.length > 0;
}

function getConventionalBump(): 'major' | 'minor' | 'patch' {
  const gitLog = getCommitsSinceLastTag();

  if (gitLog.includes('BREAKING CHANGE') || gitLog.includes('!:')) return 'major';
  if (/feat[:(]/.test(gitLog)) return 'minor';
  return 'patch';
}

function bumpVersion(version: string, type: 'major' | 'minor' | 'patch'): string {
  const [major = 0, minor = 0, patch = 0] = version.split('.').map(Number);
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
  }
}

type BumpType = 'major' | 'minor' | 'patch';

function isValidBumpType(value: string | undefined): value is BumpType {
  return value === 'major' || value === 'minor' || value === 'patch';
}

function log(message: string): void {
  process.stdout.write(`${message}\n`);
}

function run(): void {
  const arg = process.argv[2];

  if (arg === '--check-only') {
    if (!hasReleasableCommits()) {
      log('📦 No releasable commits found, skipping release.');
      process.exit(1);
    }
    log('📦 Releasable commits found.');
    process.exit(0);
  }

  if (!hasReleasableCommits()) {
    log('📦 No releasable commits found, skipping release.');
    return;
  }

  const bump: BumpType = isValidBumpType(arg) ? arg : getConventionalBump();

  log(`📦 Detected bump type: ${bump}`);

  const corePkg = readPackageJson('packages/core');
  const newVersion = bumpVersion(corePkg.version, bump);

  log(`📦 Bumping version: ${corePkg.version} → ${newVersion}`);

  for (const dir of PACKAGES) {
    const pkg = readPackageJson(dir);
    pkg.version = newVersion;
    writePackageJson(dir, pkg);
    log(`   ✓ ${pkg.name}@${newVersion}`);
  }

  execSync('git add packages/*/package.json', { stdio: 'inherit' });
  execSync(`git commit -m "chore: release v${newVersion}" --no-verify`, { stdio: 'inherit' });

  for (const dir of PACKAGES) {
    const pkg = readPackageJson(dir);
    const tag = `${pkg.name}@${newVersion}`;
    execSync(`git tag ${tag}`, { stdio: 'inherit' });
    log(`   🏷️  ${tag}`);
  }

  log('\n📤 Pushing to remote...');
  execSync('git push', { stdio: 'inherit' });
  execSync('git push --tags', { stdio: 'inherit' });

  log(`\n✅ Release v${newVersion} published.`);
}

run();
