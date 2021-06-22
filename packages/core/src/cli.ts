import * as meow from 'meow'
import * as path from 'path'
import ditto from '.'

const cli = meow('ditto /path/to/config')

if (!cli.input[0]) {
  cli.showHelp()
  process.exit(1)
}

const configPath = path.resolve(cli.input[0])
const port = Number(process.env.PORT) || undefined

ditto({ configPath, port })
