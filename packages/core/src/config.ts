import { watchFile, unwatchFile } from 'fs'
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
    this.config = require(this.configPath)
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
    const watchList = require.cache[target].children.map(({ id }) => id)
    watchList.forEach(file => {
      this.watchFileAndRelationship(file)
    })
  }

  private handleFileChange = (file: string) => {
    debug(`config file change ${file}`)
    delete require.cache[this.configPath]
    if (file !== this.configPath) {
      delete require.cache[file]
    }
    this.config = require(this.configPath)
    this.subscribe()
    this.emit('change')
  }
}
