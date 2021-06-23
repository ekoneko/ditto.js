import { Config } from './types/config'

export function getConfig(configPath: string): Config {
  const config = require(configPath)
  return config
}
