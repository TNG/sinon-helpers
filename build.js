const rollup = require('rollup')
const babel = require('rollup-plugin-babel')

rollup
  .rollup({
    entry: 'src/index.js',
    external: id =>
      /ramda/.test(id) || ['sinon', 'fluent-arguments'].indexOf(id) >= 0,
    plugins: [
      babel({
        presets: [['latest', { es2015: { modules: false, loose: true } }]],
        plugins: ['ramda', 'external-helpers']
      })
    ]
  })
  .then(bundle => {
    bundle.write({
      dest: 'dist/index.js',
      format: 'cjs'
    })
    bundle.write({
      dest: 'dist/index.mjs',
      format: 'es'
    })
  })
