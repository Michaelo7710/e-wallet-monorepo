// module.exports = function(api) {
//   api.cache(true);
//   return {
//     presets: ['babel-preset-expo'],
//     plugins: [
//       [
//         'module-resolver',
//         {
//           root: ['./src'],
//           extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
//           alias: {
//             '@components': './src/components',
//             '@navigation': './src/navigation',
//             '@screens': './src/screens',
//             '@services': './src/services',
//             '@store': './src/store',
//             '@theme': './src/theme',
//             '@utils': './src/utils',
//             '@type': './src/types',
//             '@assets': './src/assets',
//             '@config': './src/config'
//           },
//         },
//       ],
//       // Reanimated WAJIB berada di luar array module-resolver, tapi tetap di dalam array plugins
//       'react-native-reanimated/plugin',
//     ],
//   };
// };

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: [
            '.ios.js',
            '.android.js',
            '.ios.tsx',
            '.android.tsx',
            '.js',
            '.ts',
            '.tsx',
            '.json',
          ],
          alias: {
            // Layer Arsitektur Clean & Core
            '@app': './src/app',
            '@core': './src/core',
            '@domain': './src/domain',
            '@data': './src/data',
            '@features': './src/features',
            '@shared': './src/shared',
            
            // Assets & Typings
            '@assets': './src/assets',
            '@type': './src/types',

            // Sub-path helpers (opsional namun mempercepat autocompletion)
            '@theme': './src/core/theme',
            '@network': './src/core/network',
            '@storage': './src/core/storage',
          },
        },
      ],
      // Reanimated plugin WAJIB berada di urutan paling akhir array plugins
      'react-native-reanimated/plugin',
    ],
  };
};