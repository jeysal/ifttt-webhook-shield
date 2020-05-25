/* @flow
eslint-disable no-return-assign,global-require */

const origEnv = process.env;
process.env = {
  ...origEnv,
  MAKER_KEY: '0000',
  HMAC_SECRET: 'such secret, much secure, very wow.',
};
afterAll(() => {
  process.env = origEnv;
});

const { createServer } = require('http');
const rp = require('request-promise-native');
const nock = require('nock');
const handler = require('.');

let server;
beforeAll(done => {
  server = createServer(handler);
  server.listen(12345, done);
});
afterAll(done => {
  server.close(done);
});

afterEach(() => {
  nock.cleanAll();
});

['robots.txt', 'favicon.ico'].forEach(path => {
  test(`404s for ${path}`, async () => {
    const resp = await rp({
      uri: `http://localhost:12345/${path}`,
      simple: false,
      resolveWithFullResponse: true,
    });
    expect(resp.statusCode).toBe(404);
  });
});

test('401s with "invalid digest" for /abc/0000', async () => {
  const resp = await rp({
    uri: 'http://localhost:12345/abc/0000',
    simple: false,
    resolveWithFullResponse: true,
  });
  expect(resp.statusCode).toBe(401);
  expect(resp.body).toEqual(expect.stringContaining('invalid digest'));
});

test('forwards request with valid digest', async () => {
  nock('https://maker.ifttt.com')
    .get('/trigger/abc/with/key/0000')
    .reply(200, 'abc triggered');
  const resp = await rp({
    uri:
      'http://localhost:12345/abc/3aacc0dd2c75b82663c21fe7b448d82810852fc7b45f4b643b71dfa4f4f82517',
    resolveWithFullResponse: true,
  });
  expect(resp.statusCode).toBe(200);
  expect(resp.body).toBe('abc triggered');
});
