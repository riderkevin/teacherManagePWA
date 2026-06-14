export default {
  env: {
    NODE_ENV: '"development"',
  },
  defineConstants: {},
  mini: {
    webpackChain(chain) {
      chain.optimization.minimize(false)
    },
  },
  h5: {},
}
