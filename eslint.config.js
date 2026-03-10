import globals from 'globals';
import airbnb from 'eslint-flat-config-airbnb';

export default [
  {
    ignores: ['node_modules', 'dist', 'build', 'public'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
  },
  ...airbnb,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',

      'react/jsx-filename-extension': ['warn', { extensions: ['.jsx', '.tsx'] }],

      'react/prop-types': 'off',

      'react/jsx-props-no-spreading': 'off',

      'react/destructuring-assignment': 'off',

      'react/function-component-definition': 'off',

      'react/button-has-type': 'off',

      'import/prefer-default-export': 'off',

      'no-console': 'warn',

      'no-plusplus': 'off',

      'no-param-reassign': ['error', { props: false }],

      'default-case': 'off',

      'no-nested-ternary': 'off',

      'no-underscore-dangle': 'off',

      'import/no-unresolved': 'off',

      'import/extensions': 'off',

      'import/no-extraneous-dependencies': ['error', {
        devDependencies: [
          'vite.config.js',
          'eslint.config.js',
          '**/*.test.{js,jsx,ts,tsx}',
          '**/*.spec.{js,jsx,ts,tsx}',
        ],
      }],

      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/label-has-associated-control': ['error', { assert: 'either' }],
    },
  },
  {
    files: ['vite.config.js', 'eslint.config.js'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
    },
  },
];
