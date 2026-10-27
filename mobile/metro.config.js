const path = require('node:path')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

const config = getDefaultConfig(__dirname)
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, '..')]

module.exports = mergeConfig(config, {})
