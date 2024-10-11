import {defineConfig} from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    pure: 'src/pure.ts',
    expect: 'src/expect/index.ts',
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ['cjs', 'esm'],
  target: ['node20'],
  external: [/^@testing-library\/react-render-stream/],
})
