module.exports = {
    roots: ['<rootDir>/src'],
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
    testRegex: '/__tests__/.*.spec.(js|ts|tsx)?$',
    globals: {
      'ts-jest': {
        tsConfig: 'tsconfig.json'
      }
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  }
