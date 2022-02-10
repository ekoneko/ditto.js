import { NextFunction, Request, Response } from "express"

type Method = string
type Path = string

export interface Rule<G extends {} = {}, C = undefined> {
  match: [Method, Path]
  callback: (
    this: G & { log: typeof console.log; context: C },
    req: Request,
    res: Response,
    next: NextFunction
  ) => void
  context?: C
}
