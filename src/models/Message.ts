import mySQLDatabaseAccess from '../database/mySQLDatabaseAccess';
import { MessageSchema } from '../database/schema';

class Message {
  id: number | null = null;
  conversationId: number | null = null;
  userId: number | null = null;
  text: string | null = null;

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
    const message = new Message();
    message.id = insertId;
    message.conversationId = newMessage.conversationId;
    message.userId = newMessage.userId;
    message.text = newMessage.text;

    return message;
  }

  static async findByConversationId(conversationId: number): Promise<Array<Message>> {
    const tableRows = await mySQLDatabaseAccess.getMessagesByConversationId(conversationId);
    const messages = tableRows.map(this.mapTableRowToInstance);

    return messages;
  }
}

export default Message;
