module.exports = {
  extends: ['airbnb-base', 'airbnb-typescript/base', 'plugin:@typescript-eslint/recommended'],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    project: './tsconfig.json',
  },
  env: {
    node: true,
  },
  rules: {
    'import/prefer-default-export': 0,
    '@typescript-eslint/object-curly-spacing': ['warn', 'never'],
    'no-return-assign': 0,
    'max-classes-per-file': 0,
    'class-methods-use-this': 0,
    'import/no-cycle': 0,
    'max-len': ['warn', 160],
    '@typescript-eslint/no-use-before-define': 0,
    'no-console': 0,
    'no-plusplus': ['error', {allowForLoopAfterthoughts: true}],
    'no-restricted-syntax': 0,
    'no-underscore-dangle': 0,
    '@typescript-eslint/no-unused-vars': ['off'],
  },
};
