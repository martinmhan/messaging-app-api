import DatabaseAccess from '../DatabaseAccess';
import { UserSchema, ConversationSchema, MessageSchema } from '../schema';

const host: string = process.env.DB_HOST;
const user: string = process.env.DB_USER;
const password: string = process.env.DB_PASS;
const database: string = process.env.DB_NAME;

if (!host || !user || !password || !database) {
  throw new Error('Missing required environment variable(s). Please edit .env file');
}

class MySQLDatabaseAccessMock implements DatabaseAccess {
  static connect(): void {
    console.log('Mock Database connected');
  }

  static disconnect(): void {
    console.log('Mock database disconnected');
  }

  static mockDatabase: {
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

  // User queries
  async insertUser(newUser: Omit<UserSchema, 'id'>): Promise<{ insertId: number }> {
    const [lastUser] = MySQLDatabaseAccessMock.mockDatabase.user.slice(-1);
    const lastUserId = lastUser?.id || 1;
    const insert = {
      ...newUser,
      id: lastUserId + 1,
    };

    MySQLDatabaseAccessMock.mockDatabase.user.push(insert);
    return { insertId: insert.id };
  }

  async getUserById(userId: number): Promise<UserSchema> {
    const [userRow] = MySQLDatabaseAccessMock.mockDatabase.user.filter(user => user.id === userId);
    return userRow;
  }

  async getUserByUserName(userName: string): Promise<UserSchema> {
    const [userRow] = MySQLDatabaseAccessMock.mockDatabase.user.filter(user => user.userName === userName);
    return userRow;
  }

  async getUsersByConversationId(conversationId: number): Promise<Array<UserSchema>> {
    const userIds = MySQLDatabaseAccessMock.mockDatabase.conversationUser
      .filter(conversationUser => conversationUser.conversationId === conversationId)
      .map(conversationUser => conversationUser.userId);

    const userRows = MySQLDatabaseAccessMock.mockDatabase.user.filter(user => userIds.includes(user.id));
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
    for (let i = 0; i < MySQLDatabaseAccessMock.mockDatabase.user.length; i += 1) {
      const user = MySQLDatabaseAccessMock.mockDatabase.user[i];
      if (user.id === userId) {
        MySQLDatabaseAccessMock.mockDatabase.user.splice(i, 1);
        break;
      }
    }
  }

  // Conversation queries
  async insertConversation(newConversation: Omit<ConversationSchema, 'id'>): Promise<{ insertId: number }> {
    const [lastConversation] = MySQLDatabaseAccessMock.mockDatabase.conversation.slice(-1);
    const lastConversationId = lastConversation?.id || 1;
    const insert = {
      ...newConversation,
      id: lastConversationId + 1,
    };

    MySQLDatabaseAccessMock.mockDatabase.conversation.push(insert);
    return { insertId: insert.id };
  }

  async getConversationById(conversationId: number): Promise<ConversationSchema> {
    const [conversationRow] = MySQLDatabaseAccessMock.mockDatabase.conversation.filter(
      conversation => conversation.id === conversationId,
    );

    return conversationRow;
  }

  async getConversationsByUserId(userId: number): Promise<Array<ConversationSchema>> {
    const conversationIds = MySQLDatabaseAccessMock.mockDatabase.conversationUser
      .filter(conversationUser => conversationUser.userId === userId)
      .map(conversationUser => conversationUser.conversationId);

    const conversationRows = MySQLDatabaseAccessMock.mockDatabase.conversation.filter(conversation =>
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
    for (let i = 0; i < MySQLDatabaseAccessMock.mockDatabase.conversation.length; i += 1) {
      const conversation = MySQLDatabaseAccessMock.mockDatabase.conversation[i];
      if (conversation.id === conversationId) {
        MySQLDatabaseAccessMock.mockDatabase.conversation.splice(i, 1);
        break;
      }
    }
  }

  // ConversationUser queries
  async insertConversationUser(conversationId: number, userId: number): Promise<{ insertId: number }> {
    const [lastConversationUser] = MySQLDatabaseAccessMock.mockDatabase.conversationUser.slice(-1);
    const lastConversationUserId = lastConversationUser?.id || 1;
    const insert = {
      id: lastConversationUserId + 1,
      userId,
      conversationId,
    };

    MySQLDatabaseAccessMock.mockDatabase.conversationUser.push(insert);
    return { insertId: insert.id };
  }

  async deleteConversationUser(conversationId: number, userId: number): Promise<void> {
    for (let i = 0; i < MySQLDatabaseAccessMock.mockDatabase.conversationUser.length; i += 1) {
      const conversationUser = MySQLDatabaseAccessMock.mockDatabase.conversationUser[i];
      if (conversationUser.conversationId === conversationId && conversationUser.userId === userId) {
        MySQLDatabaseAccessMock.mockDatabase.conversationUser.splice(i, 1);
        break;
      }
    }
  }

  async deleteConversationUsersByUserId(userId: number): Promise<void> {
    for (let i = 0; i < MySQLDatabaseAccessMock.mockDatabase.conversationUser.length; i += 1) {
      const conversationUser = MySQLDatabaseAccessMock.mockDatabase.conversationUser[i];
      if (conversationUser.userId === userId) {
        MySQLDatabaseAccessMock.mockDatabase.conversationUser.splice(i, 1);
        i -= 1;
      }
    }
  }

  // Message queries
  async insertMessage(newMessage: Omit<MessageSchema, 'id'>): Promise<{ insertId: number }> {
    const [lastMessage] = MySQLDatabaseAccessMock.mockDatabase.message.slice(-1);
    const lastMessageId = lastMessage?.id || 1;
    const insert = {
      ...newMessage,
      id: lastMessageId + 1,
    };

    MySQLDatabaseAccessMock.mockDatabase.message.push(insert);
    return { insertId: insert.id };
  }

  async getMessagesByConversationId(conversationId: number): Promise<Array<MessageSchema>> {
    const messageRows = MySQLDatabaseAccessMock.mockDatabase.message.filter(m => m.conversationId === conversationId);
    return messageRows;
  }
}

export default MySQLDatabaseAccessMock;
