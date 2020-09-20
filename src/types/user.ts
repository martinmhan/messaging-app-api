import runQuery from '../database/runQuery';
import Conversation from './conversation';

class User {
  id: number | null = null;
  userName: string | null = null;
  password: string | null = null;
  firstName: string | null = null;
  lastName: string | null = null;
  conversations: Array<Conversation> | null = null;

  constructor(id?: number) {
    if (id !== undefined) {
      this.id = id;
    }
  }

  static async find(userName: string): Promise<User> {
    if (!userName) {
      return null;
    }

    try {
      const query = 'SELECT * FROM user WHERE user_name = ?';

      const [user] = await runQuery(query, [userName]);
      if (!user) {
        return null;
      }

      return new User(user.id).get();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async create(newUser: { userName: string; password: string; firstName: string; lastName: string }): Promise<User> {
    if (this.id !== null) {
      return Promise.reject(new Error('User already exists for this instance'));
    }

    const query = 'INSERT INTO user (user_name, password, first_name, last_name) VALUES (?, ?, ?, ?)';

    try {
      const insertResult = await runQuery(query, [
        newUser.userName,
        newUser.password,
        newUser.firstName,
        newUser.lastName,
      ]);

      this.id = insertResult.id;
      this.userName = newUser.userName;
      this.password = newUser.password;
      this.firstName = newUser.firstName;
      this.lastName = newUser.lastName;

      return this;
    } catch (err) {
      return Promise.reject('Error creating user');
    }
  }

  async get(): Promise<User> {
    if (!this.id) {
      return Promise.reject(new Error('User does not exist'));
    }

    try {
      const query = 'SELECT * FROM user WHERE id = ?';
      const [user] = await runQuery(query, [this.id]);

      if (!user) {
        return Promise.reject(new Error(`User does not exist for id ${this.id}`));
      }

      this.userName = user?.user_name?.toString();
      this.password = user?.password?.toString();
      this.firstName = user?.first_name?.toString();
      this.lastName = user?.last_name?.toString();

      return this;
    } catch (err) {
      return Promise.reject(new Error('Error finding user'));
    }
  }

  async update(updateFields: { password?: string; firstName?: string; lastName?: string }): Promise<User> {
    if (!this.id) {
      return Promise.reject(new Error('User does not exist'));
    }

    try {
      const query = 'UPDATE user SET ? WHERE id = ?';
      await runQuery(query, [updateFields, this.id]);
    } catch (err) {
      return Promise.reject(new Error('Error updating user'));
    }

    return this.get();
  }

  async delete(): Promise<void> {
    if (this.id === null) {
      return Promise.reject(new Error('User does not exist'));
    }

    try {
      const query = 'DELETE user WHERE id = ?';
      await runQuery(query, [this.id]);

      this.id = null;
      this.firstName = null;
      this.lastName = null;
      this.password = null;
    } catch (err) {
      console.error('Error deleting user');
    }
  }

  async getConversations(): Promise<Array<Conversation>> {
    if (this.id === null) {
      return [];
    }

    const conversations = await Conversation.find();
    this.conversations = conversations;

    return conversations;
  }
}

export default User;
