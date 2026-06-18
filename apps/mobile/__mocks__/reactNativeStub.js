// __mocks__/reactNativeStub.js
// Minimal stub for react-native in pure unit tests
module.exports = {
  Platform: { OS: "android", select: (obj) => obj.android ?? obj.default },
  StyleSheet: { create: (styles) => styles },
  Dimensions: { get: () => ({ width: 375, height: 812 }) },
};
