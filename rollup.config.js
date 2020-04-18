import path from 'path'

import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import builtins from 'rollup-plugin-node-builtins'
import commonjs from 'rollup-plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import { sizeSnapshot } from 'rollup-plugin-size-snapshot'

import stylus from 'rollup-plugin-stylus-compiler'
import postcss from 'rollup-plugin-postcss'
import html from 'rollup-plugin-html'
import autoprefixer from 'autoprefixer'
import clean from 'postcss-clean'
import VuePlugin from 'rollup-plugin-vue'

const globals = {
  'Vue': 'Vue',
  'moment': 'moment'
}

const defaultPlugins = [
  builtins(),
  resolve({
    mainFields: ['browser', 'module', 'main'],
    customResolveOptions: {
      moduleDirectory: path.resolve(__dirname, 'node_modules')
    }
  }),
  stylus(),
  postcss({
    include: '**/*.css',
    plugins: [autoprefixer(), clean()]
  }),
  html({
    include: '**/*.html'
  }),
  commonjs(),
  VuePlugin(/* VuePluginOptions */),
]

const getBabel = ({ useESModules = true, targets = { browsers: ['ie >= 11'] } } = {}) => {
  return babel({
    exclude: 'node_modules/**',
    runtimeHelpers: true,
    presets: [['@babel/preset-env', { modules: false, targets }]],
    plugins: [['@babel/transform-runtime', { helpers: true, regenerator: true, useESModules }]],
  })
}

//Creates CommonJS, ESM, and UMD builds
function createConfig(entry, out, globalName) {
  return [
    // {
    //   input: entry,
    //   output: { file: `./dist/${out}.esm.js`, format: 'esm', sourcemap: true },
    //   plugins: [...defaultPlugins, getBabel()],
    //   external: Object.keys(globals),
    // },
    // {
    //   input: entry,
    //   output: { file: `./dist/${out}.cjs.js`, format: 'cjs', sourcemap: true },
    //   plugins: [...defaultPlugins, getBabel({ useESModules: false })],
    //   external: Object.keys(global)
    // },
    ...(!globalName ? [] : [
      {
        input: entry,
        output: {
          file: `./dist/${out}.js`,
          format: 'umd',
          name: globalName,
          globals,
          // sourcemap: true
        },
        external: Object.keys(globals),
        plugins: [...defaultPlugins, getBabel()],
      },
      {
        input: entry,
        output: {
          file: `./dist/${out}.min.js`,
          format: 'umd',
          name: globalName,
          globals,
          // sourcemap: true
        },
        external: Object.keys(globals),
        plugins: [
          ...defaultPlugins,
          getBabel(),
          terser({
            compress: true,
            mangle: true
          }),
          sizeSnapshot()
        ],
      },
    ]
    )
  ]
}

export default [
  ...createConfig('./src/web/index.js', 'videoClipper', 'videoClipper'),
]