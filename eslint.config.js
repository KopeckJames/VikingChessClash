/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off', // Allow console statements
      'no-unused-vars': 'warn',
      'no-undef': 'off',
    },
  },
  {
    files: ['scripts/**/*.js', 'client/public/sw.js', 'test-*.js'],
    rules: {
      'no-console': 'off', // Allow console in scripts and service workers
      'no-unused-vars': 'off', // Allow unused vars in scripts
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '.next/',
      'prisma/migrations/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      '**/*.ts',
      '**/*.tsx',
      '**/*.d.ts',
    ],
  },
]
