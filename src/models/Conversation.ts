import mySQLDatabaseAccess from '../database/mySQLDatabaseAccess';
import { MessageSchema, ConversationSchema } from '../database/schema';
import { encrypt, decrypt } from '../utils/encryption';
import User from './User';
import Message from './Message';

class Conversation {
  private id: number | null = null;
  private name: string | null = null;
  private users: Array<User> | null = null;
  private messages: Array<Message> | null = null;

  private constructor() {
    // Instantiation is restricted to static methods
  }

  static constants = {
    CONVO_DOES_NOT_EXIST: 'Conversation does not exist',
  };

  static mapTableRowToInstance(tableRow: ConversationSchema): Conversation {
    if (!tableRow) {
      return null;
    }

    const conversation = new Conversation();
    conversation.id = tableRow?.id;
    conversation.name = decrypt(tableRow?.name?.toString());

    return conversation;
  }

  static async create(newConversation: Omit<ConversationSchema, 'id'>): Promise<Conversation> {
    try {
      const insert = { name: encrypt(newConversation.name) };
      const { insertId } = await mySQLDatabaseAccess.createConversation(insert);
      const conversation = this.mapTableRowToInstance({ id: insertId, ...insert });

      return conversation;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async findById(conversationId: number): Promise<Conversation> {
    try {
      const tableRow = await mySQLDatabaseAccess.getConversationById(conversationId);
      const conversation = this.mapTableRowToInstance(tableRow);

      return conversation;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async findByUserId(userId: number): Promise<Array<Conversation>> {
    try {
      const tableRows = await mySQLDatabaseAccess.getConversationsByUserId(userId);
      const conversations = tableRows.map(this.mapTableRowToInstance);

      return conversations;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  getId(): number {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  async update(fieldsToUpdate: Partial<Omit<ConversationSchema, 'id'>>): Promise<Conversation> {
    if (!this.id) {
      return Promise.reject(new Error(Conversation.constants.CONVO_DOES_NOT_EXIST));
    }

    try {
      const fieldsToUpdateEncrypted: { name: string } = { name: encrypt(fieldsToUpdate.name) };
      await mySQLDatabaseAccess.updateConversation(fieldsToUpdateEncrypted, this.id);
      this.name = fieldsToUpdate.name || this.name;

      return this;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getUsers(): Promise<Array<User>> {
    if (!this.id) {
      return Promise.reject(new Error(Conversation.constants.CONVO_DOES_NOT_EXIST));
    }

    try {
      this.users = await User.findByConversationId(this.id);
      return this.users;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async checkIfHasUser(userId: number): Promise<boolean> {
    if (this.users === null) {
      await this.getUsers();
    }

    const conversationMemberIds = this.users.map(user => user.getId());
    return conversationMemberIds.includes(userId);
  }

  async addUser(userId: number): Promise<void> {
    if (!this.id) {
      return Promise.reject(new Error(Conversation.constants.CONVO_DOES_NOT_EXIST));
    }

    try {
      await mySQLDatabaseAccess.createConversationUser(this.id, userId);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async removeUser(userId: number): Promise<void> {
    if (!this.id) {
      return Promise.reject(new Error(Conversation.constants.CONVO_DOES_NOT_EXIST));
    }

    try {
      await mySQLDatabaseAccess.deleteConversationUser(this.id, userId);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getMessages(): Promise<Array<Message>> {
    if (!this.id) {
      return Promise.reject(new Error(Conversation.constants.CONVO_DOES_NOT_EXIST));
    }

    try {
      const messages = await Message.findByConversationId(this.id);
      this.messages = messages;
      return messages;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async createMessage(message: Omit<MessageSchema, 'id'>): Promise<Message> {
    if (!this.id) {
      return Promise.reject(new Error(Conversation.constants.CONVO_DOES_NOT_EXIST));
    }

    try {
      const newMessage = await Message.create(message);
      return newMessage;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

export default Conversation;
