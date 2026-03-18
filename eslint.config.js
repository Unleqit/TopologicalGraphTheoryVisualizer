import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser, parserOptions: { project: './tsconfig.json' }, globals: globals.browser },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      eqeqeq: ['warn', 'smart'],
      curly: ['error', 'all'],
      semi: ['error', 'always'],
      'no-multi-spaces': 'warn',
      'key-spacing': ['warn', { beforeColon: false, afterColon: true }],
      'space-infix-ops': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { vars: 'all', args: 'all', ignoreRestSiblings: false, caughtErrors: 'all' }],
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        { allowExpressions: false, allowHigherOrderFunctions: false, allowConciseArrowFunctionExpressionsStartingWithVoid: false },
      ],
      '@typescript-eslint/no-explicit-any': ['warn'],
      '@typescript-eslint/no-non-null-assertion': ['warn'],
    },
  },
]);
