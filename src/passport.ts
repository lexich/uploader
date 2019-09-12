import passport from 'passport';
import {
    Strategy as LocalStrategy
} from 'passport-local';
import args from './args';

passport.serializeUser(function (user: any, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

passport.use(
    new LocalStrategy(function (username, password, done) {
        if (username !== args.username) {
            return done(new Error(`User ${username} wasn't found`), false, {
                message: 'Incorrect username.'
            });
        }
        if (password !== args.password) {
            return done(new Error(`Incorrect password`), false, {
                message: 'Incorrect password.'
            });
        }
        done(null, {
            username
        });
    })
);

export { passport };
