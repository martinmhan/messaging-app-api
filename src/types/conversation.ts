import User from './user';
import Message from './message';

class Conversation {
  id: number | null = null;
  name: string | null = null;
  users: Array<User> | null = null;
  messages: Array<Message> | null = null;

  constructor(id?: number) {
    if (id !== undefined) {
      this.id = id;
    }
  }

  static async find(): Promise<Array<Conversation>> {
    return [];
  }

  async create(newConversation: { name: string }): Promise<Conversation> {
    if (this.id) {
      return Promise.reject(new Error('Conversation already exists'));
    }

    return this;
  }

  async get(): Promise<Conversation> {
    if (!this.id) {
      return Promise.reject(new Error('Conversation id is missing'));
    }

    // query convo data
    // set convo data
    return this;
  }

  async update(): Promise<Conversation> {
    return this;
  }

  async delete(): Promise<void> {
    return;
  }

  async getMessages(): Promise<Array<Message>> {
    return this.messages;
  }
}

export default Conversation;
