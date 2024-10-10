import {defineConfig} from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    jest: 'src/jest/index.ts',
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ['cjs', 'esm'],
  target: ['node20'],
  external: [/^@testing-library\/react-render-stream/],
})
