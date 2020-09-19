import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

import app from './app';

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`HTTP server listening at localhost: ${PORT}`);
});
