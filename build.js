const rollup = require('rollup')
const babel = require('rollup-plugin-babel')

rollup
  .rollup({
    entry: 'src/index.js',
    external: [
      'sinon',
      'fluent-arguments',
      'ramda/src/compose',
      'ramda/src/curry',
      'ramda/src/filter',
      'ramda/src/forEach'
    ],
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
