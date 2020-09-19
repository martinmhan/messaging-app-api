import User from './user';
import Message from './message';

class Conversation {
  id: number;
  name: string;
  users: Array<User>;
  messages: Array<Message>;

  constructor(id: number) {
    if (id) {
      this.id = id;
      this.get();
    }
  }

  async create(): Promise<Conversation> {
    return this;
  }

  async get(): Promise<Conversation> {
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