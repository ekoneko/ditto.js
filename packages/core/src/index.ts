import * as express from 'express'
import * as cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import { getConfig } from './config'
import './middleware/commonProxy'
import { createRuleProxy } from './middleware/ruleProxy'
import { createCommonProxy } from './middleware/commonProxy'

const DEFAULT_PORT = 1552

export interface Options {
  configPath: string
  port?: number
}

export default async function ({ configPath, port = DEFAULT_PORT }: Options) {
  const app = express()
  const config = getConfig(configPath)

  app.use(bodyParser.json({ type: ["application/json", "application/+*json"] }));
  app.use(cookieParser());
  app.use(await createRuleProxy(app, config))
  app.use(await createCommonProxy(app, config));
  app.listen(port)
}