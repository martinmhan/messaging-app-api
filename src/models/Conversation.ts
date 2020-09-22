import mySqlDatabase from '../database/mySQLDatabaseAccess';
import User from './User';
import Message from './Message';

class Conversation {
  private id: number | null = null;
  private name: string | null = null;
  private userIds: Array<number> = [];
  private messageIds: Array<number> = [];
  private users: Array<User> = [];
  private messages: Array<Message> = [];

  constructor(id?: number) {
    if (id !== undefined) {
      this.id = id;
    }
  }

  static mapDatabaseRowItemToInstance(
    rowItem: { id: number; name: string },
    conversationInstance?: Conversation,
  ): Conversation {
    const conversation = conversationInstance || new Conversation();
    conversation.id = rowItem?.id;
    conversation.name = rowItem?.name?.toString();

    return conversation;
  }

  static async findByUserId(userId: number): Promise<Array<Conversation>> {
    try {
      const query = `
        SELECT *
        FROM conversation
        WHERE id IN (
          SELECT DISTINCT conversation_id
          WHERE user_id = ?
        )
      `;

      const rowItems = await mySqlDatabase.runQuery(query, [userId]);
      const conversations = rowItems.map((rowItem: { id: number; name: string }) =>
        this.mapDatabaseRowItemToInstance(rowItem),
      );

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

  async create(conversationName: string, userIds: Array<number>): Promise<Conversation> {
    if (this.id) {
      return Promise.reject(new Error('Conversation id already provided. Use .get() to retrieve this conversation'));
    }

    try {
      const query = 'INSERT INTO conversation (name) VALUES (?)';
      const conversationInsertResult = await mySqlDatabase.runQuery(query, [conversationName]);

      this.id = conversationInsertResult.insertId;
      this.name = conversationName;

      return this;
    } catch (error) {
      return Promise.reject(new Error('Error creating conversation'));
    }
  }

  async get(): Promise<Conversation> {
    if (!this.id) {
      return Promise.reject(new Error('Conversation id is missing'));
    }

    const query = 'SELECT * FROM conversation WHERE id = ?';
    const [rowItem] = await mySqlDatabase.runQuery(query, [this.id]);

    return Conversation.mapDatabaseRowItemToInstance(rowItem, this);
  }

  async update(): Promise<Conversation> {
    return this;
  }

  async delete(): Promise<void> {
    return;
  }

  async addUsers(userIds: Array<number>): Promise<void> {
    // insert into conversation_users table
    return;
  }

  async removeUsers(userIds: Array<number>): Promise<void> {
    return;
  }
}

export default Conversation;
