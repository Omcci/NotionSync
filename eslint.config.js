module.exports = {
  parser: '@typescript-eslint/parser', 
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module', 
  },
  plugins: ['@typescript-eslint', 'react', 'jsx-a11y', 'react-hooks'],
  rules: {
    semi: ['error', 'never'],
    quotes: ['error', 'single'],
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    'react/no-unescaped-entities': 'off',
  },
}
