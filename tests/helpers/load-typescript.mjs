import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const compiled = new Map();
export function createLoader({ env = {}, globals = {}, modules = {} } = {}) {
  const cache = new Map();
  function load(file) {
    const filename = resolve(file);
    if (cache.has(filename)) return cache.get(filename);
    if (!compiled.has(filename)) compiled.set(filename, ts.transpileModule(readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText);
    const exports = {};
    cache.set(filename, exports);
    vm.runInNewContext(compiled.get(filename), {
      exports, Buffer, structuredClone, console, Date, URL, URLSearchParams,
      process: { env: { NODE_ENV: 'test', CRICKSOLVE_SECRET_KEY: 'unit-test-secret', ...env } },
      require(name) {
        if (Object.hasOwn(modules, name)) return modules[name];
        if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
        return require(name);
      },
      ...globals,
    }, { filename });
    return exports;
  }
  return load;
}
