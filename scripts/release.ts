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

function log(message: string): void {
  process.stdout.write(`${message}\n`);
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

function getVersionFromTag(tag: string): string {
  return tag.replace('@graphon/core@', '');
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

function getPublishedVersion(packageName: string): string | null {
  try {
    return execSync(`npm view ${packageName} version 2>/dev/null`, {
      encoding: 'utf-8',
    }).trim();
  } catch {
    return null;
  }
}

function tagExists(tag: string): boolean {
  const result = execSync(`git tag -l "${tag}"`, { encoding: 'utf-8' }).trim();
  return result !== '';
}

function bump(): void {
  execSync('git fetch --tags', { stdio: 'inherit' });

  const latestTag = getLatestReleaseTag();
  const corePkg = readPackageJson('packages/core');
  const currentVersion = corePkg.version;

  if (latestTag === null) {
    log('📦 No release tags found, skipping bump.');
    return;
  }

  const tagVersion = getVersionFromTag(latestTag);

  if (currentVersion !== tagVersion) {
    log(`📦 Version ${currentVersion} differs from tag ${tagVersion}, already bumped.`);
    return;
  }

  const commits = getCommitsSinceTag(latestTag).trim();
  if (commits === '') {
    log('📦 No commits since last release, skipping.');
    return;
  }

  const nonReleaseCommits = commits.split('\n').filter((l) => !l.includes('chore: release v'));
  if (nonReleaseCommits.length === 0) {
    log('📦 No releasable commits, skipping.');
    return;
  }

  const bumpType = getConventionalBump(latestTag);
  const newVersion = bumpVersion(currentVersion, bumpType);

  log(`📦 Bumping version: ${currentVersion} → ${newVersion} (${bumpType})`);

  for (const dir of PACKAGES) {
    const pkg = readPackageJson(dir);
    pkg.version = newVersion;
    writePackageJson(dir, pkg);
    log(`   ✓ ${pkg.name}@${newVersion}`);
  }

  log('\n✅ Version bumped. Commit and push to trigger CI publish.');
}

function publish(): void {
  const corePkg = readPackageJson('packages/core');
  const { version } = corePkg;
  const publishedVersion = getPublishedVersion(corePkg.name);

  if (publishedVersion === version) {
    log(`📦 v${version} already published on npm.`);
  } else {
    log(`📦 Publishing v${version} to npm...`);
    for (const dir of PACKAGES) {
      const pkgPath = join(ROOT, dir);
      log(`   Publishing ${dir}...`);
      execSync('npm publish --access public', { stdio: 'inherit', cwd: pkgPath });
    }
    log(`✅ Published v${version} to npm.`);
  }

  const coreTag = `@graphon/core@${version}`;
  const reactTag = `@graphon/react@${version}`;

  if (tagExists(coreTag)) {
    log(`🏷️  Tags already exist, skipping.`);
  } else {
    log(`🏷️  Creating tags...`);
    execSync(`git tag -a "${coreTag}" -m "Release ${coreTag}"`, { stdio: 'inherit' });
    execSync(`git tag -a "${reactTag}" -m "Release ${reactTag}"`, { stdio: 'inherit' });
    execSync('git push --tags', { stdio: 'inherit' });
    log(`✅ Tags pushed.`);
  }
}

const arg = process.argv[2];

if (arg === '--bump') {
  bump();
} else if (arg === '--publish') {
  publish();
} else {
  log('Usage: release.ts --bump | --publish');
  log('  --bump    Calculate and bump version locally (pre-commit)');
  log('  --publish Publish to npm and tag (CI only)');
  process.exit(1);
}
