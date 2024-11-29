import './polyfill.js'

Object.defineProperty(global, 'IS_REACT_ACT_ENVIRONMENT', {
  get() {
    return false
  },
  set(value) {
    if (!!value) {
      throw new Error(
        'Cannot set IS_REACT_ACT_ENVIRONMENT to true, this probably pulled in some RTL dependency?',
      )
    }
  },
  configurable: true,
})
