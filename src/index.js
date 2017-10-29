#!/usr/bin/env node

// @flow

const http = require('http');
const request = require('request');
const Route = require('route-parser');
const crypto = require('crypto');

if (!process.env.HMAC_SECRET) {
  console.warn('HMAC_SECRET not specified, endpoints not secured');
}
const hmacSecret = process.env.HMAC_SECRET || '';

if (!process.env.MAKER_KEY) {
  console.warn('MAKER_KEY not specified, IFTTT requests will fail');
}
const makerKey = process.env.MAKER_KEY || '';

const route = new Route('/:event/:digest');

const server = http.createServer((req, res) => {
  if (['/robots.txt', '/favicon.ico'].includes(req.url)) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
    return;
  }

  const { event, digest } = route.match(req.url);
  try {
    const hmac = crypto.createHmac('sha256', hmacSecret);
    hmac.update(event);
    if (hmac.digest('hex') === digest) {
      req
        .pipe(
          request(
            `https://maker.ifttt.com/trigger/${event}/with/key/${makerKey}`,
          ),
        )
        .on('error', err => {
          console.error(
            `IFTTT maker request failed in request context ${req.url}. ${err.toString()}`,
          );
          res.writeHead(500, { 'content-type': 'text/plain' });
          res.end(`IFTTT maker request failed with error: ${err}`);
        })
        .pipe(res);
    } else {
      throw new Error('invalid digest');
    }
  } catch (err) {
    res.writeHead(401, { 'content-type': 'text/plain' });
    res.end(err.toString());
    console.warn(`Unauthorized request to ${req.url}`);
  }
});

server.listen(Number(process.env.PORT) || 8080);

module.exports = server;
