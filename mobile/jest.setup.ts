/// <reference types="jest" />

// NetInfo ships an official Jest mock.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));
