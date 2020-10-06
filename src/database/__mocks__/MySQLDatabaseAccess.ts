import DatabaseAccess from '../DatabaseAccess';
import { UserSchema, ConversationSchema, MessageSchema, ConversationUserSchema } from '../schema';

const host: string = process.env.DB_HOST;
const user: string = process.env.DB_USER;
const password: string = process.env.DB_PASS;
const database: string = process.env.DB_NAME;

if (!host || !user || !password || !database) {
  throw new Error('Missing required environment variable(s). Please edit .env file');
}

class MySQLDatabaseAccessMock implements DatabaseAccess {
  private static instance: MySQLDatabaseAccessMock;

  static getInstance(): MySQLDatabaseAccessMock {
    if (!this.instance) {
      this.instance = new MySQLDatabaseAccessMock();
    }

    return this.instance;
  }

  private constructor() {
    // Instantiation is restricted to getInstance method
  }

  private mockDatabase: {
    user: Array<UserSchema>;
    conversation: Array<ConversationSchema>;
    message: Array<MessageSchema>;
    conversationUser: Array<{ id: number; userId: number; conversationId: number }>;
  } = {
    user: [],
    conversation: [],
    message: [],
    conversationUser: [],
  };

  connect(): void {
    // placeholder method for tests
  }

  disconnect(): void {
    // placeholder method for tests
  }

  // User queries
  async insertUser(newUser: Omit<UserSchema, 'id'>): Promise<{ insertId: number }> {
    const [lastUser] = this.mockDatabase.user.slice(-1);
    const lastUserId = lastUser?.id || 0;
    const insert = {
      ...newUser,
      id: lastUserId + 1,
    };

    this.mockDatabase.user.push(insert);
    return { insertId: insert.id };
  }

  async getUserById(userId: number): Promise<UserSchema> {
    const [userRow] = this.mockDatabase.user.filter(user => user.id === userId);
    return userRow;
  }

  async getUserByUserName(userName: string): Promise<UserSchema> {
    const [userRow] = this.mockDatabase.user.filter(user => user.userName === userName);
    return userRow;
  }

  async getUsersByConversationId(conversationId: number): Promise<Array<UserSchema>> {
    const userIds = this.mockDatabase.conversationUser
      .filter(conversationUser => conversationUser.conversationId === conversationId)
      .map(conversationUser => conversationUser.userId);

    const userRows = this.mockDatabase.user.filter(user => userIds.includes(user.id));
    return userRows;
  }

  async updateUser(fieldsToUpdate: Partial<Omit<UserSchema, 'id' | 'userName'>>, userId: number): Promise<void> {
    const user = await this.getUserById(userId);
    user.firstName = fieldsToUpdate.firstName || user.firstName;
    user.lastName = fieldsToUpdate.lastName || user.lastName;
    user.email = fieldsToUpdate.email || user.email;
    user.passwordHash = fieldsToUpdate.passwordHash || user.passwordHash;
    user.passwordSalt = fieldsToUpdate.passwordSalt || user.passwordSalt;
  }

  async deleteUser(userId: number): Promise<void> {
    for (let i = 0; i < this.mockDatabase.user.length; i += 1) {
      const user = this.mockDatabase.user[i];
      if (user.id === userId) {
        this.mockDatabase.user.splice(i, 1);
        break;
      }
    }
  }

  // Conversation queries
  async insertConversation(newConversation: Omit<ConversationSchema, 'id'>): Promise<{ insertId: number }> {
    const [lastConversation] = this.mockDatabase.conversation.slice(-1);
    const lastConversationId = lastConversation?.id || 0;
    const insert = {
      ...newConversation,
      id: lastConversationId + 1,
    };

    this.mockDatabase.conversation.push(insert);
    return { insertId: insert.id };
  }

  async getConversationById(conversationId: number): Promise<ConversationSchema> {
    const [conversationRow] = this.mockDatabase.conversation.filter(conversation => conversation.id === conversationId);

    return conversationRow;
  }

  async getConversationsByUserId(userId: number): Promise<Array<ConversationSchema>> {
    const conversationIds = this.mockDatabase.conversationUser
      .filter(conversationUser => conversationUser.userId === userId)
      .map(conversationUser => conversationUser.conversationId);

    const conversationRows = this.mockDatabase.conversation.filter(conversation =>
      conversationIds.includes(conversation.id),
    );

    return conversationRows;
  }

  async updateConversation(
    fieldsToUpdate: Partial<Omit<ConversationSchema, 'id'>>,
    conversationId: number,
  ): Promise<void> {
    const conversation = await this.getConversationById(conversationId);
    conversation.name = fieldsToUpdate.name || conversation.name;
  }

  async deleteConversation(conversationId: number): Promise<void> {
    for (let i = 0; i < this.mockDatabase.conversation.length; i += 1) {
      const conversation = this.mockDatabase.conversation[i];
      if (conversation.id === conversationId) {
        this.mockDatabase.conversation.splice(i, 1);
        break;
      }
    }
  }

  // ConversationUser queries
  async insertConversationUser(conversationUser: Omit<ConversationUserSchema, 'id'>): Promise<{ insertId: number }> {
    const [lastConversationUser] = this.mockDatabase.conversationUser.slice(-1);
    const lastConversationUserId = lastConversationUser?.id || 0;
    const insert = {
      id: lastConversationUserId + 1,
      conversationId: conversationUser.conversationId,
      userId: conversationUser.userId,
    };

    this.mockDatabase.conversationUser.push(insert);
    return { insertId: insert.id };
  }

  async deleteConversationUser(conversationId: number, userId: number): Promise<void> {
    for (let i = 0; i < this.mockDatabase.conversationUser.length; i += 1) {
      const conversationUser = this.mockDatabase.conversationUser[i];
      if (conversationUser.conversationId === conversationId && conversationUser.userId === userId) {
        this.mockDatabase.conversationUser.splice(i, 1);
        break;
      }
    }
  }

  async deleteConversationUsersByUserId(userId: number): Promise<void> {
    for (let i = 0; i < this.mockDatabase.conversationUser.length; i += 1) {
      const conversationUser = this.mockDatabase.conversationUser[i];
      if (conversationUser.userId === userId) {
        this.mockDatabase.conversationUser.splice(i, 1);
        i -= 1;
      }
    }
  }

  // Message queries
  async insertMessage(newMessage: Omit<MessageSchema, 'id'>): Promise<{ insertId: number }> {
    const [lastMessage] = this.mockDatabase.message.slice(-1);
    const lastMessageId = lastMessage?.id || 0;
    const insert = {
      ...newMessage,
      id: lastMessageId + 1,
    };

    this.mockDatabase.message.push(insert);
    return { insertId: insert.id };
  }

  async getMessageById(messageId: number): Promise<MessageSchema> {
    const [messageRow] = this.mockDatabase.message.filter(m => m.id === messageId);
    return messageRow;
  }

  async getMessagesByConversationId(conversationId: number): Promise<Array<MessageSchema>> {
    const messageRows = this.mockDatabase.message.filter(m => m.conversationId === conversationId);
    return messageRows;
  }
}

export default MySQLDatabaseAccessMock;
