import request from 'supertest';
import express from 'express';
import init from '../index';
import { IUser, IUserRepository } from '../data';
import session from 'express-session';
import passport from 'passport';
import bodyParser from 'body-parser';
const USERNAME = 'test';
const PASSWORD = 'pass';
class User implements IUser {
  constructor(public id: number, public name: string, public pass: string) {}
}

class UserRepository implements IUserRepository {
  private user = new User(1, USERNAME, PASSWORD);

  async findOne(id: number): Promise<IUser> {
    if (this.user.id === id) {
      return this.user;
    }
    throw new Error('User not found');
  }
  async findUser(name: string, password: string): Promise<IUser> {
    if (this.user.name === name && this.user.pass === password) {
      return this.user;
    }
    throw new Error('User not found');
  }
}

function getAgent() {
  const app = express();
  app.set('trust proxy', 1); // trust first proxy

  app.use(
    session({
      secret: '1234',
      cookie: { maxAge: 12 * 60 * 3600 },
      resave: true,
      saveUninitialized: true
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(
    bodyParser.urlencoded({
      // to support URL-encoded bodies
      extended: true
    })
  );
  app.use(init(passport, new UserRepository()));
  return request.agent(app);
}

async function login(
  agent: request.SuperTest<request.Test>,
  params = {
    username: USERNAME,
    password: PASSWORD
  },
  xhr = false
) {
  const query = agent
    .post('/login')
    .send(params)
    .set('Content-Type', 'application/x-www-form-urlencoded');
  if (xhr) {
    query.set('X-Requested-With', 'XMLHttpRequest');
  }
  const res = await query;
  const cookie = (res as any).headers['set-cookie'];
  return { cookie, res };
}

describe('auth module', () => {
  beforeEach(() => {});
  describe('/login', () => {
    test('valid data', async () => {
      const agent = getAgent();
      const { res } = await login(agent);
      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/');
    });

    test('valid data xhr', async () => {
      const agent = getAgent();
      const { res } = await login(agent, undefined, true);
      expect(res.status).toBe(200);
      expect(res.text).toBe('{"success":true}');
    });

    test('invalid data', async () => {
      const agent = getAgent();
      const { res } = await login(agent, {
        username: 'test1',
        password: 'test1'
      });
      expect(res.status).toBe(500);
      expect(res.text).toContain('Error: User not found');
    });

    test('invalid data', async () => {
        const agent = getAgent();
        const { res } = await login(agent, {
          username: 'test1',
          password: 'test1'
        }, true);
        expect(res.status).toBe(401);
        expect(res.text).toBe('{"error":"User not found"}')
      });
  });
});
