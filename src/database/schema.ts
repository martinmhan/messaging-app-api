export interface Schema {
  id: number;
}

export interface UserSchema extends Schema {
  id: number;
  userName: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ConversationSchema extends Schema {
  id: number;
  name: string;
}

export interface MessageSchema extends Schema {
  id: number;
  conversationId: number;
  userId: number;
  text: string;
}
