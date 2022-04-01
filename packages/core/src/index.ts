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

  app.use(await createCommonProxy(app, config))
  app.listen(port)

  process.stdout.write(`Listen localhost:${port}`)
}
