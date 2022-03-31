import { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';

export function makeCreateRule<G = undefined>() {
  type Callback<C> = (this: {
    log: typeof console.log,
    request: typeof fetch,
    context: C
  } & G, req: Request, res: Response, next: NextFunction) => void
  return function createRule<C>(match: [string, string], callback: Callback<C>, context: C = {} as C) {
    return {
      match,
      callback,
      context,
    }
  }
}
