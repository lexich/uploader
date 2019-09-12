import request from 'supertest';
import express from 'express';
import { mock } from '../../args';
import apiRoutes from '../api';
import authRoutes from '../auth';
import cheerio from 'cheerio';
import { setupMiddleware, setupErrorHandlers } from '../../app';
import session from 'express-session';

function getAgent() {
    const app = express();
    setupMiddleware(app, {
        mockSessionOpts(opts) {
            opts.store = new session.MemoryStore()
            return opts;
        }
    });
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
    const $ = cheerio.load(res.text)

    const username = $('form input[name=username]');
    expect(username.length).toBe(1);
    const password = $('form input[name=password][type=password]');
    expect(password.length).toBe(1);
    const form = $(`form[method='POST'][action='/login']`)
    expect(form.length).toBe(1);
    const sumbit = $('form [type=submit]');
    expect(sumbit.length).toBe(1)
});


test('POST /login with correct password and access to index page', async () => {
    const res = await getAgent().post('/login').send({
        username: 'test',
        password: 'test'
    }).set('Content-Type', 'application/x-www-form-urlencoded');
    expect(res.redirect).toBeTruthy();
    expect(res.header.location).toBe('/');
    const resIndex = await getAgent().get('/').set('Cookie', (res as any).headers['set-cookie']);
    expect(resIndex.status).toBe(200);

});
