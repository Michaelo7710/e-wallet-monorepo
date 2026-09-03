// /**
//  * @format
//  */

// import React from 'react';
// import ReactTestRenderer from 'react-test-renderer';
// import App from '../App';

// test('renders correctly', async () => {
//   await ReactTestRenderer.act(() => {
//     ReactTestRenderer.create(<App />);
//   });
// });

/**
 * @format
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
// @ts-ignore
import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock.js';
import App from '../App';

jest.mock('@react-native-community/netinfo', () => mockRNCNetInfo);
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));
jest.mock('../src/app/navigation/AppNavigator', () => {
  const { View } = require('react-native');
  return () => <View testID="app-navigator-mock" />;
});
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaProvider: View,
    SafeAreaView: View,
  };
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});