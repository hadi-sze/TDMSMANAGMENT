const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

// Exercise the real server-side demo stores in a unique, disposable directory.
function loadStore(name) {
  const filename = path.resolve(__dirname, '../src/lib', name + '.ts');
  const mod = new Module(filename, module);
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const standardRequire = mod.require.bind(mod);
  mod.require = (specifier) => {
    if (specifier === 'server-only') return {};
    if (specifier === '@/lib/products') return { dataSource: () => 'demo' };
    return standardRequire(specifier);
  };
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
  return mod.exports;
}

test('demo subcompanies preserve foreign-key integrity and serialized parent writes', async () => {
  const originalDirectory = process.cwd();
  const tempRoot = path.resolve(os.tmpdir());
  const scratch = fs.mkdtempSync(path.join(tempRoot, 'tdms-subcompany-tests-'));
  process.chdir(scratch);
  try {
    const parents = loadStore('companies');
    const children = loadStore('subcompanies');
    const input = parents.companySchema.parse({ name: 'Parent', address: 'Address', companyID: '001', companycode: 'QA', isActive: true });
    const a = await parents.demoCompanyWrite('create', undefined, input);
    const b = await parents.demoCompanyWrite('create', undefined, { ...input, name: 'Parent B' });
    const child = await children.demoSubCompanyWrite('create', undefined, { name: 'Branch', companyId: a.id, isActive: false });
    assert.equal(child.companyId, a.id);
    assert.equal(child.isActive, false);
    await assert.rejects(children.demoSubCompanyWrite('create', undefined, { name: 'Orphan', companyId: 99999, isActive: true }), children.MissingParentCompanyError);
    await assert.rejects(parents.demoCompanyWrite('delete', a.id), parents.CompanyHasSubCompaniesError);
    assert.ok((await parents.demoCompanies()).some(p => p.id === a.id));
    await children.demoSubCompanyWrite('update', child.id, { name: 'Moved', companyId: b.id, isActive: true });
    assert.equal(await parents.demoCompanyWrite('delete', a.id), true);
    const race = await Promise.allSettled([
      children.demoSubCompanyWrite('create', undefined, { name: 'Concurrent branch', companyId: b.id, isActive: true }),
      parents.demoCompanyWrite('delete', b.id),
    ]);
    assert.equal(race[0].status, 'fulfilled');
    assert.equal(race[1].status, 'rejected');
    assert.ok(race[1].reason instanceof parents.CompanyHasSubCompaniesError);
    const existingParents = new Set((await parents.demoCompanies()).map(p => p.id));
    for (const item of await children.demoSubCompanies()) assert.ok(existingParents.has(item.companyId));
    for (const item of await children.demoSubCompanies()) await children.demoSubCompanyWrite('delete', item.id);
    assert.equal(await parents.demoCompanyWrite('delete', b.id), true);
    const deletionFirst = await parents.demoCompanyWrite('create', undefined, input);
    const secondRace = await Promise.allSettled([
      parents.demoCompanyWrite('delete', deletionFirst.id),
      children.demoSubCompanyWrite('create', undefined, { name: 'Too late', companyId: deletionFirst.id, isActive: true }),
    ]);
    assert.equal(secondRace[0].status, 'fulfilled');
    assert.equal(secondRace[1].status, 'rejected');
    assert.ok(secondRace[1].reason instanceof children.MissingParentCompanyError);
    assert.deepEqual(await children.demoSubCompanies(), []);
  } finally {
    await globalThis.tdmsCompanyWrites;
    delete globalThis.tdmsCompanyWrites;
    process.chdir(originalDirectory);
    const target = path.resolve(scratch);
    if (path.dirname(target) !== tempRoot || !path.basename(target).startsWith('tdms-subcompany-tests-'))
      throw new Error('Refusing to delete an unexpected test directory.');
    fs.rmSync(target, { recursive: true, force: true });
  }
});
