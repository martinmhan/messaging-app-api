import mysql from 'mysql';

import { ErrorMessage } from '../types/types';
import DatabaseAccess from '../types/DatabaseAccess';
import { UserSchema, ConversationSchema, MessageSchema, ConversationUserSchema } from '../types/schema';
import { Query } from '../types/query';

const host: string | undefined = process.env.DB_HOST;
const user: string | undefined = process.env.DB_USER;
const password: string | undefined = process.env.DB_PASS;
const database: string | undefined = process.env.DB_NAME;

if (!host || !user || !password || !database) {
  throw new Error(ErrorMessage.MISSING_ENV_VARS);
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

  connect(connectionConfig: mysql.ConnectionConfig): Promise<void> {
    this.connection?.end();
    this.connection = mysql.createConnection(connectionConfig);

    return new Promise((resolve, reject) => {
      this.connection?.connect((error: mysql.MysqlError) => {
        if (error) {
          return reject(error);
        }
      });
    });
  }

  disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connection?.end((error?: mysql.MysqlError) => {
        if (error) {
          reject(error);
        }
      });
    });
  }

  private runQuery(query: Query, params: unknown[]): Promise<any> {
    if (!this.connection) {
      return Promise.reject(new Error('connection is not set'));
    }

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
    const insertResult = await this.runQuery(Query.insertUser, [newUser]);
    return { insertId: insertResult.insertId };
  }

  async getUserById(userId: number): Promise<UserSchema> {
    const [userRow] = await this.runQuery(Query.getUserById, [userId]);
    return userRow;
  }

  async getUserByUserName(userName: string): Promise<UserSchema> {
    const [userRow] = await this.runQuery(Query.getUserByUserName, [userName]);
    return userRow;
  }

  async getUsersByConversationId(conversationId: number): Promise<UserSchema[]> {
    const userRows = await this.runQuery(Query.getUsersByConversationId, [conversationId]);
    return userRows;
  }

  async updateUser(fieldsToUpdate: Partial<Omit<UserSchema, 'id' | 'userName'>>, userId: number): Promise<void> {
    await this.runQuery(Query.updateUser, [fieldsToUpdate, userId]);
  }

  async deleteUser(userId: number): Promise<void> {
    await this.runQuery(Query.deleteUserById, [userId]);
  }

  // Conversation queries
  async insertConversation(newConversation: Omit<ConversationSchema, 'id'>): Promise<{ insertId: number }> {
    const insertResult = await this.runQuery(Query.insertConversation, [newConversation]);
    return { insertId: insertResult.insertId };
  }

  async getConversationById(conversationId: number): Promise<ConversationSchema> {
    const [conversationRow] = await this.runQuery(Query.getConversationById, [conversationId]);
    return conversationRow;
  }

  async getConversationsByUserId(userId: number): Promise<ConversationSchema[]> {
    const conversationRows = await this.runQuery(Query.getConversationsByUserId, [userId]);
    return conversationRows;
  }

  async updateConversation(
    fieldsToUpdate: Partial<Omit<ConversationSchema, 'id'>>,
    conversationId: number,
  ): Promise<void> {
    await this.runQuery(Query.updateConversation, [fieldsToUpdate, conversationId]);
  }

  async deleteConversation(conversationId: number): Promise<void> {
    await this.runQuery(Query.deleteConversation, [conversationId]);
  }

  // ConversationUser queries
  async insertConversationUser(conversationUser: Omit<ConversationUserSchema, 'id'>): Promise<{ insertId: number }> {
    const insertResult = await this.runQuery(Query.insertConversationUser, [conversationUser]);
    return { insertId: insertResult.insertId };
  }

  async deleteConversationUser(conversationId: number, userId: number): Promise<void> {
    await this.runQuery(Query.deleteConversationUser, [conversationId, userId]);
  }

  async deleteConversationUsersByUserId(userId: number): Promise<void> {
    await this.runQuery(Query.deleteConversationUsersByUserId, [userId]);
  }

  // Message queries
  async insertMessage(newMessage: Omit<MessageSchema, 'id'>): Promise<{ insertId: number }> {
    const insertResult = await this.runQuery(Query.insertMessage, [newMessage]);
    return { insertId: insertResult.insertId };
  }

  async getMessageById(messageId: number): Promise<MessageSchema> {
    const [messageRow] = await this.runQuery(Query.getMessageById, [messageId]);
    return messageRow;
  }

  async getMessagesByConversationId(conversationId: number): Promise<MessageSchema[]> {
    const messageRows = await this.runQuery(Query.getMessagesByConversationId, [conversationId]);
    return messageRows;
  }
}

MySQLDatabaseAccess.getInstance().connect({ host, user, password, database });

export default MySQLDatabaseAccess;
