import { Application, NextFunction, Request, Response } from 'express';
import { ClientRequest } from 'http';
import { createProxyMiddleware, Options, RequestHandler } from 'http-proxy-middleware';
import querystring from 'querystring';

import { Config } from '../config';
import { ProxyOptions } from '../types/config';

function onProxyReq(proxyReq: ClientRequest, req: Request, res: Response) {
  if (!req.body || !Object.keys(req.body).length) {
    return
  }
  const contentType = proxyReq.getHeader('Content-Type') as string
  const writeBody = (bodyData: string) => {
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData))
    proxyReq.write(bodyData)
  }
  if (contentType.includes('application/json')) {
    writeBody(JSON.stringify(req.body))
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    writeBody(querystring.stringify(req.body))
  }
}

function buildHandlers(proxies: ProxyOptions[]) {
  return proxies.map((proxy) => {
    const params: Options = {
      logLevel: 'error',
      onProxyReq,
      ...proxy,
    }
    return createProxyMiddleware(proxy.filter ?? '/', params)
  })
}

function traverseProxyHandlers(req: Request, res: Response, next: NextFunction) {
  function traverse(handlers: RequestHandler[], index = 0) {
    if (handlers[index]) {
      try {
        handlers[index](req, res, () => {
          traverse(handlers, index + 1)
        })
      } catch (err) {
        traverse(handlers, index + 1)
      }
    } else { next() }
    return traverse
  }
  return traverse
}

export async function createCommonProxy(app: Application, config: Config) {
  const { proxies } = config.get()
  let handlers = buildHandlers(proxies)
  config.on('change', () => {
    const { proxies } = config.get()
    handlers = buildHandlers(proxies)
  })
  return (req: Request, res: Response, next: NextFunction) => {
    traverseProxyHandlers(req, res, next)(handlers)
  }
}
