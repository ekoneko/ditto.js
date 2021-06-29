import * as vm from 'vm'
import { Application, Request, Response, NextFunction } from 'express'
import { pathToRegexp } from 'path-to-regexp'
import { Config } from '../config'
import { Config as IConfig } from '../types/config'
import { Rule } from '../types/rule'
import fetch, { RequestInit } from 'node-fetch'

function createMatchRule(method: string, pathname: string) {
  method = method.toUpperCase()
  return function matchRule(rule: Rule) {
    const [ruleMethod, path] = rule.match
    if (ruleMethod !== '*' && (ruleMethod.toUpperCase() !== method)) {
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

function createRequest(req: Request, config: IConfig) {
  return function request(url: string, init?: RequestInit) {
    if (!url.includes('://')) {
      url = joinUrl(String(config.proxy.target), url)
    }
    const cookie =
      req.cookies &&
      Object.keys(req.cookies).reduce((pre, cur) => {
        return pre + `${cur}=${encodeURIComponent(req.cookies[cur])}; `
      }, '')
    return fetch(url, {
      ...config.proxy,
      ...init,
      headers: {
        Cookie: cookie,
        ...config.proxy.headers,
        ...init?.headers,
      },
    })
  }
}

export async function createRuleProxy(app: Application, configReader: Config) {
  return function (req: Request, res: Response, next: NextFunction) {
    const config = configReader.get()
    const rules = config.rules.reverse()
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
          // Think: required namespace?
          // namespace will cause difficult to use module in every shared functions
          ...config.globalContext,
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
