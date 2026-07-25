module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@components': './src/components',
            '@navigation': './src/navigation',
            '@screens': './src/screens',
            '@services': './src/services',
            '@store': './src/store',
            '@theme': './src/theme',
            '@utils': './src/utils',
            '@type': './src/types',
            '@assets': './src/assets',
            '@config': './src/config'
          },
        },
      ],
      // Reanimated WAJIB berada di luar array module-resolver, tapi tetap di dalam array plugins
      'react-native-reanimated/plugin',
    ],
  };
};