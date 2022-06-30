import { ServerOptions } from 'http-proxy';

import { Rule } from './rule';

export interface ProxyOptions extends ServerOptions {
  filter?: string;
}

export interface Config<G = unknown> {
  /**
   * @deprecated: Use proxies instead.
   */
  proxy?: ProxyOptions
  proxies?: ProxyOptions[]
  rules?: Rule<G, unknown>[]
  globalContext?: Record<string, any>
  globalRequestParams?: {
    baseUrl: string
    headers?: Record<string, string>
  }
}
