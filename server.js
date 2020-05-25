const { createServer } = require("http");
const handler = require("./dist");

server = createServer(handler);
server.listen(Number(process.env.PORT) || 8080);
