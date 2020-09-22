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

  private constructor() {
    // Instantiation is restricted to static methods
  }

  static constants = {
    USER_DOES_NOT_EXIST: 'User does not exist',
    ERROR_FINDING_USER: 'Error finding user',
    ERROR_FINDING_USERS: 'Error finding users',
    ERROR_CREATING_USER: 'Error creating user',
    ERROR_UPDATING_USER: 'Error updating user',
    ERROR_DELETING_USER: 'Error deleting user',
    ERROR_FINDING_USER_CONVOS: 'Error finding user conversations',
  };

  static mapTableRowToInstance(tableRow: UserSchema): User {
    if (!tableRow) {
      return null;
    }

    const user = new User();
    user.id = tableRow?.id;
    user.userName = tableRow?.userName?.toString();
    user.password = tableRow?.password?.toString();
    user.firstName = tableRow?.firstName?.toString();
    user.lastName = tableRow?.lastName?.toString();

    return user;
  }

  static async create(newUser: {
    userName: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    // TO DO - hash/salt password
    try {
      const { insertId } = await mySQLDatabaseAccess.createUser(newUser);
      const user = this.mapTableRowToInstance({ id: insertId, ...newUser });

      return user;
    } catch (error) {
      return Promise.reject(User.constants.ERROR_CREATING_USER);
    }
  }

  static async findById(userId: number): Promise<User> {
    try {
      const tableRow = await mySQLDatabaseAccess.getUserById(userId);
      const user = this.mapTableRowToInstance(tableRow);

      return user;
    } catch (error) {
      return Promise.reject(new Error(User.constants.ERROR_FINDING_USER));
    }
  }

  static async findByUserName(userName: string): Promise<User> {
    try {
      const tableRow = await mySQLDatabaseAccess.getUserByUserName(userName);
      const user = this.mapTableRowToInstance(tableRow);

      return user;
    } catch (error) {
      console.error(error);
      return Promise.reject(new Error(User.constants.ERROR_FINDING_USER));
    }
  }

  static async findByConversationId(conversationId: number): Promise<Array<User>> {
    try {
      const tableRows = await mySQLDatabaseAccess.getUsersByConversationId(conversationId);
      const users = tableRows.map(this.mapTableRowToInstance);

      return users;
    } catch (error) {
      return Promise.reject(new Error(User.constants.ERROR_FINDING_USERS));
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
    // TO DO - hash passwordToValidate and compare against hashed/salted password in DB
    return passwordToValidate === this.password;
  }

  async update(fieldsToUpdate: Partial<Omit<UserSchema, 'id' | 'userName'>>): Promise<User> {
    if (!this.id) {
      return Promise.reject(new Error(User.constants.USER_DOES_NOT_EXIST));
    }

    try {
      await mySQLDatabaseAccess.updateUser(fieldsToUpdate, this.id);
      this.password = fieldsToUpdate.password || this.password;
      this.firstName = fieldsToUpdate.firstName || this.firstName;
      this.lastName = fieldsToUpdate.lastName || this.lastName;

      return this;
    } catch (err) {
      return Promise.reject(new Error(User.constants.ERROR_UPDATING_USER));
    }
  }

  async delete(): Promise<void> {
    if (!this.id) {
      return Promise.reject(new Error(User.constants.USER_DOES_NOT_EXIST));
    }

    try {
      await mySQLDatabaseAccess.deleteUser(this.id);

      this.id = null;
      this.firstName = null;
      this.lastName = null;
      this.password = null;
    } catch (error) {
      return Promise.reject(new Error(User.constants.ERROR_DELETING_USER));
    }
  }

  async getConversations(): Promise<Array<Conversation>> {
    if (!this.id) {
      return Promise.reject(new Error(User.constants.USER_DOES_NOT_EXIST));
    }

    try {
      this.conversations = await Conversation.findByUserId(this.id);

      return this.conversations;
    } catch (error) {
      return Promise.reject(new Error(User.constants.ERROR_FINDING_USER_CONVOS));
    }
  }
}

export default User;
