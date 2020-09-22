import mysql from 'mysql';

import { UserSchema } from './schema';
import queries from './queries';

const host: string = process.env.DB_HOST;
const user: string = process.env.DB_USER;
const password: string = process.env.DB_PASS;
const database: string = process.env.DB_NAME;

if (!host || !user || !password || !database) {
  throw new Error('Missing required database environment variable(s)');
}

/*
  All database queries must go through this DAO class
  Logic in this class should be simple and limited to running queries
  Domain-level logic should be in their respective business object class
*/
class MySQLDatabaseAccess {
  connection: mysql.Connection;

  constructor(connectionConfig: mysql.ConnectionConfig) {
    this.connection = mysql.createConnection(connectionConfig);
  }

  connect(): void {
    this.connection?.connect((error: mysql.MysqlError) => {
      if (error) {
        console.error('Error connecting to MySQL: ', error);
        throw error;
      } else {
        console.log('Successfully connected to MySQL database');
      }
    });
  }

  runQuery(query: string, params: Array<unknown>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.connection?.query(query, params, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  async getUserByUserId(userId: number): Promise<UserSchema> {
    const [userRowItem] = await this.runQuery(queries.getUserById, [userId]);
    return userRowItem;
  }

  async getUserByUserName(userName: string): Promise<UserSchema> {
    const [userRowItem] = await this.runQuery(queries.getUserByUserName, [userName]);
    return userRowItem;
  }

  async getUsersByConversationId(conversationId: number): Promise<Array<UserSchema>> {
    const userRowItems = await this.runQuery(queries.getUsersByConversationId, [conversationId]);
    return userRowItems;
  }

  async createUser(newUser: {
    userName: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<{ insertId: number }> {
    const insertResult = await this.runQuery(queries.createUser, [newUser]);

    return { insertId: insertResult.insertId };
  }

  async updateUser(fieldsToUpdate: Partial<Omit<UserSchema, 'id' | 'userName'>>, userId: number): Promise<void> {
    await this.runQuery(queries.updateUser, [fieldsToUpdate, userId]);
  }

  async deleteUser(userId: number): Promise<void> {
    await this.runQuery(queries.deleteUserById, [userId]);
  }
}

const mySQLDatabaseAccess = new MySQLDatabaseAccess({ host, user, password, database });

mySQLDatabaseAccess.connect();

export default mySQLDatabaseAccess;
