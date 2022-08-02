import { NextResponse } from 'next/server';

export const config = {
  matcher: '/:path*',
};

const frequency = 60 * 1000;
const timeout = process.env.UMAMI_TIMEOUT ? parseInt(process.env.UMAMI_TIMEOUT) : 600 ;
const functionAppUrl = process.env.FUNCTION_APP_URL;
let lastReqDateTime = Date.now();

function verifyIdle() {
  let now = Date.now();
  let diff = Math.abs(now - lastReqDateTime) / 1000;
  
  console.log(`[Idle] Last request was ${diff} seconds ago.`);
  
  if(diff < timeout) {
    setTimeout(() => verifyIdle(), frequency);
    return;
  }
  
  console.log(`[Idle] Timeout exceeded.`);

  if(!functionAppUrl) {
    process.exit(0);
  }

  fetch(functionAppUrl)
    .then((res) => {
      console.log("[Idle] " + res.status);
      process.exit(0);
    }
  );
}

setTimeout(() => verifyIdle(), frequency);

function customCollectEndpoint(req) {
  const collectEndpoint = process.env.COLLECT_API_ENDPOINT;

  if (collectEndpoint) {
    const url = req.nextUrl.clone();
    const { pathname } = url;

    if (pathname.endsWith(collectEndpoint)) {
      url.pathname = '/api/collect';
      return NextResponse.rewrite(url);
    }
  }
}

function customScriptName(req) {
  const scriptName = process.env.TRACKER_SCRIPT_NAME;

  if (scriptName) {
    const url = req.nextUrl.clone();
    const { pathname } = url;
    const names = scriptName.split(',').map(name => name.trim() + '.js');

    if (names.find(name => pathname.endsWith(name))) {
      url.pathname = '/umami.js';
      return NextResponse.rewrite(url);
    }
  }
}

function forceSSL(req, res) {
  if (process.env.FORCE_SSL && req.nextUrl.protocol === 'http:') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return res;
}

export default function middleware(req) {
  const fns = [customCollectEndpoint, customScriptName];

  for (const fn of fns) {
    const res = fn(req);
    if (res) {
      return res;
    }
  }

  lastReqDateTime = Date.now();

  return forceSSL(req, NextResponse.next());
}
