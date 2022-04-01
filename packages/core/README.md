# ditto.js

一个 http 接口代理工具

通过 `http-proxy` 将指定服务器代理到本地端口， 并支持简单的请求及响应覆写。

ditto.js 可以配合 `webpack` 等工具一同使用，可以实现不重启 webpack 前提下替换代理源及 mock 数据。

## Usage

```
ditto /path/to/config.js
```

### special port

```
PORT=1234 ditto /path/to/config.js
```

### Config

ditto.js 的配置为一个 js 文件，(已支持 ts 配置, 参考下方 `typescript 方案`)

示例参考：

```js
const createChance = require('chance')
module.exports = {
  proxies: [
    {
      target: 'https://example.com',
      ws: true,
      secure: false,
      changeOrigin: true,
      autoRewrite: true,
      cookieDomainRewrite: '',
    },
  ],
  globalContext: { chance: createChance() },
  globalRequestParams: {
    baseUrl: 'https://example.com',
    headers: {
      Token: 'xxxxx'
    }
  }
  rules: [
    {
      match: ['GET', '/api/0'],
      callback: (req, res) => {
        const { prefix } = context
        res.send(`${prefix}${chance.name()}`)
      },
      context: { prefix: 'name: ' },
    },
  ],
}
```

#### proxies

通用代理配置，配置参考 [http-proxy.ServerOptions](https://github.com/http-party/node-http-proxy#options).

同用代理会在规则代理之后执行，通常用于默认代理规则。

#### rules

规则模式配置，参考下方 `Rule`

#### globalContext (optional)

向所有规则模式中提供全局数据。

#### globalRequestParams (optional)

规则内置 `request` 方法的自定义配置。

### Rule

规则模式: 基于请求的 `method` 与 `path` 拦截并修改响应内容。规则匹配顺序与数组顺序一致 (first match first execute)。

一个完整的规则配置：

```js
const rule = {
  match: ['GET', '/api/0'],
  callback: (req, res) => {
    const { prefix } = context
    res.send(`${prefix}${chance.name()}`)
  },
  context: { prefix: 'name: ' },
}
```

#### rule.match

规则匹配条件，格式为 `[Method, Path]`

`Path` 由 [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) 解析。

#### rule.context

向 callback 注入上下文， 可以在 `rule.callback` 函数中通过 this.context 被调用。

#### rule.callback

处理规则的回调，格式与 `express.js` RequestHandler 保持一致. 即

```
(req, res, next) => {
  res.send(204)
}
```

需注意的是 rule.callback 运行在一个 sandbox 中， 无法访问外部变量。

```js
const outsider = 'xxxx'
const rule = {
  match: ['GET', '/api/0'],
  callback: (req, res, next) => {
    this.log(outsider) // undefined
    next()
  },
}
```

除 `rule.context` 与 `globalContext` 外， ditto.js 会默认注入以下变量:

##### this.request

实现继承自 `node-fetch`

```ts
import { RequestInit, Response } from 'node-fetch'
request(url: string, init?: RequestInit) => Response
```

请求会自动加载 `globalRequestParams` 定义的配置

##### this.log

将日志输出至主进程中。(沙箱中的 stdout, stderr *不会*被输出)

## typescript 方案

ditto.js 对配置提供了 typescript 支持与完整的类型定义。

使用 typescript 配置时启动参数需要声明 `--register=/path/to/ts-node/register`. 参考 [ts-node 文档](https://github.com/TypeStrong/ts-node#programmatic)。

e.g:

```sh
ditto --register=/project/node_modules/ts-node/register /project/config.ts
```

使用 ditto.js 的类型需在配置文件范围内引入 ditto。 考虑到同时对 ts-node, typescript 的依赖。推荐以 npm module 的形式维护 ditto project.

```json
{
  "name": "ditto-project",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "ditto --register ./node_modules/ts-node/register/transpile-only.js configPath.ts"
  },
  "dependencies": {
    "@ekoneko/ditto": "*",
    "ts-node": "*",
    "typescript": "*"
  }
}
```

### 类型参考

config.ts

```ts
import { Config } from 'ditto.js/lib/types/config'
import Chance from 'chance'

const config: Config = {
  proxies: [],
  rules: [...require('./rules/test')],
  globalContext: { chance: createChance() },
}
export = config
```

rules/test.ts

```ts
import { makeCreateRule } from 'ditto.js/lib/utils'

const createRule = makeCreateRule<{chance: Chance}>()
const ruleA = createRule(
  ['GET', '/api/0'],
  (req, res) => {
    res.send(`${prefix}${chance.name()}`)
  },
  context: { prefix: 'name: ' },
)

export [ruleA]
```

## TODO

- [ ] 支持从 open-api / swagger 生成规则
