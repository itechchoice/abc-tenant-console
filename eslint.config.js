import globals from 'globals';
import airbnb from 'eslint-flat-config-airbnb';

export default [
  {
    ignores: ['node_modules', 'dist', 'build', 'public'],
  },
  {
    files: ['**/*.{js,jsx}'],
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
          extensions: ['.js', '.jsx'],
        },
      },
    },
    rules: {
      // ----- 放宽 Airbnb 中过于死板的规则 -----

      // React 17+ 不需要手动 import React
      'react/react-in-jsx-scope': 'off',

      // 允许 .js 文件中写 JSX
      'react/jsx-filename-extension': ['warn', { extensions: ['.js', '.jsx'] }],

      // 不强制 prop-types（现代 React 更多用 TS 或运行时校验）
      'react/prop-types': 'off',

      // 允许 props 展开
      'react/jsx-props-no-spreading': 'off',

      // 不强制解构 props/state
      'react/destructuring-assignment': 'off',

      // 不限制函数组件的定义方式（箭头 or function 均可）
      'react/function-component-definition': 'off',

      // 不强制 button 显式写 type 属性（SPA 中极少嵌套在 form 内）
      'react/button-has-type': 'off',

      // 允许单文件只有一个 named export
      'import/prefer-default-export': 'off',

      // console 仅警告，方便开发调试
      'no-console': 'warn',

      // 允许 ++ / --
      'no-plusplus': 'off',

      // 放宽参数重新赋值（常见于 reduce / immer）
      'no-param-reassign': ['error', { props: false }],

      // 不强制 default case
      'default-case': 'off',

      // 允许嵌套三元
      'no-nested-ternary': 'off',

      // 允许下划线前缀
      'no-underscore-dangle': 'off',

      // Vite 别名等场景下关闭
      'import/no-unresolved': 'off',

      // Vite 自动解析扩展名，关闭 import/extensions 避免与 @ 别名冲突
      'import/extensions': 'off',

      // 允许从 devDependencies 导入（配置文件常用）
      'import/no-extraneous-dependencies': ['error', {
        devDependencies: [
          'vite.config.js',
          'eslint.config.js',
          '**/*.test.{js,jsx}',
          '**/*.spec.{js,jsx}',
        ],
      }],

      // 放宽 a11y 中对静态元素点击事件的强制要求
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
