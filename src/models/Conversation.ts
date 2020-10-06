import DatabaseAccess from '../database/DatabaseAccess';
import MySQLDatabaseAccess from '../database/MySQLDatabaseAccess';
import { MessageSchema, ConversationSchema } from '../database/schema';
import { encrypt, decrypt } from './utils/encryption';
import User from './User';
import Message from './Message';

class Conversation {
  private static databaseAccess: DatabaseAccess = MySQLDatabaseAccess.getInstance();
  private static CONVO_DOES_NOT_EXIST = 'Conversation does not exist';

  private static dataMapper(databaseRow: ConversationSchema): Conversation {
    if (!databaseRow) {
      return null;
    }

    const conversation = new Conversation();
    conversation.id = databaseRow?.id;
    conversation.name = decrypt(databaseRow?.name?.toString());

    return conversation;
  }

  static async create(newConversation: Omit<ConversationSchema, 'id'>): Promise<Conversation> {
    try {
      const insert = { name: encrypt(newConversation.name) };
      const { insertId } = await this.databaseAccess.insertConversation(insert);
      const conversation = this.dataMapper({ id: insertId, ...insert });

      return conversation;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async findById(conversationId: number): Promise<Conversation> {
    try {
      const databaseRow = await this.databaseAccess.getConversationById(conversationId);
      const conversation = this.dataMapper(databaseRow);

      return conversation;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async findByUserId(userId: number): Promise<Array<Conversation>> {
    try {
      const databaseRows = await this.databaseAccess.getConversationsByUserId(userId);
      const conversations = databaseRows.map(this.dataMapper);

      return conversations;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private id: number | null = null;
  private name: string | null = null;
  private users: Array<User> | null = null;
  private messages: Array<Message> | null = null;

  private constructor() {
    // Instantiation is restricted to static methods
  }

  getId(): number {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  truncate(): { id: number; name: string } {
    return { id: this.id, name: this.name };
  }

  async update(fieldsToUpdate: Partial<Omit<ConversationSchema, 'id'>>): Promise<Conversation> {
    if (!this.id) {
      return Promise.reject(new Error(Conversation.CONVO_DOES_NOT_EXIST));
    }

    try {
      const fieldsToUpdateEncrypted: { name: string } = { name: encrypt(fieldsToUpdate.name) };
      await Conversation.databaseAccess.updateConversation(fieldsToUpdateEncrypted, this.id);
      this.name = fieldsToUpdate.name || this.name;

      return this;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getUsers(): Promise<Array<User>> {
    if (!this.id) {
      return Promise.reject(new Error(Conversation.CONVO_DOES_NOT_EXIST));
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
      return Promise.reject(new Error(Conversation.CONVO_DOES_NOT_EXIST));
    }

    try {
      await Conversation.databaseAccess.insertConversationUser({ conversationId: this.id, userId });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async removeUser(userId: number): Promise<void> {
    if (!this.id) {
      return Promise.reject(new Error(Conversation.CONVO_DOES_NOT_EXIST));
    }

    try {
      await Conversation.databaseAccess.deleteConversationUser(this.id, userId);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getMessages(): Promise<Array<Message>> {
    if (!this.id) {
      return Promise.reject(new Error(Conversation.CONVO_DOES_NOT_EXIST));
    }

    try {
      const messages = await Message.findByConversationId(this.id);
      messages.sort((a, b) => a.getId() - b.getId()); // TO DO - sort by createdDate
      this.messages = messages;
      return messages;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async createMessage(message: Omit<MessageSchema, 'id' | 'conversationId'>): Promise<Message> {
    if (!this.id) {
      return Promise.reject(new Error(Conversation.CONVO_DOES_NOT_EXIST));
    }

    try {
      const newMessage = await Message.create({ ...message, conversationId: this.id });
      return newMessage;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

export default Conversation;
