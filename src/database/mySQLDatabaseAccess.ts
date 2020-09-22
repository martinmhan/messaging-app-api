import mysql from 'mysql';

import { UserSchema, ConversationSchema, MessageSchema } from './schema';
import queries from './queries';

const host: string = process.env.DB_HOST;
const user: string = process.env.DB_USER;
const password: string = process.env.DB_PASS;
const database: string = process.env.DB_NAME;
const encryptionKey: string = process.env.DB_ENC_KEY;

if (!host || !user || !password || !database || !encryptionKey) {
  throw new Error('Missing required environment variable(s). Please edit your .env file');
}

class MySQLDatabaseAccess {
  connection: mysql.Connection;

  constructor(connectionConfig: mysql.ConnectionConfig) {
    this.connection = mysql.createConnection(connectionConfig);
    this.connection.on('end', (err?: mysql.MysqlError) => {
      console.log('MySQL database connection closed' + (err && ` due to error: ${err}`));
    });
  }

  connect(): void {
    this.connection?.connect((error: mysql.MysqlError) => {
      if (error) {
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

  // User queries
  async createUser(newUser: Omit<UserSchema, 'id'>): Promise<{ insertId: number }> {
    const insertResult = await this.runQuery(queries.createUser, [newUser]);
    return { insertId: insertResult.insertId };
  }

  async getUserById(userId: number): Promise<UserSchema> {
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

  async updateUser(fieldsToUpdate: Partial<Omit<UserSchema, 'id' | 'userName'>>, userId: number): Promise<void> {
    await this.runQuery(queries.updateUser, [fieldsToUpdate, userId]);
  }

  async deleteUser(userId: number): Promise<void> {
    await this.runQuery(queries.deleteUserById, [userId]);
  }

  // Conversation queries
  async createConversation(newConversation: Omit<ConversationSchema, 'id'>): Promise<{ insertId: number }> {
    const insertResult = await this.runQuery(queries.createConversation, [newConversation]);
    return { insertId: insertResult.insertId };
  }

  async getConversationById(conversationId: number): Promise<ConversationSchema> {
    const [conversationRowItem] = await this.runQuery(queries.getConversationById, [conversationId]);
    return conversationRowItem;
  }

  async getConversationsByUserId(userId: number): Promise<Array<ConversationSchema>> {
    const conversationRowItems = await this.runQuery(queries.getConversationsByUserId, [userId]);
    return conversationRowItems;
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
  async createConversationUser(conversationId: number, userId: number): Promise<{ insertId: number }> {
    const insertResult = await this.runQuery(queries.createConversationUser, [{ conversationId, userId }]);
    return { insertId: insertResult.insertId };
  }

  async deleteConversationUser(conversationId: number, userId: number): Promise<void> {
    await this.runQuery(queries.deleteConversationUser, [conversationId, userId]);
  }

  // Message queries
  async createMessage(newMessage: Omit<MessageSchema, 'id'>): Promise<{ insertId: number }> {
    const insertResult = await this.runQuery(queries.createMessage, [newMessage]);
    return { insertId: insertResult.insertId };
  }

  async getMessagesByConversationId(conversationId: number): Promise<Array<MessageSchema>> {
    const messageRows = await this.runQuery(queries.getMessagesByConversationId, [conversationId]);
    return messageRows;
  }
}

const mySQLDatabaseAccess = new MySQLDatabaseAccess({ host, user, password, database });

mySQLDatabaseAccess.connect();

export default mySQLDatabaseAccess;
