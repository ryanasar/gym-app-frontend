module.exports = {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
      ['module:react-native-dotenv', {
        "moduleName": "@env",
        "path": ".env",
        "blacklist": null,
        "whitelist": null,
        "safe": false,
        "allowUndefined": true
      }]
    ]
  };
  