import passport from 'passport';
import {
    Strategy as LocalStrategy
} from 'passport-local';
import { getCustomRepository } from 'typeorm';
import { User, UserRepository } from './entity/user';
import { InvalidLoginError } from './errors';

passport.serializeUser(function (user: User, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id: number, done) {
    getCustomRepository(UserRepository).findOne(id).then(
        user => done(null, user),
        err => done(err)
    );
});

passport.use(
    new LocalStrategy(function (username, password, done) {
        const repo = getCustomRepository(UserRepository);
        repo.findUser(username, password)
            .then(user => {
                user ? done(null, user) : done(new InvalidLoginError('Invalid username or password'))
            })
            .catch(err => done(err, false));
    })
);

export { passport };
