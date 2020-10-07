import http from 'http';
import dotenv from 'dotenv';
import socketIo from 'socket.io';

dotenv.config();

import app from './app';
import SocketServer from './api/SocketServer';

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

const io = socketIo(server);
const socketServer = new SocketServer(io);
socketServer.addHandlers();

server.listen(PORT, () => {
  console.log(`HTTP server listening at localhost: ${PORT}`);
});
