import * as express from 'express'
import * as cookieParser from 'cookie-parser'
import { json as bodyParserJson } from 'body-parser'
import { Config } from './config'
import './middleware/commonProxy'
import { createRuleProxy } from './middleware/ruleProxy'
import { createCommonProxy } from './middleware/commonProxy'

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
}
