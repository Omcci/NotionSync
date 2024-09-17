export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: '@typescript-eslint/parser',
    },
    plugins: ['@typescript-eslint', 'react', 'jsx-a11y', 'react-hooks'],
    rules: {
      'semi': ['error', 'never'],
      'quotes': ['error', 'single'],
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      'react/no-unescaped-entities': 'off',
    },
  },
];
