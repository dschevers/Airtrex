/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  ignorePatterns: ['.next/', 'node_modules/'],

  overrides: [
    // ─── Plain JS scripts & .js/.jsx files ───────────────────────────────
    {
      files: ['**/*.js', '**/*.jsx', 'print-tree.js', 'test-db-connection.js'],
      parser: 'espree',
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      plugins: ['@next/next'],
      extends: ['plugin:@next/next/core-web-vitals'],
      rules: {
        '@next/next/no-html-link-for-pages': 'error',
        '@next/next/no-img-element':         'warn',
      },
    },

    // ─── TypeScript files ────────────────────────────────────────────────────
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project:           './tsconfig.json',
        tsconfigRootDir:   __dirname,
        ecmaVersion:       2020,
        sourceType:        'module',
        ecmaFeatures:      { jsx: true },
      },
      plugins: ['@typescript-eslint', '@next/next'],
      extends: [
        'plugin:@next/next/core-web-vitals',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      rules: {
        // Next.js
        '@next/next/no-html-link-for-pages':    'error',
        '@next/next/no-img-element':            'warn',

        // TS looseners
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/require-await':                'off',
        '@typescript-eslint/no-floating-promises':         'off',

        // Warnings, not errors
        '@typescript-eslint/no-explicit-any':      'warn',
        '@typescript-eslint/no-unused-vars': ['warn',{
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        }],

        // Turn off the “unsafe-…” and other type-info rules if still too noisy
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-assignment':    'off',
        '@typescript-eslint/no-unsafe-argument':      'off',
        '@typescript-eslint/no-misused-promises':     'off',
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      },
      settings: {
        react: { version: 'detect' },
      },
    },
  ],
};
