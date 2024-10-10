const {jest: jestConfig} = require('kcd-scripts/config')

module.exports = Object.assign(jestConfig, {
  resolver: 'ts-jest-resolver',
  prettierPath: null,
})
