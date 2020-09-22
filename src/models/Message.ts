class Message {
  id: number | null = null;
  conversationId: number | null = null;
  userId: number | null = null;
  text: string | null = null;
  createdDate: Date | null = null;

  constructor(id: number) {
    if (id) {
      this.id = id;
    }
  }

  async create(text: string): Promise<Message> {
    return this;
  }

  async get(): Promise<Message> {
    return this;
  }

  async update(): Promise<Message> {
    return this;
  }

  async delete(): Promise<void> {
    return;
  }
}

export default Message;
