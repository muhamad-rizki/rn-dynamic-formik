module.exports = {
  'extends': 'airbnb',
  'parser': 'babel-eslint',
  'env': {
    'jest': true,
  },
  'rules': {
    'no-use-before-define': 'off',
    'react/jsx-filename-extension': 'off',
    'react/prop-types': 'off',
    'comma-dangle': 'off',
    'linebreak-style': 'off',
    'react/prefer-stateless-function': 'off',
    'no-underscore-dangle': "off",
    'no-unused-vars': 'warn',
  },
  'globals': {
    "fetch": false
  }
}