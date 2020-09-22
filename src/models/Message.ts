import mySQLDatabaseAccess from '../database/mySQLDatabaseAccess';
import { MessageSchema } from '../database/schema';

class Message {
  private id: number | null = null;
  private conversationId: number | null = null;
  private userId: number | null = null;
  private text: string | null = null;

  private constructor() {
    // Instantiation is restricted to static methods
  }

  static mapTableRowToInstance(tableRow: MessageSchema): Message {
    if (!tableRow) {
      return null;
    }

    const message = new Message();
    message.id = tableRow?.id;
    message.conversationId = tableRow?.conversationId;
    message.userId = tableRow?.userId;
    message.text = tableRow?.text?.toString();

    return message;
  }

  static async create(newMessage: Omit<MessageSchema, 'id'>): Promise<Message> {
    const { insertId } = await mySQLDatabaseAccess.createMessage(newMessage);
    const message = this.mapTableRowToInstance({ id: insertId, ...newMessage });

    return message;
  }

  static async findByConversationId(conversationId: number): Promise<Array<Message>> {
    const tableRows = await mySQLDatabaseAccess.getMessagesByConversationId(conversationId);
    const messages = tableRows.map(this.mapTableRowToInstance);

    return messages;
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
