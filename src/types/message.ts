class Message {
  id: number | null = null;
  conversationId: number | null = null;
  userId: number | null = null;
  text: string | null = null;
  createdDate: Date | null = null;

  constructor(id: number) {
    this.id = id;

    return this.get();
  }

  create(text: string) {
    return this;
  }

  get() {
    return this;
  }

  update() {
    return this;
  }

  delete(): void {
    return;
  }
}

export default Message;
