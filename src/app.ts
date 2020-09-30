import express from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import apiRouter from './controllers/apiRouter';

const app = express();

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('tiny'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use('/api', apiRouter);

export default app;
