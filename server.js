const http = require('http');
const path = require('path');
const fs = require('fs');
const auth = require('http-auth')
require('dotenv').config();

const digestAuth = auth.digest({
  realm: "Provisioning Area",
  file: path.resolve(__dirname, ".htdigest"),
});

const provisioningFiles = {
  '/provisioning/tip125system.xml': path.resolve(__dirname, "provisioning", "tip125system.xml"),
  '/provisioning/4851CF4A2119.xml': path.resolve(__dirname, "provisioning", "4851CF4A2119.xml"),
};

function sendResponse(res, statusCode, headers, message) {
  res.writeHead(statusCode, headers);
  res.end(message);
}

function authenticateUser(req, res) {
  console.log(`Autenticando usuário: ${req.user || "nenhum usuário autenticado"}`);
  if(!req.user){
    sendResponse(res, 401, { 'Content-Type': 'text/plain' }, 'Unauthorized');
    console.error("401 - Unauthorized");
    return false;
  }
  return true;
}

function serveFile(res, filePath) {
  fs.readFile(filePath, 'utf8', (err,data) => {
    if (err) {
      console.error(`Failed to read file: ${filePath}`);
      sendResponse(res, 500, { 'Content-Type': 'text/plain' }, 'Internal Server Error');
      return;
    }
    sendResponse(res, 200, {
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`,
    }, data);
  });
}

const server = http.createServer(digestAuth.check((req, res) => {
  if (!authenticateUser(req, res)) return;

  const filePath = provisioningFiles[req.url];
  if(filePath){
    console.log(`Serving file: ${filePath}`);
    serveFile(res, filePath);
  } else {
    console.warn(`File not found: ${req.url}`);
    sendResponse(res, 404, { 'Content-Type': 'text/plain' }, 'Not Found');
  }
}));

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
