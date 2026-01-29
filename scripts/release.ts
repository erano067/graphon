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

function getLatestReleaseTag(): string | null {
  try {
    const tags = execSync('git tag -l "@graphon/core@*" --sort=-v:refname', {
      encoding: 'utf-8',
    }).trim();
    const firstTag = tags.split('\n')[0];
    return firstTag === '' ? null : firstTag;
  } catch {
    return null;
  }
}

function getCommitsSinceTag(tag: string | null): string {
  try {
    if (tag === null) {
      return execSync('git log --oneline', { encoding: 'utf-8' });
    }
    return execSync(`git log ${tag}..HEAD --oneline`, { encoding: 'utf-8' });
  } catch {
    return '';
  }
}

function isHeadReleaseCommit(): boolean {
  const headMessage = execSync('git log -1 --format=%s', { encoding: 'utf-8' }).trim();
  return headMessage.startsWith('chore: release v');
}

function hasReleasableCommits(latestTag: string | null): boolean {
  if (isHeadReleaseCommit()) return false;

  const gitLog = getCommitsSinceTag(latestTag);
  if (gitLog.trim() === '') return false;

  const lines = gitLog.trim().split('\n');
  const nonReleaseCommits = lines.filter((line) => !line.includes('chore: release v'));
  return nonReleaseCommits.length > 0;
}

function getConventionalBump(latestTag: string | null): 'major' | 'minor' | 'patch' {
  const gitLog = getCommitsSinceTag(latestTag);

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
  execSync('git fetch --tags', { stdio: 'inherit' });

  const arg = process.argv[2];
  const latestTag = getLatestReleaseTag();
  const corePkg = readPackageJson('packages/core');
  const currentVersion = corePkg.version;

  if (arg === '--check-only') {
    if (!hasReleasableCommits(latestTag)) {
      log('📦 No releasable commits found, skipping release.');
      process.exit(1);
    }
    log('📦 Releasable commits found.');
    process.exit(0);
  }

  if (!hasReleasableCommits(latestTag)) {
    log('📦 No releasable commits found, skipping release.');
    return;
  }

  const bump: BumpType = isValidBumpType(arg) ? arg : getConventionalBump(latestTag);
  const newVersion = bumpVersion(currentVersion, bump);

  log(`📦 Detected bump type: ${bump}`);
  log(`📦 Bumping version: ${currentVersion} → ${newVersion}`);

  for (const dir of PACKAGES) {
    const pkg = readPackageJson(dir);
    pkg.version = newVersion;
    writePackageJson(dir, pkg);
    log(`   ✓ ${pkg.name}@${newVersion}`);
  }

  execSync('git add packages/*/package.json', { stdio: 'inherit' });
  execSync(`git commit -m "chore: release v${newVersion}" --no-verify`, { stdio: 'inherit' });

  log(`\n✅ Release v${newVersion} committed locally.`);
  log('   CI will push after successful npm publish.');
}

run();
