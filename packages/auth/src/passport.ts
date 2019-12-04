import passport, { PassportStatic } from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, StrategyOptions, ExtractJwt } from 'passport-jwt';

import { IUserRepository, InvalidLoginError } from './data';

export class PassportService<TUser extends { id: number }> {
  constructor(
    private repository: IUserRepository<TUser>,
    public passport: PassportStatic
  ) {}
  init() {
    this.passport.serializeUser((user: TUser, done) => {
      done(null, user.id);
    });
    this.passport.deserializeUser((id: number, done) => {
      this.repository
        .findOne(id)
        .then(user => done(null, user), err => done(err));
    });
    this.addLocalStrategy();
  }
  add(strategy: passport.Strategy) {
    this.passport.use(strategy);
  }
  addLocalStrategy() {
    const stragegy = new LocalStrategy((username, password, done) => {
      this.repository
        .findUser(username, password)
        .then(user => {
          user
            ? done(null, user)
            : done(new InvalidLoginError('Invalid username or password'));
        })
        .catch(err => done(err, false));
    });
    this.add(stragegy);
  }
  addJWTStrategy(secretOrKey: string | Buffer, redirectFail?: string) {
    const fromHeader = ExtractJwt.fromHeader('authorization')
    const opts: StrategyOptions = {
      jwtFromRequest: (req: any) => {
        let token = fromHeader(req);
        if (!token && req && req.signedCookies) {
          token = req.signedCookies['jwt'];
        }
        return token;
      },
      secretOrKey,
    };
    const stragegy = new JwtStrategy(opts, async (payload, done) => {
      try {
        const user = await this.repository.findOne(payload.id);
        done(null, user);
      } catch (err) {
        done(err, false);
      }
    });

    this.add(stragegy);
  }
}
