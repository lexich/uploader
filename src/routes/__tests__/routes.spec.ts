import request from 'supertest';
import express from 'express';
import { mock } from '../../args';
import apiRoutes from '../api';
import authRoutes from '../auth';
import cheerio from 'cheerio';
import * as path from 'path';
import { isFileExist } from '../../storage';
import { setupMiddleware, setupErrorHandlers } from '../../app';
import rimraf from 'rimraf';
import * as os from 'os';
import { Connection } from 'typeorm';
import { connectHelper } from '../../db';
import { User } from '../../entity/user';
import { File, FileRepository } from '../../entity/file';

let restore: () => void;
let db: Connection;
let drop: () => Promise<void>;
const USERNAME = 'test';
const PASSWORD = 'test';
const USERNAME_EMPTY = 'test_empty';
const PASSWORD_EMPTY = 'test_empty';

function getAgent() {
  const app = express();
  setupMiddleware(app, db);
  app.use(apiRoutes(db));
  app.use(authRoutes());
  setupErrorHandlers(app);
  return request.agent(app);
}

beforeAll(async () => {
  const res = await connectHelper('user.test', {
    logging: true
  });
  db = res.db;
  drop = res.drop;
  restore = mock(args => {
    args.dbpath = path.join(__dirname, 'fixtures', 'tmp', 'test.db');
  });
  const user = new User();
  user.name = USERNAME;
  user.password = PASSWORD;
  await db.manager.save(user);

  const file = new File();
  file.user = user;
  file.name = '1.txt';
  await db.manager.save(file);

  const userEmpty = new User();
  userEmpty.name = USERNAME_EMPTY;
  userEmpty.password = PASSWORD_EMPTY;
  await db.manager.save(userEmpty);
});

afterAll(async () => {
  if (drop) {
    await drop();
  }
});

beforeEach(() => {
  restore = mock(args => {
    args.upload = os.tmpdir();
  });
});
afterEach(() => {
  restore();
});

beforeAll(() => {});

async function login(
  agent: request.SuperTest<request.Test>,
  params = {
    username: USERNAME,
    password: PASSWORD
  }
) {
  const res = await agent
    .post('/login')
    .send(params)
    .set('Content-Type', 'application/x-www-form-urlencoded');
  const cookie = (res as any).headers['set-cookie'];
  return { cookie, res };
}

async function uploadFile(sourceFile: string, agent = getAgent()) {
  const { cookie } = await login(agent);
  const res = await agent
    .post('/file-upload')
    .set('Cookie', cookie)
    .attach('file', sourceFile);
  return { res, cookie };
}

describe('route "/login"', () => {
  test.skip('GET without auth should render template', async () => {
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

  test.skip('POST with correct password and access to index page', async () => {
    const agent = getAgent();
    const { res, cookie } = await login(agent);
    expect(res.redirect).toBeTruthy();
    expect(res.header.location).toBe('/');
    const resIndex = await agent.get('/').set('Cookie', cookie);
    expect(resIndex.status).toBe(200);
  });

  test.skip('POST with incorrect password', async () => {
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
    expect(message.text()).toBe('Invalid username or password');
  });
});

describe('route "/files"', () => {
  test.skip('GET xhr without auth', async () => {
    const res = await getAgent()
      .get('/test/files')
      .set('X-Requested-With', 'XMLHttpRequest');
    expect(res.status).toBe(401);
  });

  test.skip('GET without auth', async () => {
    const res = await getAgent().get('/test/files');
    expect(res.status).toBe(401);
  });

  test.skip('GET xhr with auth without content', async () => {
    const agent = getAgent();
    const { cookie } = await login(agent, {
      username: USERNAME_EMPTY,
      password: PASSWORD_EMPTY
    });
    const res = await agent
      .get(`/${USERNAME_EMPTY}/files`)
      .set('Cookie', cookie)
      .set('X-Requested-With', 'XMLHttpRequest');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test.skip('GET xhr with auth but wrong userpath', async () => {
    const agent = getAgent();
    const { cookie } = await login(agent);
    const res = await agent
      .get('/test1/files')
      .set('Cookie', cookie)
      .set('X-Requested-With', 'XMLHttpRequest');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: 'Unauthorize access'
    });
  });

  test.skip('GET  with auth but wrong userpath', async () => {
    const agent = getAgent();
    const { cookie } = await login(agent);
    const res = await agent.get('/test1/files').set('Cookie', cookie);
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/');
  });

  test.skip('GET with auth without content', async () => {
    const agent = getAgent();
    const { cookie } = await login(agent, {
      username: USERNAME_EMPTY,
      password: PASSWORD_EMPTY
    });
    const res = await agent
      .get(`/${USERNAME_EMPTY}/files`)
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    const $ = cheerio.load(res.text);
    const ul = $('ul[data-list]');
    expect(ul.length).toBe(1);
    expect(ul.children('li').length).toBe(0);
  });

  test.skip('GET xhr with auth with content', async () => {
    mock(args => {
      args.upload = path.join(__dirname, 'fixtures');
    });
    const agent = getAgent();
    const { cookie } = await login(agent);
    const res = await agent
      .get(`/${USERNAME}/files`)
      .set('Cookie', cookie)
      .set('X-Requested-With', 'XMLHttpRequest');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    const file = res.body[0] as File;
    expect(file.name).toBe('1.txt');
  });

  test.skip('GET with auth with content', async () => {
    const agent = getAgent();
    const { cookie } = await login(agent);
    const res = await agent.get(`/${USERNAME}/files`).set('Cookie', cookie);
    expect(res.status).toBe(200);
    const $ = cheerio.load(res.text);
    const a = $('a[data-link]');
    expect(a.length).toBe(1);
    expect(a.attr('href')).toBe('/media/test/1.txt');
    expect(a.text()).toBe('1.txt');
  });
});

describe('route "/"', () => {
  test.skip('GET without auth shoud redirect to login page', async () => {
    const res = await getAgent().get('/');
    expect(res.redirect).toBeTruthy();
    expect(res.header.location).toBe('/login');
  });

  test.skip('GET with auth shoud redirect to login page', async () => {
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
  test.skip('GET simple', async () => {
    const res = await getAgent().get('/logout');
    expect(res.redirect).toBeTruthy();
    expect(res.header.location).toBe('/login');
  });

  test.skip('login -> index -> logout -> [index -> login]', async () => {
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

describe('route "/file-remove"', () => {
  let unmock: any;
  const UPLOADDIR = path.join(__dirname, 'fixtures', 'tmp');
  const FILENAME = '1.txt';

  beforeEach(() => {
    unmock = mock(args => {
      args.upload = UPLOADDIR;
    });
  });

  afterEach(done => {
    const cleanDir = path.join(UPLOADDIR, USERNAME);
    unmock();
    rimraf(cleanDir, () => done());
  });

  test('upload and remove', async () => {
    const sourceFile = path.join(__dirname, 'fixtures', USERNAME, FILENAME);
    const agent = getAgent();
    const { res, cookie } = await uploadFile(sourceFile, agent);
    expect(res.status).toBe(200);
    const { url, id } = res.body;
    expect(url).toBe(`/media/${USERNAME}/1.txt`);
    const res2 = await agent
      .delete(`/file-remove?fileid=${id}`)
      .set('Cookie', cookie);
    expect(res2.status).toBe(200);
    const fileRepository = db.getCustomRepository(FileRepository);
    const file = await fileRepository.findOne({ id });
    expect(file).toBeUndefined();
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
    const cleanDir = path.join(UPLOADDIR, USERNAME);
    unmock();
    rimraf(cleanDir, () => done());
  });

  test.skip('POST upload file with auth', async () => {
    const sourceFile = path.join(__dirname, 'fixtures', USERNAME, FILENAME);
    const uploadedFile = path.join(UPLOADDIR, USERNAME, FILENAME);

    const isSourceFileExist = await isFileExist(sourceFile);
    expect(isSourceFileExist).toBeTruthy();
    const isUploadedFileExist = await isFileExist(uploadedFile);
    expect(isUploadedFileExist).toBeFalsy();

    const agent = getAgent();
    const { res } = await uploadFile(sourceFile, agent);
    const {id: _, ...body} = res.body;
    expect(body).toEqual({
      filename: FILENAME,
      mimetype: 'text/plain',
      size: 8,
      url: `/media/test/${FILENAME}`
    });
    const isUploadedFileExist2 = await isFileExist(uploadedFile);
    expect(isUploadedFileExist2).toBeTruthy();
  });

  test.skip('POST upload file without auth', async () => {
    const sourceFile = path.join(__dirname, 'fixtures', USERNAME, FILENAME);
    const uploadedFile = path.join(UPLOADDIR, USERNAME, FILENAME);
    const res = await getAgent()
      .post('/file-upload')
      .attach('file', sourceFile);
    expect(res.status).toBe(302);
    const isExistUploadFile = await isFileExist(uploadedFile);
    expect(isExistUploadFile).toBeFalsy();
  });

  test.skip('POST upload 2 files with auth', async () => {
    const sourceFile = path.join(__dirname, 'fixtures', USERNAME, FILENAME);
    const uploadedFile = path.join(UPLOADDIR, USERNAME, FILENAME);
    const FILENAME2 = '1_2.txt';

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
    const { id: _, ...body1 } = res.body;
    expect(body1).toEqual({
      filename: FILENAME,
      mimetype: 'text/plain',
      size: 8,
      url: `/media/test/${FILENAME}`
    });
    const isUploadedFileExist2 = await isFileExist(uploadedFile);
    expect(isUploadedFileExist2).toBeTruthy();

    const res2 = await agent
      .post('/file-upload')
      .set('Cookie', cookie)
      .attach('file', sourceFile);
    const { id: _1, ...body2 } = res2.body;
    expect(body2).toEqual({
      filename: FILENAME2,
      mimetype: 'text/plain',
      size: 8,
      url: `/media/test/${FILENAME2}`
    });

    const isUploadedFileExist3 = await isFileExist(uploadedFile);
    expect(isUploadedFileExist3).toBeTruthy();
  });
});
