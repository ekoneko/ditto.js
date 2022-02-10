# ditto.js

http 接口代理工具

通过 `http-proxy` 将指定服务器代理到本地端口， 并支持简单的修改请求及响应。

## Usage

```
ditto /path/to/config.js
```

### special port

```
PORT=1234 ditto /path/to/config.js
```

### Config

ditto 的配置为一个 js 文件，示例参考：

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

基础代理配置， 没有命中规则的请求会由这里的配置进行转发，配置参考 `http-proxy.ServerOptions`

#### rules

自定义代理匹配，基于定义的 `method`, `path` 规则，以命中的规则解析响应。

#### globalContext

向所有自定义规则中注入的 context

#### globalRequestParams

规则匹配注入的 `request` 方法默认配置

### Rule

#### rule.match

规则匹配条件，格式为 `[Method, Path]`

`Path` 由 `path-to-regexp` 解析。后定义的规则会优先响应。

#### rule.context

向 callback 注入上下文， 拥有命名空间 `context`

#### rule.callback

处理规则的回调，格式为 `express.js` 的 RequestHandler. 即

```
(req, res, next) => {
  res.send(204)
}
```

callback 会运行在一个沙箱中，不能从配置的 js 文件中直接获取外部变量， 有三种方式获取上下文（优先级由低至高）：

1. ditto 默认注入的上下文

2. config.globalContext

3. rule.context

默认注入上下文列表：

##### request

实现继承自 `node-fetch`

```ts
import { RequestInit, Response } from 'node-fetch'
request(url: string, init?: RequestInit) => Response
```

请求会自动附带 cookie 及 `proxy` 中定义的 header 等设置。 如果 url 是相对路径则会拼接 `proxy.target`。

##### log

将日志输出至 ditto 执行进程中。(沙箱中的 console.log 等日志会被丢弃)

## typescript 方案

ditto 参数上追加 `--register=/path/to/ts-node/register`. 参考 ts-node [文档](https://github.com/TypeStrong/ts-node#programmatic)。

e.g:

```sh
ditto --register=/project/node_modules/ts-node/register /project/config.ts
```

### 类型参考

config.ts

```ts
import { Config } from '@ekoneko/ditto/lib/types/config'

const config: Config = {
  rules: [...require('./rules/test')],
  globalContext: {
    host: 'example.com',
  },
}
export = config
```

rules/test.ts

```ts
import { Rule } from "@ekoneko/ditto/lib/types/rule";
import Chance from "chance";

const context = {
  chance: new Chance(),
}
const ruleA: Rule<
  // global context
  {host: string;},
  // context
  typeof context
> = {
  match: ["GET", "/api/0"],
  context,
  // NOTE: can't use arrow function
  callback: function (req, res) {
    this.log('track something')
    res.send(`${this.host}/${this.context.chance.name()}`)
  }

export [ruleA]
```

## TODO

- [ ] 支持从 open-api / swagger 生成规则
