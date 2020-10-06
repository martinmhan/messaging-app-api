import request from 'supertest';
import express from 'express';
import * as uuid from 'uuid';

import User from '../src/models/User';
import Conversation from '../src/models/Conversation';

export interface UserInfo {
  userName: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  id: number;
}

export const createTestUser = async (): Promise<UserInfo> => {
  const userConfig = {
    userName: uuid.v4(),
    password: uuid.v4(),
    firstName: uuid.v4(),
    lastName: uuid.v4(),
    email: uuid.v4(),
  };
  const user = await User.create(userConfig);

  return { ...userConfig, id: user.getId() };
};

export const createTestConversation = async (): Promise<Conversation> => {
  const conversationConfig = {
    name: uuid.v4(),
  };
  const conversation = await Conversation.create(conversationConfig);

  return conversation;
};

export const getJsonWebToken = async (app: express.Express, userName: string, password: string): Promise<string> => {
  const userNamePassword = `${userName}:${password}`;
  const userNamePasswordEncoded = Buffer.from(userNamePassword).toString('base64');
  const authorizationHeader = `Basic ${userNamePasswordEncoded}`;

  const loginResponse = await request(app)
    .post('/api/user/login')
    .set('Authorization', authorizationHeader);
  const { jsonWebToken } = loginResponse.body?.data;

  return jsonWebToken;
};
