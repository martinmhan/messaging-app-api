import DatabaseAccess from '../types/DatabaseAccess';
import MySQLDatabaseAccess from '../database/MySQLDatabaseAccess';
import { UserSchema } from '../types/schema';
import { ErrorMessage } from '../types/types';
import { encrypt, decrypt, generateRandomString, hashAndSaltPassword } from './utils/encryption';
import Conversation from './Conversation';

class User {
  private static databaseAccess: DatabaseAccess = MySQLDatabaseAccess.getInstance();

  private static dataMapper(databaseRow: UserSchema): User {
    const user = new User();
    user.id = databaseRow.id;
    user.userName = decrypt(databaseRow.userName.toString());
    user.firstName = decrypt(databaseRow.firstName.toString());
    user.lastName = decrypt(databaseRow.lastName.toString());
    user.email = decrypt(databaseRow.email.toString());
    user.passwordHash = databaseRow.passwordHash.toString();
    user.passwordSalt = databaseRow.passwordSalt.toString();

    return user;
  }

  static async create(
    userConfig: Omit<UserSchema, 'id' | 'passwordHash' | 'passwordSalt'> & { password: string },
  ): Promise<User> {
    try {
      const passwordSalt = generateRandomString(16);
      const passwordHash = hashAndSaltPassword(userConfig.password, passwordSalt);
      const insert = {
        userName: encrypt(userConfig.userName),
        firstName: encrypt(userConfig.firstName),
        lastName: encrypt(userConfig.lastName),
        email: encrypt(userConfig.email),
        passwordHash: Buffer.from(passwordHash),
        passwordSalt: Buffer.from(passwordSalt),
      };

      const { insertId } = await this.databaseAccess.insertUser(insert);
      const user = this.dataMapper({ id: insertId, ...insert });

      return user;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async findById(userId: number): Promise<User | null> {
    try {
      const databaseRow = await this.databaseAccess.getUserById(userId);
      if (!databaseRow) {
        return null;
      }

      const user = this.dataMapper(databaseRow);
      return user;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async findByUserName(userName: string): Promise<User | null> {
    try {
      const databaseRow = await this.databaseAccess.getUserByUserName(encrypt(userName));
      if (!databaseRow) {
        return null;
      }

      const user = this.dataMapper(databaseRow);

      return user;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async findByConversationId(conversationId: number): Promise<User[]> {
    try {
      const databaseRows = await this.databaseAccess.getUsersByConversationId(conversationId);
      const users = databaseRows.map(this.dataMapper);

      return users;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private id: number | null;
  private userName: string;
  private firstName: string;
  private lastName: string;
  private email: string;
  private passwordHash: string;
  private passwordSalt: string;
  private conversations: Conversation[] | null = null;

  private constructor() {
    // Instantiation is restricted to static methods
  }

  getId = (): number => {
    if (!this.id) {
      throw new Error(ErrorMessage.USER_DOES_NOT_EXIST);
    }

    return this.id;
  };

  getUserName = (): string => {
    if (!this.id) {
      throw new Error(ErrorMessage.USER_DOES_NOT_EXIST);
    }

    return this.userName;
  };

  getFirstName = (): string => {
    if (!this.id) {
      throw new Error(ErrorMessage.USER_DOES_NOT_EXIST);
    }

    return this.firstName;
  };

  getLastName = (): string => {
    if (!this.id) {
      throw new Error(ErrorMessage.USER_DOES_NOT_EXIST);
    }

    return this.lastName;
  };

  getEmail = (): string => {
    if (!this.id) {
      throw new Error(ErrorMessage.USER_DOES_NOT_EXIST);
    }

    return this.email;
  };

  truncate = (): { id: number; userName: string; firstName: string; lastName: string; email: string } => {
    if (!this.id) {
      throw new Error(ErrorMessage.USER_DOES_NOT_EXIST);
    }

    return {
      id: this.id,
      userName: this.userName,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
    };
  };

  validatePassword = (passwordAttempt: string): boolean => {
    if (!this.id) {
      throw new Error(ErrorMessage.USER_DOES_NOT_EXIST);
    }

    if (!this.passwordSalt) {
      return false;
    }

    const passwordAttemptHash = hashAndSaltPassword(passwordAttempt, this.passwordSalt);
    return passwordAttemptHash === this.passwordHash;
  };

  update = async (fieldsToUpdate: { firstName?: string; lastName?: string; email?: string }): Promise<User> => {
    if (!this.id) {
      return Promise.reject(ErrorMessage.USER_DOES_NOT_EXIST);
    }

    try {
      const fieldsToUpdateEncrypted: { firstName?: string; lastName?: string; email?: string } = {};
      if (fieldsToUpdate.firstName) {
        fieldsToUpdateEncrypted.firstName = encrypt(fieldsToUpdate.firstName);
      }

      if (fieldsToUpdate.lastName) {
        fieldsToUpdateEncrypted.lastName = encrypt(fieldsToUpdate.lastName);
      }

      if (fieldsToUpdate.email) {
        fieldsToUpdateEncrypted.email = encrypt(fieldsToUpdate.email);
      }

      await User.databaseAccess.updateUser(fieldsToUpdateEncrypted, this.id);
      this.firstName = fieldsToUpdate.firstName || this.firstName;
      this.lastName = fieldsToUpdate.lastName || this.lastName;
      this.email = fieldsToUpdate.email || this.email;

      return this;
    } catch (error) {
      return Promise.reject(error);
    }
  };

  updatePassword = async (newPassword: string): Promise<void> => {
    if (!this.id || !this.passwordSalt) {
      return Promise.reject(ErrorMessage.USER_DOES_NOT_EXIST);
    }

    try {
      const newPasswordHash = hashAndSaltPassword(newPassword, this.passwordSalt);
      await User.databaseAccess.updateUser({ passwordHash: newPasswordHash }, this.id);
      this.passwordHash = newPasswordHash;
    } catch (error) {
      return Promise.reject(error);
    }
  };

  delete = async (): Promise<void> => {
    if (!this.id) {
      return Promise.reject(ErrorMessage.USER_DOES_NOT_EXIST);
    }

    try {
      await Promise.all([
        User.databaseAccess.deleteUser(this.id),
        User.databaseAccess.deleteConversationUsersByUserId(this.id),
      ]);

      this.id = null;
    } catch (error) {
      return Promise.reject(error);
    }
  };

  getConversations = async (): Promise<Conversation[]> => {
    if (!this.id) {
      return Promise.reject(ErrorMessage.USER_DOES_NOT_EXIST);
    }

    try {
      this.conversations = await Conversation.findByUserId(this.id);

      return this.conversations;
    } catch (error) {
      return Promise.reject(error);
    }
  };
}

export default User;
