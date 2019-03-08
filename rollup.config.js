/* eslint-disable tree-shaking/no-side-effects-in-initialization */

import babel from 'rollup-plugin-babel'

export default {
  input: 'src/index.js',
  external: ['sinon'],
  plugins: [
    babel({
      presets: [
        [
          '@babel/preset-env',
          {
            modules: false
          }
        ]
      ]
    })
  ],
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs'
    },
    {
      file: 'dist/index.esm.js',
      format: 'es'
    }
  ]
}
