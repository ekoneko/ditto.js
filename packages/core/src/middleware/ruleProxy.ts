import * as vm from 'vm'
import * as path from 'path'
import { Application, Request, Response, NextFunction } from 'express'
import { pathToRegexp } from 'path-to-regexp'
import { Config } from '../types/config'
import { Rule } from '../types/rule'
import fetch, { RequestInit } from 'node-fetch'

function createMatchRule(method: string, pathname: string) {
  method = method.toUpperCase()
  return function matchRule(rule: Rule) {
    const [method, path] = rule.match
    if (method !== '*' && method.toUpperCase() !== method) {
      return false
    }
    const reg = pathToRegexp(path)
    return reg.test(pathname)
  }
}

function joinUrl(prefix: string, suffix: string) {
  const flag = prefix[prefix.length - 1] === '/' || suffix[0] === '/' ? '/' : ''
  return prefix + flag + suffix
}

function createRequest(req: Request, config: Config) {
  return function request(url: string, init?: RequestInit) {
    if (!url.includes('://')) {
      req.originalUrl
      url = joinUrl(String(config.proxy.target), url)
    }
    const cookie =
      req.cookies &&
      Object.keys(req.cookies).reduce((pre, cur) => {
        return pre + `${cur}=${encodeURI(req.cookies[cur])}; `
      }, '')
    return fetch(url, {
      ...config.proxy,
      ...init,
      headers: {
        Cookie: cookie,
        ...init?.headers,
      },
    })
  }
}

export async function createRuleProxy(app: Application, config: Config) {
  const rules = config.rules.reverse()
  return function (req: Request, res: Response, next: NextFunction) {
    const matchRule = createMatchRule(req.method, req.path)
    const matchedRule = rules.find(matchRule)
    if (matchedRule?.callback) {
      try {
        const context = vm.createContext({
          req,
          res,
          next,
          request: createRequest(req, config),
          microtaskMode: true,
          globalContext: config.globalContext,
          context: matchedRule.context,
          // TODO: custom log
          log: console.log,
        })
        const code = `
          const handler = (${matchedRule?.callback})(req, res, next);
          handler && typeof handler.catch === 'function' && handler.catch(err => log(err));
        `
        vm.runInContext(code, context)
        // end
        return
      } catch (err) {
        console.error(err)
      }
    }
    next()
  }
}
