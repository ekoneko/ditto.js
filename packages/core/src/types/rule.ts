import { NextFunction, Request, Response } from "express"
import type fetch from "node-fetch"

type Method = string
type Path = string

export interface Rule<G extends {} = {}, C = undefined> {
  match: [Method, Path]
  callback: (
    this: G & { log: typeof console.log; context: C; request: typeof fetch, },
    req: Request,
    res: Response,
    next: NextFunction
  ) => void
  context?: C
}
