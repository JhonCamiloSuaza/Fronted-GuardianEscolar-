const http = require('http');

const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = 8080;
const PROXY_PORT = Number(process.env.PROXY_PORT || 8083);

function setCorsHeaders(response, origin) {
  response.setHeader('Access-Control-Allow-Origin', origin || '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type,Accept');
  response.setHeader('Access-Control-Allow-Credentials', 'true');
}

const server = http.createServer((request, response) => {
  setCorsHeaders(response, request.headers.origin);

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  const headers = { ...request.headers, host: `${TARGET_HOST}:${TARGET_PORT}` };
  delete headers.origin;

  const proxyRequest = http.request(
    {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: request.url,
      method: request.method,
      headers,
    },
    (proxyResponse) => {
      response.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
      proxyResponse.pipe(response);
    }
  );

  proxyRequest.on('error', (error) => {
    response.writeHead(502, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'Backend proxy error', message: error.message }));
  });

  request.pipe(proxyRequest);
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`Backend proxy listening on http://0.0.0.0:${PROXY_PORT}`);
  console.log(`Forwarding to http://${TARGET_HOST}:${TARGET_PORT}`);
});
