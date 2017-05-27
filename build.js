const rollup = require('rollup')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const babel = require('rollup-plugin-babel')

rollup.rollup({
  entry: 'src/index.js',
  external: ['sinon'],
  plugins: [
    resolve({jsnext: true, module: true}),
    commonjs(),
    babel({
      presets: [
        ['env', {
          modules: false,
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
