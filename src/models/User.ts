import mySQLDatabaseAccess from '../database/mySQLDatabaseAccess';
import { UserSchema } from '../database/schema';
import Conversation from './Conversation';

class User {
  private id: number | null = null;
  private userName: string | null = null;
  private password: string | null = null;
  private firstName: string | null = null;
  private lastName: string | null = null;
  private conversationIds: Array<number> = [];
  private conversations: Array<Conversation> = [];

  // TO DO: remove password field and add a comparePassword method that checks against password hash

  private constructor() {
    // Instantiation is restricted to static methods
  }

  // handles logic converting a DB row to user instance
  static mapRowItemToUserInstance(userRowItem: UserSchema): User {
    if (!userRowItem) {
      return null;
    }

    const user = new User();
    user.id = userRowItem?.id;
    user.userName = userRowItem?.userName?.toString();
    user.password = userRowItem?.password?.toString();
    user.firstName = userRowItem?.firstName?.toString();
    user.lastName = userRowItem?.lastName?.toString();

    return user;
  }

  static async findByUserId(userId: number): Promise<User> {
    try {
      const userRowItem = await mySQLDatabaseAccess.getUserByUserId(userId);
      const user = this.mapRowItemToUserInstance(userRowItem);

      return user;
    } catch (error) {
      return Promise.reject(new Error('Error finding user by userId'));
    }
  }

  static async findByUserName(userName: string): Promise<User> {
    try {
      const userRowItem = await mySQLDatabaseAccess.getUserByUserName(userName);
      const user = this.mapRowItemToUserInstance(userRowItem);

      return user;
    } catch (error) {
      console.error(error);
      return Promise.reject(new Error('Error finding user by userName'));
    }
  }

  static async findByConversationId(conversationId: number): Promise<Array<User>> {
    try {
      const userRowItems = await mySQLDatabaseAccess.getUsersByConversationId(conversationId);
      const users = userRowItems.map((rowItem: UserSchema) => this.mapRowItemToUserInstance(rowItem));

      return users;
    } catch (error) {
      return Promise.reject(new Error('Error finding users by conversationId'));
    }
  }

  static async create(newUser: {
    userName: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    try {
      const { insertId } = await mySQLDatabaseAccess.createUser(newUser);
      const user = new User();
      user.id = insertId;
      user.userName = newUser.userName;
      user.password = newUser.password;
      user.firstName = newUser.firstName;
      user.lastName = newUser.lastName;

      return user;
    } catch (error) {
      return Promise.reject('Error creating user');
    }
  }

  getId(): number {
    return this.id;
  }

  getUserName(): string {
    return this.userName;
  }

  getFirstName(): string {
    return this.firstName;
  }

  getLastName(): string {
    return this.lastName;
  }

  validatePassword(passwordToValidate: string): boolean {
    return passwordToValidate === this.password;
  }

  async update(fieldsToUpdate: Partial<Omit<UserSchema, 'id' | 'userName'>>): Promise<User> {
    if (!this.id) {
      return Promise.reject(new Error('User does not exist'));
    }

    try {
      await mySQLDatabaseAccess.updateUser(fieldsToUpdate, this.id);

      this.password = fieldsToUpdate.password || this.password;
      this.firstName = fieldsToUpdate.firstName || this.firstName;
      this.lastName = fieldsToUpdate.lastName || this.lastName;

      return this;
    } catch (err) {
      return Promise.reject(new Error('Error updating user'));
    }
  }

  async delete(): Promise<void> {
    try {
      await mySQLDatabaseAccess.deleteUser(this.id);

      this.id = null;
      this.firstName = null;
      this.lastName = null;
      this.password = null;
    } catch (error) {
      return Promise.reject(new Error('Error deleting user'));
    }
  }

  async getConversations(): Promise<Array<Conversation>> {
    if (!this.id) {
      return Promise.reject(new Error('Missing user ID'));
    }

    try {
      const conversations = await Conversation.findByUserId(this.id);
      this.conversations = conversations;

      return conversations;
    } catch (error) {
      return Promise.reject(new Error('Error getting user conversations'));
    }
  }
}

export default User;
