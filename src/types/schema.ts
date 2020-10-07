export interface Schema {
  id: number;
}

export interface UserSchema extends Schema {
  id: number;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: Buffer;
  passwordSalt: Buffer;
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

export interface ConversationUserSchema extends Schema {
  id: number;
  conversationId: number;
  userId: number;
}
