import { watchFile, unwatchFile } from 'fs'
import * as path from 'path'
import createDebug from 'debug'
import * as EventEmitter from 'events'
import { Config as IConfig } from './types/config'

const debug = createDebug('ditto')

export class Config extends EventEmitter {
  private config: IConfig
  private configPath: string
  private watchList: string[] = []
  constructor(configPath: string) {
    super()
    this.configPath = configPath = require.resolve(configPath)
    this.read().subscribe()
  }
  read() {
    this.readConfig()
    return this
  }
  get() {
    return this.config
  }
  private subscribe() {
    this.watchList.forEach((file) => {
      debug(`unwatch file ${file}`)
      unwatchFile(file)
    })
    this.watchList = []
    this.watchFileAndRelationship(this.configPath)
  }

  private watchFileAndRelationship(target: string) {
    debug(`watch file ${target}`)
    this.watchList.push(target)
    watchFile(target, this.handleFileChange.bind(this, target))
    const watchList = (require.cache[target]?.children ?? []).map(({ id }) => id)
    watchList.forEach(file => {
      if (file.includes(path.join(path.sep, 'node_modules', path.sep))) {
        debug(`ignore watch ${file}`)
        return
      }
      this.watchFileAndRelationship(file)
    })
  }

  private handleFileChange = (file: string) => {
    debug(`config file change ${file}`)
    delete require.cache[this.configPath]
    if (file !== this.configPath) {
      this.deleteCache(file)
    }
    this.readConfig()
    this.subscribe()
    this.emit('change')
  }

  private deleteCache(file: string, stack = 0) {
    if (stack > 100) {
      throw new Error('delete cache too deep')
    }
    const cache = require.cache[file]
    if (cache) {
      delete require.cache[file]
      if (cache.parent?.id) {
        this.deleteCache(cache.parent.id, stack++)
      }
    }
  }

  private readConfig() {
    this.config = require(this.configPath)
    this.config.proxies = this.config.proxies ?? (this.config.proxy ? [this.config.proxy] : [])
  }
}
