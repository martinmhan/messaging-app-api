import { UserSchema, ConversationSchema, MessageSchema } from './schema';

interface DatabaseAccess {
  insertUser(newUser: unknown): Promise<{ insertId: number }>;
  getUserById(userId: number): Promise<UserSchema>;
  getUserByUserName(userName: string): Promise<UserSchema>;
  getUsersByConversationId(conversationId: number): Promise<Array<UserSchema>>;
  updateUser(fieldsToUpdate: unknown, userId: number): Promise<void>;
  deleteUser(userId: number): Promise<void>;
  insertConversation(newConversation: unknown): Promise<{ insertId: number }>;
  getConversationById(conversationId: number): Promise<ConversationSchema>;
  getConversationsByUserId(userId: number): Promise<Array<ConversationSchema>>;
  updateConversation(fieldsToUpdate: unknown, conversationId: number): Promise<void>;
  deleteConversation(conversationId: number): Promise<void>;
  insertConversationUser(conversationId: number, userId: number): Promise<{ insertId: number }>;
  deleteConversationUser(conversationId: number, userId: number): Promise<void>;
  deleteConversationUsersByUserId(userId: number): Promise<void>;
  insertMessage(newMessage: unknown, conversationId: number): Promise<{ insertId: number }>;
  getMessageById(messageId: number): Promise<MessageSchema>;
  getMessagesByConversationId(conversationId: number): Promise<Array<MessageSchema>>;
}

export default DatabaseAccess;
