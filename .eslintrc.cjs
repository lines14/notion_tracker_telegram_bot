module.exports = {
  root: true,
  env: {
    commonjs: false,
    es2021: true,
    node: true,
    mocha: true,
  },
  extends: 'airbnb-base',
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      parserOpts: {
        plugins: ['importAssertions']
      },
    },
    ecmaVersion: 'latest',
  },
  rules: {
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'always',
      },
    ],
  },
};