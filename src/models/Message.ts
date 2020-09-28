import MySQLDatabaseAccess from '../database/mySQLDatabaseAccess';
import { MessageSchema } from '../database/schema';

const mySQLDatabaseAccess = new MySQLDatabaseAccess();

class Message {
  private id: number | null = null;
  private conversationId: number | null = null;
  private userId: number | null = null;
  private text: string | null = null;

  private constructor() {
    // Instantiation is restricted to static methods
  }

  static mapDBRowToInstance(databaseRow: MessageSchema): Message {
    if (!databaseRow) {
      return null;
    }

    const message = new Message();
    message.id = databaseRow?.id;
    message.conversationId = databaseRow?.conversationId;
    message.userId = databaseRow?.userId;
    message.text = databaseRow?.text?.toString();

    return message;
  }

  static async create(newMessage: Omit<MessageSchema, 'id'>): Promise<Message> {
    try {
      const { insertId } = await mySQLDatabaseAccess.createMessage(newMessage);
      const message = this.mapDBRowToInstance({ id: insertId, ...newMessage });
      return message;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async findByConversationId(conversationId: number): Promise<Array<Message>> {
    try {
      const databaseRows = await mySQLDatabaseAccess.getMessagesByConversationId(conversationId);
      const messages = databaseRows.map(this.mapDBRowToInstance);
      return messages;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  getId(): number {
    return this.id;
  }

  getConversationId(): number {
    return this.conversationId;
  }

  getUserId(): number {
    return this.userId;
  }

  getText(): string {
    return this.text;
  }
}

export default Message;
