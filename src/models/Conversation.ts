import mySQLDatabaseAccess from '../database/mySQLDatabaseAccess';
import { ConversationSchema } from '../database/schema';
import User from './User';
import Message from './Message';

class Conversation {
  private id: number | null = null;
  private name: string | null = null;
  private userIds: Array<number> = [];
  private messageIds: Array<number> = [];
  private users: Array<User> = [];
  private messages: Array<Message> = [];

  private constructor() {
    // Instantiation is restricted to static methods
  }

  static mapTableRowToInstance(tableRow: ConversationSchema): Conversation {
    if (!tableRow) {
      return null;
    }

    const conversation = new Conversation();
    conversation.id = tableRow?.id;
    conversation.name = tableRow?.name?.toString();

    return conversation;
  }

  static async create(newConversation: Omit<ConversationSchema, 'id'>): Promise<Conversation> {
    try {
      const { insertId } = await mySQLDatabaseAccess.createConversation(newConversation);
      const conversation = new Conversation();
      conversation.id = insertId;
      conversation.name = newConversation.name;

      return conversation;
    } catch (error) {
      return Promise.reject(new Error('Error creating conversation'));
    }
  }

  static async findByConversationId(conversationId: number): Promise<Conversation> {
    try {
      const tableRow = await mySQLDatabaseAccess.getConversationById(conversationId);
      const conversation = this.mapTableRowToInstance(tableRow);

      return conversation;
    } catch (error) {
      return Promise.reject(new Error('Error finding conversation'));
    }
  }

  static async findByUserId(userId: number): Promise<Array<Conversation>> {
    try {
      const tableRows = await mySQLDatabaseAccess.getConversationsByUserId(userId);
      const conversations = tableRows.map(this.mapTableRowToInstance);

      return conversations;
    } catch (error) {
      return Promise.reject(new Error('Error finding conversations'));
    }
  }

  getName(): string {
    return this.name;
  }

  async getUserIds(): Promise<Array<number>> {
    return this.userIds;
  }

  async getMessageIds(): Promise<Array<number>> {
    return this.messageIds;
  }

  async update(fieldsToUpdate: Partial<Omit<ConversationSchema, 'id'>>): Promise<Conversation> {
    if (!this.id) {
      return Promise.reject(new Error('Conversation does not exist'));
    }

    try {
      await mySQLDatabaseAccess.updateConversation(fieldsToUpdate, this.id);
      this.name = fieldsToUpdate.name || this.name;

      return this;
    } catch (error) {
      return Promise.reject(new Error('Error updating conversation'));
    }
  }

  async delete(): Promise<void> {
    if (!this.id) {
      return Promise.reject(new Error('Conversation does not exist'));
    }

    try {
      await mySQLDatabaseAccess.deleteConversation(this.id);
      this.id = null;
      this.name = null;
    } catch (error) {
      return Promise.reject(new Error('Error deleting conversation'));
    }
  }

  async addUser(userId: number): Promise<void> {
    if (!this.id) {
      return Promise.reject(new Error('Conversation does not exist'));
    }

    try {
      await mySQLDatabaseAccess.createConversationUser(this.id, userId);
    } catch (error) {
      return Promise.reject(new Error('Error adding user to conversation'));
    }
  }

  async removeUser(userId: number): Promise<void> {
    if (!this.id) {
      return Promise.reject(new Error('Conversation does not exist'));
    }

    try {
      await mySQLDatabaseAccess.deleteConversationUser(this.id, userId);
    } catch (error) {
      return Promise.reject(new Error('Error removing user from conversation'));
    }
  }

  async getMessages(): Promise<Array<Message>> {
    if (!this.id) {
      return Promise.reject(new Error('Conversation does not exist'));
    }

    const messages = await Message.findByConversationId(this.id);
    this.messages = messages;

    return messages;
  }
}

export default Conversation;
