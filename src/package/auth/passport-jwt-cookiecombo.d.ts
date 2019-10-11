import { Strategy as BaseStrategy } from 'passport-strategy';
import express from 'express';

export interface IStrategyOptions {
  secretOrPublicKey: string | Buffer;
  jwtVerifyOptions?: any;
  passReqToCallback?: any;
  jwtHeaderKey?: string;
  jwtCookieName?: string;
}

export type TVerify<T> =
  | ((
      payload: T,
      verified: (err?: Error | null, user?: any, info?: any) => void
    ) => void)
  | ((
      req: express.Request,
      payload: T,
      verified: (err?: Error | null, user?: any, info?: any) => void
    ) => void);

export class Strategy<T> extends BaseStrategy {
  constructor(opts: IStrategyOptions, verify: TVerify<T>);
}
