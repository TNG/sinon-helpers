const rollup = require('rollup')
const commonjs = require('rollup-plugin-commonjs')
const babel = require('rollup-plugin-babel')

rollup.rollup({
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
    commonjs(),
    babel({
      presets: [
        ['env', {
          modules: false,
          loose: true,
          targets: {node: 4}
        }]
      ],
      plugins: [
        'ramda',
        'external-helpers'
      ]
    })
  ]
}).then(bundle => {
  bundle.write({
    dest: 'dist/index.js',
    format: 'cjs'
  })
  bundle.write({
    dest: 'dist/index.mjs',
    format: 'es'
  })
})
