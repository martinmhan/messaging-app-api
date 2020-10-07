import DatabaseAccess from '../types/DatabaseAccess';
import MySQLDatabaseAccess from '../database/MySQLDatabaseAccess';
import { MessageSchema } from '../types/schema';
import { encrypt, decrypt } from './utils/encryption';

class Message {
  private static databaseAccess: DatabaseAccess = MySQLDatabaseAccess.getInstance();

  private static dataMapper(databaseRow: MessageSchema): Message {
    const message = new Message();
    message.id = databaseRow.id;
    message.conversationId = databaseRow.conversationId;
    message.userId = databaseRow.userId;
    message.text = decrypt(databaseRow.text.toString());

    return message;
  }

  static async create(newMessage: Omit<MessageSchema, 'id'>): Promise<Message> {
    try {
      const insert = {
        conversationId: newMessage.conversationId,
        userId: newMessage.userId,
        text: encrypt(newMessage.text),
      };
      const { insertId } = await this.databaseAccess.insertMessage(insert);
      const message = this.dataMapper({ id: insertId, ...insert });
      return message;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async findById(messageId: number): Promise<Message | null> {
    try {
      const databaseRow = await this.databaseAccess.getMessageById(messageId);
      if (!databaseRow) {
        return null;
      }

      const message = this.dataMapper(databaseRow);
      return message;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async findByConversationId(conversationId: number): Promise<Message[]> {
    try {
      const databaseRows = await this.databaseAccess.getMessagesByConversationId(conversationId);
      const messages = databaseRows.map(this.dataMapper);
      return messages;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private id: number;
  private conversationId: number;
  private userId: number;
  private text: string;

  private constructor() {
    // Instantiation is restricted to static methods
  }

  getId = (): number => {
    return this.id;
  };

  getConversationId = (): number => {
    return this.conversationId;
  };

  getUserId = (): number => {
    return this.userId;
  };

  getText = (): string => {
    return this.text;
  };
}

export default Message;
