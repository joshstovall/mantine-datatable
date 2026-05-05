import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['package/index.ts'],
  dts: { only: true, compilerOptions: { incremental: false, types: ['node'] } },
  clean: false,
});
