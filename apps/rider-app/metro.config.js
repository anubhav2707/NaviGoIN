/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper module resolution for NaviGoIn app
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;