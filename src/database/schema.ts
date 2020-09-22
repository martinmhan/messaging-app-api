export interface UserSchema {
  id: number;
  userName: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ConversationSchema {
  id: number;
  name: string;
}

export interface MessageSchema {
  id: number;
  conversationId: number;
  userId: number;
  text: string;
}
