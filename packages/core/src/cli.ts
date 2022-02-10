import * as meow from 'meow'
import * as path from 'path'
import ditto from '.'

const cli = meow(`ditto /path/to/config

  Options
    --register, Ts-node register
`, {
  flags: {
    register: {
      type: 'string',
    }
  }
})

if (!cli.input[0]) {
  cli.showHelp()
  process.exit(1)
}

if (cli.flags.register) {
  require(cli.flags.register)
}

const configPath = path.resolve(cli.input[0])
const port = Number(process.env.PORT) || undefined

ditto({ configPath, port })
