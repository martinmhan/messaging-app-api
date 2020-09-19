class Message {
  id: number;
  conversationId: number;
  senderId: number;
  text: string;
  createdDate: Date;

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
};

export default Message;
