import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(__dirname, '../bin/cli.js');
const TMP = path.resolve(__dirname, '../tmp-test');

before(async () => { await fs.ensureDir(TMP); });
after(async () => { await fs.remove(TMP); });

function run(args, cwd = TMP) {
  return execa('node', [CLI, ...args], { cwd, reject: false });
}

test('scaffolds project with correct structure using -y', async () => {
  const projectName = 'test-js-app';
  const { exitCode } = await run([projectName, '-y']);

  assert.equal(exitCode, 0);

  const base = path.join(TMP, projectName);
  for (const entry of ['client', 'server', 'package.json', 'README.md', '.gitignore']) {
    assert.ok(fs.existsSync(path.join(base, entry)), `Missing: ${entry}`);
  }
});

test('--template typescript uses client-ts template', async () => {
  const projectName = 'test-ts-app';
  const { exitCode } = await run([projectName, '-y', '--template', 'typescript']);

  assert.equal(exitCode, 0);

  const tsConfig = path.join(TMP, projectName, 'client', 'tsconfig.json');
  assert.ok(fs.existsSync(tsConfig), 'tsconfig.json should exist for TypeScript template');
});

test('exits with error if project directory already exists', async () => {
  const projectName = 'test-duplicate-app';
  await fs.ensureDir(path.join(TMP, projectName));

  const { exitCode, stderr } = await run([projectName, '-y']);

  assert.equal(exitCode, 1);
  assert.ok(stderr.includes('already exists'), 'Should print already exists error');
});

test('root package.json has correct scripts', async () => {
  const projectName = 'test-scripts-app';
  await run([projectName, '-y']);

  const pkg = await fs.readJson(path.join(TMP, projectName, 'package.json'));
  assert.ok(pkg.scripts.dev, 'Should have dev script');
  assert.ok(pkg.scripts.client, 'Should have client script');
  assert.ok(pkg.scripts.server, 'Should have server script');
});
