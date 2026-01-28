module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel'
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@/components': './components',
            '@/app': './app',
            '@/hooks': './hooks',
            '@/services': './services',
            '@/utils': './utils',
            '@/types': './types',
            '@/constants': './constants',
            '@/assets': './assets',
          },
          extensions: [
            '.ios.js',
            '.android.js',
            '.js',
            '.jsx',
            '.json',
            '.tsx',
            '.ts',
          ],
        },
      ],
      'react-native-reanimated/plugin', // Must be last!
    ],
  };
};