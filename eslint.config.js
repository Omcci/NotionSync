export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      semi: ['error', 'never'],
      quotes: ['error', 'single'],
    },
  },
]
