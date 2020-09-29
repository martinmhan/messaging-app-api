import mysql from 'mysql';

import DatabaseAccess from './DatabaseAccess';
import { UserSchema, ConversationSchema, MessageSchema } from './schema';
import queries from './queries';

const host: string = process.env.DB_HOST;
const user: string = process.env.DB_USER;
const password: string = process.env.DB_PASS;
const database: string = process.env.DB_NAME;

if (!host || !user || !password || !database) {
  throw new Error('Missing required environment variable(s). Please edit .env file');
}

class MySQLDatabaseAccess implements DatabaseAccess {
  private static instance: MySQLDatabaseAccess;

  static getInstance(): MySQLDatabaseAccess {
    if (!this.instance) {
      this.instance = new MySQLDatabaseAccess();
    }

    return this.instance;
  }

  private constructor() {
    // Instantiation is restricted to getInstance method
  }

  private connection: mysql.Connection;

  setConnection(mysqlConnection: mysql.Connection): void {
    this.connection = mysqlConnection;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connection?.connect((error: mysql.MysqlError) => {
        if (error) {
          return reject(error);
        } else {
          console.log('Successfully connected to MySQL database');
        }
      });
    });
  }

  disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connection?.end((error: mysql.MysqlError) => {
        if (error) {
          reject(error);
        } else {
          console.log('Successfully disconnected from MySQL database');
        }
      });
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

  // User queries
  async insertUser(newUser: Omit<UserSchema, 'id'>): Promise<{ insertId: number }> {
    const insertResult = await this.runQuery(queries.insertUser, [newUser]);
    return { insertId: insertResult.insertId };
  }

  async getUserById(userId: number): Promise<UserSchema> {
    const [userRow] = await this.runQuery(queries.getUserById, [userId]);
    return userRow;
  }

  async getUserByUserName(userName: string): Promise<UserSchema> {
    const [userRow] = await this.runQuery(queries.getUserByUserName, [userName]);
    return userRow;
  }

  async getUsersByConversationId(conversationId: number): Promise<Array<UserSchema>> {
    const userRows = await this.runQuery(queries.getUsersByConversationId, [conversationId]);
    return userRows;
  }

  async updateUser(fieldsToUpdate: Partial<Omit<UserSchema, 'id' | 'userName'>>, userId: number): Promise<void> {
    await this.runQuery(queries.updateUser, [fieldsToUpdate, userId]);
  }

  async deleteUser(userId: number): Promise<void> {
    await this.runQuery(queries.deleteUserById, [userId]);
  }

  // Conversation queries
  async insertConversation(newConversation: Omit<ConversationSchema, 'id'>): Promise<{ insertId: number }> {
    const insertResult = await this.runQuery(queries.insertConversation, [newConversation]);
    return { insertId: insertResult.insertId };
  }

  async getConversationById(conversationId: number): Promise<ConversationSchema> {
    const [conversationRow] = await this.runQuery(queries.getConversationById, [conversationId]);
    return conversationRow;
  }

  async getConversationsByUserId(userId: number): Promise<Array<ConversationSchema>> {
    const conversationRows = await this.runQuery(queries.getConversationsByUserId, [userId]);
    return conversationRows;
  }

  async updateConversation(
    fieldsToUpdate: Partial<Omit<ConversationSchema, 'id'>>,
    conversationId: number,
  ): Promise<void> {
    await this.runQuery(queries.updateConversation, [fieldsToUpdate, conversationId]);
  }

  async deleteConversation(conversationId: number): Promise<void> {
    await this.runQuery(queries.deleteConversation, [conversationId]);
  }

  // ConversationUser queries
  async insertConversationUser(conversationId: number, userId: number): Promise<{ insertId: number }> {
    const insertResult = await this.runQuery(queries.insertConversationUser, [{ conversationId, userId }]);
    return { insertId: insertResult.insertId };
  }

  async deleteConversationUser(conversationId: number, userId: number): Promise<void> {
    await this.runQuery(queries.deleteConversationUser, [conversationId, userId]);
  }

  async deleteConversationUsersByUserId(userId: number): Promise<void> {
    await this.runQuery(queries.deleteConversationUsersByUserId, [userId]);
  }

  // Message queries
  async insertMessage(newMessage: Omit<MessageSchema, 'id'>): Promise<{ insertId: number }> {
    const insertResult = await this.runQuery(queries.insertMessage, [newMessage]);
    return { insertId: insertResult.insertId };
  }

  async getMessagesByConversationId(conversationId: number): Promise<Array<MessageSchema>> {
    const messageRows = await this.runQuery(queries.getMessagesByConversationId, [conversationId]);
    return messageRows;
  }
}

const mysqlConnection = mysql.createConnection({ host, user, password, database });
mysqlConnection.on('end', (error: mysql.MysqlError) => {
  if (error) {
    console.error(`MySQL database connection ended due to error: ${error}`);
  } else {
    console.log('MySQL database connection ended');
  }
});

MySQLDatabaseAccess.getInstance().setConnection(mysqlConnection);
MySQLDatabaseAccess.getInstance().connect();

export default MySQLDatabaseAccess;
