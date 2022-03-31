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
  const register = path.isAbsolute(cli.flags.register) ? cli.flags.register : path.resolve(process.cwd(), cli.flags.register);
  require(register);
}

const configPath = path.resolve(cli.input[0])
const port = Number(process.env.PORT) || undefined

ditto({ configPath, port })
