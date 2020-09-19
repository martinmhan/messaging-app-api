import mysql from 'mysql';

const host: string = process.env.DB_HOST;
const user: string = process.env.DB_USER;
const password: string = process.env.DB_PASS;
const database: string = process.env.DB_NAME;

const dbConnection = mysql.createConnection({
  host,
  user,
  password,
  database,
});

dbConnection.connect();

export default dbConnection;
