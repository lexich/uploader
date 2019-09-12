import request from 'supertest';
import express from 'express';
import { mock } from '../../args';
import apiRoutes from '../api';
import authRoutes from '../auth';
import cheerio from 'cheerio';
import { setupMiddleware, setupErrorHandlers } from '../../app';
function getAgent() {
  const app = express();
  setupMiddleware(app);
  app.use(apiRoutes());
  app.use(authRoutes());
  setupErrorHandlers(app);
  return request.agent(app);
}

let restore: () => void;
beforeEach(() => {
  restore = mock(args => {
    args.username = 'test';
    args.password = 'test';
  });
});
afterEach(() => {
  restore();
});

test('GET / page without auth shoud redirect to login page', async () => {
  const res = await getAgent().get('/');
  expect(res.redirect).toBeTruthy();
  expect(res.header.location).toBe('/login');
});

test('GET /files page without auth shoud redirect to login page', async () => {
  const res = await getAgent().get('/files');
  expect(res.redirect).toBeTruthy();
  expect(res.header.location).toBe('/login');
});

test('GET /login page without auth should render template', async () => {
  const res = await getAgent().get('/login');
  expect(res.status).toBe(200);
  const $ = cheerio.load(res.text);

  const username = $('form input[name=username]');
  expect(username.length).toBe(1);
  const password = $('form input[name=password][type=password]');
  expect(password.length).toBe(1);
  const form = $(`form[method='POST'][action='/login']`);
  expect(form.length).toBe(1);
  const sumbit = $('form [type=submit]');
  expect(sumbit.length).toBe(1);
});

async function login(
  agent: request.SuperTest<request.Test>,
  params = {
    username: 'test',
    password: 'test'
  }
) {
  const res = await agent
    .post('/login')
    .send(params)
    .set('Content-Type', 'application/x-www-form-urlencoded');
  const cookie = (res as any).headers['set-cookie'];
  return { cookie, res };
}

test('POST /login with correct password and access to index page', async () => {
  const agent = getAgent();
  const { res, cookie } = await login(agent);
  expect(res.redirect).toBeTruthy();
  expect(res.header.location).toBe('/');
  const resIndex = await agent.get('/').set('Cookie', cookie);
  expect(resIndex.status).toBe(200);
});

test('POST /login with incorrect password', async () => {
  const agent = getAgent();
  const { res } = await login(agent, {
    username: 'test1',
    password: 'test1'
  });
  expect(res.status).toBe(401);
  const $ = cheerio.load(res.text);
  const username = $('form input[name=username]');
  expect(username.val()).toBe('test1');
  const message = $('form .text-danger');
  expect(message.text()).toBe(`User test1 wasn't found`);
});
