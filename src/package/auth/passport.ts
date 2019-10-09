import { PassportStatic } from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { IUser, IUserRepository, InvalidLoginError } from './data';

export function init(rep: IUserRepository, pass: PassportStatic) {
  pass.serializeUser((user: IUser, done) => {
    done(null, user.id);
  });
  pass.deserializeUser(function(id: number, done) {
    rep.findOne(id).then(user => done(null, user), err => done(err));
  });

  pass.use(
    new LocalStrategy(function(username, password, done) {
      rep
        .findUser(username, password)
        .then(user => {
          user
            ? done(null, user)
            : done(new InvalidLoginError('Invalid username or password'));
        })
        .catch(err => done(err, false));
    })
  );
  return pass;
}
