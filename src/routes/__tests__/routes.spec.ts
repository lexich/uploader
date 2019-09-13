import request from 'supertest';
import express from 'express';
import ARGS, { mock } from '../../args';
import apiRoutes from '../api';
import authRoutes from '../auth';
import cheerio from 'cheerio';
import * as path from 'path';
import * as fs from 'fs';
import { setupMiddleware, setupErrorHandlers } from '../../app';
import rimraf from 'rimraf';

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

function isFileExist(filepath: string) {
  return new Promise<boolean>(resolve => {
    fs.stat(filepath, (err, stat) => {
      if (err) {
        return resolve(false);
      }
      resolve(stat.isFile());
    });
  });
}

describe('route "/login"', () => {
  test('GET without auth should render template', async () => {
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

  test('POST with correct password and access to index page', async () => {
    const agent = getAgent();
    const { res, cookie } = await login(agent);
    expect(res.redirect).toBeTruthy();
    expect(res.header.location).toBe('/');
    const resIndex = await agent.get('/').set('Cookie', cookie);
    expect(resIndex.status).toBe(200);
  });

  test('POST with incorrect password', async () => {
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
});

describe('route "/files"', () => {
  test('GET without auth', async () => {
    const res = await getAgent()
      .get('/files')
      .set('X-Requested-With', 'XMLHttpRequest');
    expect(res.status).toBe(401);
  });

  test('GET with auth without content', async () => {
    const agent = getAgent();
    const { cookie } = await login(agent);
    const res = await agent
      .get('/files')
      .set('Cookie', cookie)
      .set('X-Requested-With', 'XMLHttpRequest');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('GET with auth with content', async () => {
    mock(args => {
      args.upload = path.join(__dirname, 'fixtures');
    });
    const agent = getAgent();
    const { cookie } = await login(agent);
    const res = await agent
      .get('/files')
      .set('Cookie', cookie)
      .set('X-Requested-With', 'XMLHttpRequest');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        name: '1.txt',
        url: '/media/test/1.txt'
      }
    ]);
  });
});

describe('route "/"', () => {
  test('GET without auth shoud redirect to login page', async () => {
    const res = await getAgent().get('/');
    expect(res.redirect).toBeTruthy();
    expect(res.header.location).toBe('/login');
  });

  test('GET with auth shoud redirect to login page', async () => {
    mock(args => {
      args.upload = path.join(__dirname, 'fixtures');
    });
    const agent = getAgent();
    const { cookie } = await login(agent);

    const res = await agent.get('/').set('Cookie', cookie);
    expect(res.status).toBe(200);
    const $ = cheerio.load(res.text);
    const script = $('script[init-dropzone]');
    expect(script.length).toBe(1);
    const content = script.html();
    expect(content).toContain(
      `var FILES = ${JSON.stringify([
        {
          url: '/media/test/1.txt',
          name: '1.txt'
        }
      ])}`
    );
  });
});

describe('route "/logout"', () => {
  test('GET simple', async () => {
    const res = await getAgent().get('/logout');
    expect(res.redirect).toBeTruthy();
    expect(res.header.location).toBe('/login');
  });

  test('login -> index -> logout -> [index -> login]', async () => {
    const agent = getAgent();
    const { cookie } = await login(agent);
    const resIndexAuth = await agent.get('/').set('Cookie', cookie);
    expect(resIndexAuth.status).toBe(200);
    const resLogout = await agent.get('/logout').set('Cookie', cookie);
    expect(resLogout.status).toBe(302);
    expect(resLogout.header.location).toBe('/login');
    const resIndexNotAuth = await agent.get('/').set('Cookie', cookie);
    expect(resIndexNotAuth.status).toBe(302);
    expect(resIndexNotAuth.header.location).toBe('/login');
  });
});

describe('route "/file-upload"', () => {
  let unmock: any;
  const UPLOADDIR = path.join(__dirname, 'fixtures', 'tmp');
  const FILENAME = '1.txt';
  beforeEach(() => {
    unmock = mock(args => {
      args.upload = UPLOADDIR;
    });
  });

  afterEach(done => {
    const cleanDir = path.join(UPLOADDIR, ARGS.username);
    unmock();
    rimraf(cleanDir, () => done());
  });

  test('POST upload file with auth', async () => {
    const sourceFile = path.join(
      __dirname,
      'fixtures',
      ARGS.username,
      FILENAME
    );
    const uploadedFile = path.join(UPLOADDIR, ARGS.username, FILENAME);

    const isSourceFileExist = await isFileExist(sourceFile);
    expect(isSourceFileExist).toBeTruthy();
    const isUploadedFileExist = await isFileExist(uploadedFile);
    expect(isUploadedFileExist).toBeFalsy();

    const agent = getAgent();
    const { cookie } = await login(agent);
    const res = await agent
      .post('/file-upload')
      .set('Cookie', cookie)
      .attach('file', sourceFile);
    expect(res.body).toEqual({
      filename: FILENAME,
      mimetype: 'text/plain',
      size: 8,
      url: `/media/test/${FILENAME}`
    });
    const isUploadedFileExist2 = await isFileExist(uploadedFile);
    expect(isUploadedFileExist2).toBeTruthy();
  });

  test('POST upload file without auth', async () => {
    const sourceFile = path.join(
      __dirname,
      'fixtures',
      ARGS.username,
      FILENAME
    );
    const uploadedFile = path.join(UPLOADDIR, ARGS.username, FILENAME);
    const res = await getAgent()
      .post('/file-upload')
      .attach('file', sourceFile);
    expect(res.status).toBe(302);
    const isExistUploadFile = await isFileExist(uploadedFile);
    expect(isExistUploadFile).toBeFalsy();
  });
});
