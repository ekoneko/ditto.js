import querystring from 'querystring'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { ClientRequest } from 'http'
import { Application, NextFunction, Request, Response } from 'express'
import { Config } from '../config'

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

export async function createCommonProxy(app: Application, config: Config) {
  let handler = createProxyMiddleware({
    onProxyReq,
    ...config.get().proxy,
  })
  config.on('change', () => {
    handler = createProxyMiddleware({
      onProxyReq,
      ...config.get().proxy,
    })
  })
  return (req: Request, res: Response, next: NextFunction) => handler(req, res, next)
}
