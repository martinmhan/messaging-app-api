import MySQLDatabaseAccess from '../database/mySQLDatabaseAccess';
import { UserSchema } from '../database/schema';
import { encrypt, decrypt, generateRandomString, hashAndSaltPassword } from '../utils/encryption';
import Conversation from './Conversation';

const mySQLDatabaseAccess = new MySQLDatabaseAccess();

class User {
  private id: number | null = null;
  private userName: string | null = null;
  private firstName: string | null = null;
  private lastName: string | null = null;
  private email: string | null = null;
  private passwordHash: string | null = null;
  private passwordSalt: string | null = null;
  private conversations: Array<Conversation> = [];

  private constructor() {
    // Instantiation is restricted to static methods
  }

  static constants = {
    USER_DOES_NOT_EXIST: 'User does not exist',
  };

  static mapDBRowToInstance(databaseRow: UserSchema): User {
    if (!databaseRow) {
      return null;
    }

    const user = new User();
    user.id = databaseRow?.id;
    user.userName = decrypt(databaseRow?.userName?.toString());
    user.firstName = decrypt(databaseRow?.firstName?.toString());
    user.lastName = decrypt(databaseRow?.lastName?.toString());
    user.email = decrypt(databaseRow?.email?.toString());
    user.passwordHash = databaseRow?.passwordHash?.toString();
    user.passwordSalt = databaseRow?.passwordSalt?.toString();

    return user;
  }

  static async create(
    newUser: Omit<UserSchema, 'id' | 'passwordHash' | 'passwordSalt'> & { password: string },
  ): Promise<User> {
    try {
      const passwordSalt = generateRandomString(16);
      const passwordHash = hashAndSaltPassword(newUser.password, passwordSalt);
      const insert = {
        userName: encrypt(newUser.userName),
        firstName: encrypt(newUser.firstName),
        lastName: encrypt(newUser.lastName),
        email: encrypt(newUser.email),
        passwordHash,
        passwordSalt,
      };

      const { insertId } = await mySQLDatabaseAccess.insertUser(insert);
      const user = this.mapDBRowToInstance({ id: insertId, ...insert });

      return user;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async findById(userId: number): Promise<User> {
    try {
      const databaseRow = await mySQLDatabaseAccess.getUserById(userId);
      const user = this.mapDBRowToInstance(databaseRow);

      return user;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async findByUserName(userName: string): Promise<User> {
    try {
      const databaseRow = await mySQLDatabaseAccess.getUserByUserName(encrypt(userName));
      const user = this.mapDBRowToInstance(databaseRow);

      return user;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async findByConversationId(conversationId: number): Promise<Array<User>> {
    try {
      const databaseRows = await mySQLDatabaseAccess.getUsersByConversationId(conversationId);
      const users = databaseRows.map(this.mapDBRowToInstance);

      return users;
    } catch (error) {
      return Promise.reject(error);
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

  getEmail(): string {
    return this.email;
  }

  truncate(): { id: number; userName: string; firstName: string; lastName: string; email: string } {
    return {
      id: this.id,
      userName: this.userName,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
    };
  }

  validatePassword(passwordAttempt: string): boolean {
    console.log('original validatePassword');
    const passwordAttemptHash = hashAndSaltPassword(passwordAttempt, this.passwordSalt);
    return passwordAttemptHash === this.passwordHash;
  }

  async update(fieldsToUpdate: { firstName?: string; lastName?: string }): Promise<User> {
    if (!this.id) {
      return Promise.reject(User.constants.USER_DOES_NOT_EXIST);
    }

    try {
      const fieldsToUpdateEncrypted: { firstName?: string; lastName?: string } = {};
      if (fieldsToUpdate.firstName) {
        fieldsToUpdateEncrypted.firstName = encrypt(fieldsToUpdate.firstName);
      }

      if (fieldsToUpdate.lastName) {
        fieldsToUpdateEncrypted.lastName = encrypt(fieldsToUpdate.lastName);
      }

      await mySQLDatabaseAccess.updateUser(fieldsToUpdateEncrypted, this.id);
      this.firstName = fieldsToUpdate.firstName || this.firstName;
      this.lastName = fieldsToUpdate.lastName || this.lastName;

      return this;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    if (!this.id) {
      return Promise.reject(User.constants.USER_DOES_NOT_EXIST);
    }

    try {
      const newPasswordHash = hashAndSaltPassword(newPassword, this.passwordSalt);
      await mySQLDatabaseAccess.updateUser({ passwordHash: newPasswordHash }, this.id);
      this.passwordHash = newPasswordHash;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async delete(): Promise<void> {
    if (!this.id) {
      return Promise.reject(User.constants.USER_DOES_NOT_EXIST);
    }

    try {
      await Promise.all([
        mySQLDatabaseAccess.deleteUser(this.id),
        mySQLDatabaseAccess.deleteConversationUsersByUserId(this.id),
      ]);

      this.id = null;
      this.firstName = null;
      this.lastName = null;
      this.passwordHash = null;
      this.passwordSalt = null;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getConversations(): Promise<Array<Conversation>> {
    if (!this.id) {
      return Promise.reject(User.constants.USER_DOES_NOT_EXIST);
    }

    try {
      this.conversations = await Conversation.findByUserId(this.id);

      return this.conversations;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

export default User;
