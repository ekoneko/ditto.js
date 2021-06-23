type Method = string
type Path = string

export interface Rule {
  match: [Method, Path]
  callback: Function
  context?: any
}
