import './middleware/commonProxy';

import { json as bodyParserJson } from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { Config } from './config';
import { createCommonProxy } from './middleware/commonProxy';
import { createRuleProxy } from './middleware/ruleProxy';

const DEFAULT_PORT = 1551

export interface Options {
  configPath: string
  port?: number
}

export default async function ({ configPath, port = DEFAULT_PORT }: Options) {
  const app = express()
  const config = new Config(configPath)

  app.use(bodyParserJson({ type: ['application/json', 'application/+*json'] }))
  app.use(cookieParser())
  app.use(await createRuleProxy(app, config))

  // const wsProxy = createProxyMiddleware('/ws', {
  //   secure: false,
  //   changeOrigin: true,
  //   autoRewrite: true,
  //   cookieDomainRewrite: "",
  //   headers: {
  //     Origin: "https://shimo.im",
  //     Referer: "https://shimo.im",
  //     "X-Requested-With": "XMLHttpRequest",
  //     Cookie:
  //       `shimo_sid=s%3ANGWUuuq3TQiZJmp40ZhBTZ2jDCK2fSZe.OfzlzQVcaDH5eGc%2FOi0nNRTAF2UFUAPUD8RzNzMKa5E;__RUNTIME_ENV__=${encodeURIComponent(
  //         JSON.stringify({
  //           WEBSOCKET_HOST: 'http://localhost:1551/ws'
  //         })
  //       )}`,
  //   },
  //   target: "wss://ws.shimo.im",
  //   ws: true,
  //   logLevel: 'debug',
  // })

  // app.use(wsProxy);

  app.use(await createCommonProxy(app, config))
  app.listen(port)
}
