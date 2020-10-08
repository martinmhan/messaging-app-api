import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import SocketServer from './api/SocketServer';

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

const socketServer = new SocketServer(server);
socketServer.init();

server.listen(PORT, () => {
  console.log(`HTTP server listening at localhost: ${PORT}`);
});
