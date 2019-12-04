import { AuthModule, IUserRepository } from '../';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import * as path from 'path';
const USERNAME = 'test';
const PASSWORD = 'pass';
const SECRET = 'secret';
class User {
  constructor(public id: number, public name: string, public pass: string) {}
}

class UserRepository implements IUserRepository<User> {
  create(id: number): User {
    return new User(id, `test_${id}`, 'test');
  }
  toPlainObject(user: User) {
    return { id: user.id, name: user.name };
  }
  private user = new User(1, USERNAME, PASSWORD);

  async findOne(id: number): Promise<User> {
    if (this.user.id === id) {
      return this.user;
    }
    throw new Error('User not found');
  }
  async findUser(name: string, password: string): Promise<User> {
    if (this.user.name === name && this.user.pass === password) {
      return this.user;
    }
    throw new Error('User not found');
  }
}

function getAgent(app = express()) {
  app.set('trust proxy', 1); // trust first proxy
  app.set('views', path.join(__dirname, 'template'));
  app.set('view engine', 'html');
  const htmlEngine = (
    path: string,
    _opts: any,
    cb: (err?: null | Error, val?: string) => void
  ) => {
    cb(null, path);
  };
  app.engine('html', htmlEngine as any);

  app.use(
    session({
      secret: SECRET,
      cookie: { maxAge: 12 * 60 * 3600 },
      resave: true,
      saveUninitialized: false
    }) as any
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(
    bodyParser.urlencoded({
      // to support URL-encoded bodies
      extended: true
    }) as any
  );
  app.use(cookieParser(SECRET) as any);
  const authModule = new AuthModule(passport, {
    repository: new UserRepository(),
    secretOrKey: SECRET,
    redirectSuccess: '/success',
    redirectFail: '/fail'
  });
  app.use(authModule.init());

  app.get('/test', AuthModule.requireAuth(passport), (_req, res) => {
    return res.json({ success: true });
  });

  return request.agent(app);
}

async function login(
  agent: request.SuperTest<request.Test> = getAgent(),
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
  describe('POST /login', () => {
    test('valid data', async () => {
      const { res } = await login();
      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/success');

      const cookie = res.header['set-cookie'];
      expect(cookie).not.toBeUndefined();
      expect(cookie.length).toBe(1);
      const chunks: string[] = cookie[0].split(';');
      const index = chunks.findIndex(chunk => /^jwt=/.test(chunk));
      expect(index).not.toBe(-1);
      expect(chunks[index + 1]).toBe(' Path=/');
      expect(chunks[index + 2]).toBe(' HttpOnly');
    });

    test('valid data xhr', async () => {
      const { res } = await login(undefined, undefined, true);
      expect(res.status).toBe(200);
      expect(res.body.token).not.toBeUndefined();
      expect(res.body.user).not.toBeUndefined();
      const cookie = res.header['set-cookie'];
      expect(cookie).not.toBeUndefined();
      expect(cookie.length).toBe(1);
      const chunks: string[] = cookie[0].split(';');
      const index = chunks.findIndex(chunk => /^jwt=/.test(chunk));
      expect(index).not.toBe(-1);
      expect(chunks[index + 1]).toBe(' Path=/');
      expect(chunks[index + 2]).toBe(' HttpOnly');
    });

    test('invalid data', async () => {
      const { res } = await login(undefined, {
        username: 'test1',
        password: 'test1'
      });
      expect(res.status).toBe(500);
      expect(res.text).toContain('Error: User not found');
    });
  });

  describe('GET /login', () => {
    test('test', async () => {
      const agent = getAgent();
      const res = await agent.get('/login');
      expect(res.status).toBe(200);
      expect(res.text).toMatch(/auth\/login\.html$/);
    });
  });

  describe('/test route authenticate("jwt")', () => {
    test('invalid acesss', async () => {
      const agent = getAgent();
      const data = await agent.get('/test');
      expect(data.status).toBe(302);
    });
    test('cookie jwt', async () => {
      const agent = getAgent();
      const { cookie } = await login(agent);
      const data = await agent.get('/test').set('Cookie', cookie);
      expect(data.status).toBe(200);
      expect(data.body).toEqual({ success: true });
    });

    test('header jwt', async () => {
      const agent = getAgent();
      const { res } = await login(agent, undefined, true);
      const data = await agent
        .get('/test')
        .set('Authorization', res.body.token);
      expect(data.status).toBe(200);
      expect(data.body).toEqual({ success: true });
    });
  });

  describe('GET /logout', () => {
    test('perform', async () => {
      const agent = getAgent();

      //const testFail = await agent.get('/test');
      //expect(testFail.status).toBe(400);

      const { res: loginData, cookie } = await login(agent);
      expect(loginData.status).toBe(302);

      const testSuccsess = await agent.get('/test').set('Cookie', cookie);
      expect(testSuccsess.status).toBe(200);

      const logoutData = await agent.get('/logout');
      expect(logoutData.status).toBe(302);
      expect(logoutData.header.location).toBe('/login');

      const testFail2 = await agent.get('/test').set('Cookie', cookie);
      expect(testFail2.status).toBe(302);
    });

    test('perform xhr', async () => {
      const agent = getAgent();
      const { res, cookie } = await login(agent);
      const testSuccsess = await agent.get('/test').set('Cookie', cookie);
      expect(testSuccsess.status).toBe(200);

      expect(res.status).toBe(302);
      const data = await agent
        .get('/logout')
        .set('X-Requested-With', 'XMLHttpRequest');
      expect(data.status).toBe(200);
      expect(data.text).toBe('{"success":true}');

      const testFail2 = await agent.get('/test').set('Cookie', cookie);
      expect(testFail2.status).toBe(302);
    });
  });
});
