const {jest: jestConfig} = require('kcd-scripts/config')

module.exports = Object.assign(jestConfig, {
  resolver: 'ts-jest-resolver',
  prettierPath: null,
  // React 16/17 use the legacy renderer and never call the client APIs.
  ...(/^(16|17)\./.test(require('react').version) && {
    moduleNameMapper: {
      ...jestConfig.moduleNameMapper,
      '^react-dom/client$': require.resolve('react-dom'),
    },
  }),
})
