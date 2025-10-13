import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map(cfg => ({
    ...cfg,
    files: ['**/*.{ts,tsx}'],
    ignores: ['dist', 'build'],
    languageOptions: {
      ...cfg.languageOptions,
      parserOptions: { ...cfg.languageOptions?.parserOptions, project: './tsconfig.json' },
    },
  })),
  {
    files: ['**/*.{tsx,ts}'],
    plugins: { react: reactPlugin, 'react-hooks': reactHooks },
    languageOptions: {
      parserOptions: { project: './tsconfig.json' },
      globals: { JSX: true },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
    },
  },
  prettierConfig,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: { prettier: prettierPlugin },
    rules: { 'prettier/prettier': 'error' },
  },
];
