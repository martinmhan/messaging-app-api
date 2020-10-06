import http from 'http';
import dotenv from 'dotenv';
import socketIo from 'socket.io';

dotenv.config();

import app from './app';
import Socket from './controllers/socket/SocketServer';

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

const io = socketIo(server);
const socket = new Socket(io);
socket.addHandlers();

server.listen(PORT, () => {
  console.log(`HTTP server listening at localhost: ${PORT}`);
});
