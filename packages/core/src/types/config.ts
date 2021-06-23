import { ServerOptions } from 'http-proxy'
import { Rule } from './rule'

export interface Config {
  proxy: ServerOptions
  rules: Rule[]
  globalContext: Record<string, any>
}
