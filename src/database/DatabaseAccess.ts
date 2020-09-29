interface DatabaseAccess {
  insertUser(newUser: unknown): Promise<unknown>;
  getUserById(userId: number): Promise<unknown>;
  getUserByUserName(userName: string): Promise<unknown>;
  getUsersByConversationId(conversationId: number): Promise<Array<unknown>>;
  updateUser(fieldsToUpdate: unknown, userId: number): Promise<unknown>;
  deleteUser(userId: number): Promise<unknown>;
  insertConversation(newConversation: unknown): Promise<unknown>;
  getConversationById(conversationId: number): Promise<unknown>;
  getConversationsByUserId(userId: unknown): Promise<Array<unknown>>;
  updateConversation(fieldsToUpdate: unknown, conversationId: number): Promise<unknown>;
  deleteConversation(conversationId: number): Promise<unknown>;
  insertConversationUser(conversationId: number, userId: number): Promise<unknown>;
  deleteConversationUser(conversationId: number, userId: number): Promise<unknown>;
  deleteConversationUsersByUserId(userId: number): Promise<unknown>;
  insertMessage(newMessage: unknown, conversationId: number): Promise<unknown>;
  getMessagesByConversationId(conversationId: number): Promise<unknown>;
}

export default DatabaseAccess;
