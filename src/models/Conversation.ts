import DatabaseAccess from '../types/DatabaseAccess';
import MySQLDatabaseAccess from '../database/MySQLDatabaseAccess';
import { MessageSchema, ConversationSchema } from '../types/schema';
import { ErrorMessage } from '../types/types';
import { encrypt, decrypt } from './utils/encryption';
import User from './User';
import Message from './Message';

class Conversation {
  private static databaseAccess: DatabaseAccess = MySQLDatabaseAccess.getInstance();

  private static dataMapper(databaseRow: ConversationSchema): Conversation {
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

  static async findById(conversationId: number): Promise<Conversation | null> {
    try {
      const databaseRow = await this.databaseAccess.getConversationById(conversationId);
      if (!databaseRow) {
        return null;
      }

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

  private id: number;
  private name: string;
  private users: Array<User> | null = null;
  private messages: Array<Message> | null = null;

  private constructor() {
    // Instantiation is restricted to static methods
  }

  getId = (): number => {
    return this.id;
  };

  getName = (): string => {
    return this.name;
  };

  truncate = (): { id: number | null; name: string | null } => {
    return { id: this.id, name: this.name };
  };

  update = async (fieldsToUpdate: Partial<Omit<ConversationSchema, 'id'>>): Promise<Conversation> => {
    if (!this.id) {
      return Promise.reject(new Error(ErrorMessage.CONVO_DOES_NOT_EXIST));
    }

    if (!fieldsToUpdate.name) {
      return Promise.reject(new Error(ErrorMessage.MISSING_INFO));
    }

    try {
      const fieldsToUpdateEncrypted: { name: string } = { name: encrypt(fieldsToUpdate.name) };
      await Conversation.databaseAccess.updateConversation(fieldsToUpdateEncrypted, this.id);
      this.name = fieldsToUpdate.name || this.name;

      return this;
    } catch (error) {
      return Promise.reject(error);
    }
  };

  getUsers = async (): Promise<Array<User>> => {
    if (!this.id) {
      return Promise.reject(new Error(ErrorMessage.CONVO_DOES_NOT_EXIST));
    }

    try {
      this.users = await User.findByConversationId(this.id);
      return this.users;
    } catch (error) {
      return Promise.reject(error);
    }
  };

  checkIfHasUser = async (userId: number): Promise<boolean> => {
    if (this.users === null) {
      await this.getUsers();
    }

    const conversationMemberIds = this.users?.map(user => user.getId());
    return !!conversationMemberIds?.includes(userId);
  };

  addUser = async (userId: number): Promise<void> => {
    if (!this.id) {
      return Promise.reject(new Error(ErrorMessage.CONVO_DOES_NOT_EXIST));
    }

    try {
      await Conversation.databaseAccess.insertConversationUser({ conversationId: this.id, userId });
    } catch (error) {
      return Promise.reject(error);
    }
  };

  removeUser = async (userId: number): Promise<void> => {
    if (!this.id) {
      return Promise.reject(new Error(ErrorMessage.CONVO_DOES_NOT_EXIST));
    }

    try {
      await Conversation.databaseAccess.deleteConversationUser(this.id, userId);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  getMessages = async (): Promise<Array<Message>> => {
    if (!this.id) {
      return Promise.reject(new Error(ErrorMessage.CONVO_DOES_NOT_EXIST));
    }

    try {
      const messages = await Message.findByConversationId(this.id);
      messages.sort((a, b) => a.getId() - b.getId());
      this.messages = messages;
      return messages;
    } catch (error) {
      return Promise.reject(error);
    }
  };

  createMessage = async (message: Omit<MessageSchema, 'id' | 'conversationId'>): Promise<Message> => {
    if (!this.id) {
      return Promise.reject(new Error(ErrorMessage.CONVO_DOES_NOT_EXIST));
    }

    try {
      const newMessage = await Message.create({ ...message, conversationId: this.id });
      return newMessage;
    } catch (error) {
      return Promise.reject(error);
    }
  };
}

export default Conversation;
