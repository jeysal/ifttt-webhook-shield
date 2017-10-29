# ifttt-webhook-shield
> IFTTT webhook URLs without embedded maker key

[![build status](https://img.shields.io/travis/jeysal/ifttt-webhook-shield/master.svg?style=flat-square)](https://travis-ci.org/jeysal/ifttt-webhook-shield)
[![AppVeyor build status](https://img.shields.io/appveyor/ci/jeysal/ifttt-webhook-shield/master.svg?style=flat-square&label=windows+build)](https://ci.appveyor.com/project/jeysal/ifttt-webhook-shield)
[![code coverage](https://img.shields.io/codecov/c/github/jeysal/ifttt-webhook-shield/master.svg?style=flat-square)](https://codecov.io/gh/jeysal/ifttt-webhook-shield)

[![npm package](https://img.shields.io/npm/v/ifttt-webhook-shield.svg?style=flat-square)](https://www.npmjs.com/package/ifttt-webhook-shield)
[![license](https://img.shields.io/github/license/jeysal/ifttt-webhook-shield.svg?style=flat-square)](https://github.com/jeysal/ifttt-webhook-shield/blob/master/LICENSE)

## The problem

[IFTTT webhooks](https://ifttt.com/maker_webhooks) are a great tool for integrating IFTTT with anything that supports HTTP.  
However, they have a small shortcoming: You cannot give a link to anyone without compromising your IFTTT maker key, because it is embedded in the URL:
`https://maker.ifttt.com/trigger/<event>/with/key/<here it is>`  
If you were to, say, stick a NFC tag somewhere in your home, with an IFTTT webhook link on it to toggle one of your smart light bulbs
so visitors can turn the lights on and off by holding their phone up against it, you would enable them to trigger any arbitrary webhook event -
including the one that orders you new items worth 1000$, unlocks your front door or does whatever else you may have configured -
because they have your key now.

## The solution

Do not give anyone a direct webhook link with your key embedded in it - instead, give them links that are authenticated, but only for one specific event.

This application creates an HTTP server that accepts requests to `/<event>/<digest>`,
but only forwards them to IFTTT if the digest is a valid [HMAC](https://en.wikipedia.org/wiki/Hash-based_message_authentication_code) (sha256) over the event,
using a secret that you gave the application.
Your actual IFTTT maker key is only available to this server, not to anyone who gets a link to trigger webhook events.

## Configuration

The following environment variables need to be set:

* `PORT` (the server port, default `8080`)
* `MAKER_KEY` (your IFTTT maker key from [here](https://ifttt.com/services/maker_webhooks/settings))
* `HMAC_SECRET` (a sufficiently large and random secret, see ["Running"](#running))

## Running

WARNING: If you make the server available to more than just your private network, you should definitely put an HTTPS proxy in front of it.

[Node.js](https://nodejs.org/) and npm are required.

```bash
npm install
npm run build
head -c128 /dev/random >secret
MAKER_KEY=YOURKEYHERE HMAC_SECRET="$(cat secret)" npm start
```

If you visit `localhost:8080/abc/xyz` now, you should be greeted with a nice `invalid digest` message.

So how can we trigger the webhook event `abc` now?
[OpenSSL](https://www.openssl.org/) is really good at calculating digests, so we'll just use that:

```bash
echo -n abc | openssl dgst -hex -sha256 -hmac "$(cat secret)"
```

This should output `(stdin)= <digest>`. Use that digest to navigate to `localhost:8080/abc/<digest>`.
This time, you should see `Congratulations! You've fired the abc event`, indicating that the request was successful.
If you give the URL you used here to somebody else, they will only be able to trigger this particular event on your IFTTT maker channel.

### Zeit Now

This application is ready for deployment on the [Zeit](https://zeit.co/) platform.
If you deploy there, your IFTTT webhook shield will instantly be globally available behind a secure HTTPS proxy.

Set up Zeit Now and generate a secret as shown above.
Then, instead of `npm start`ing locally, create the required `now secret`s and deploy:

```bash
now secrets add ifttt-maker-key YOURKEYHERE
now secrets add ifttt-webhook-shield-hmac-secret "$(cat secret)"
now
```
