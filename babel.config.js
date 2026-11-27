module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Required by WatermelonDB model decorators (@field, ...).
    ['@babel/plugin-proposal-decorators', {legacy: true}],
    // Loose mode keeps TS `field!: type` declarations compatible with decorators.
    ['@babel/plugin-transform-class-properties', {loose: true}],
  ],
};
