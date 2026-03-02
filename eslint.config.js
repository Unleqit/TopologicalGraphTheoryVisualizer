import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';

//defines linting rules in descending order of precedence (JS -> TS -> prettier -> custom)
export default defineConfig([
  js.configs.recommended,

  ...tseslint.configs.recommended,

  prettier,

  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      parser: tseslint.parser,

      globals: globals.browser,
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      eqeqeq: ['warn', 'always'],
      curly: ['error', 'all'],
      semi: ['error', 'always'],
      'no-multi-spaces': 'warn',
      'key-spacing': ['warn', { beforeColon: false, afterColon: true }],
      'space-infix-ops': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'all',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowHigherOrderFunctions: false,
          allowConciseArrowFunctionExpressionsStartingWithVoid: false,
        },
      ],
      '@typescript-eslint/no-explicit-any': ['warn'],
      '@typescript-eslint/no-non-null-assertion': ['warn'],
    },
  },
]);
