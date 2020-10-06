import dotenv from 'dotenv';
import * as uuid from 'uuid';

dotenv.config();

import Conversation from '../../src/models/Conversation';
import MySQLDatabaseAccess from '../../src/database/MySQLDatabaseAccess';
import * as utils from '../utils';

jest.mock('../../src/database/MySQLDatabaseAccess.ts'); // comment this line to use the real database

describe('Conversation model', () => {
  const mySQLDatabaseAccess = MySQLDatabaseAccess.getInstance();

  let conversationToCreateId: number;
  let conversationToGet: Conversation;
  let conversationToUpdate: Conversation;

  beforeAll(async () => {
    conversationToGet = await utils.createTestConversation();
    conversationToUpdate = await utils.createTestConversation();
  });

  afterAll(async () => {
    await Promise.all([
      mySQLDatabaseAccess.deleteConversation(conversationToCreateId),
      mySQLDatabaseAccess.deleteConversation(conversationToGet.getId()),
      mySQLDatabaseAccess.deleteConversation(conversationToUpdate.getId()),
    ]);
  });

  it('should create a new conversation', async () => {
    const conversationConfig = { name: uuid.v4() };
    const conversation = await Conversation.create(conversationConfig);
    conversationToCreateId = conversation.getId();
    const conversationRow = await mySQLDatabaseAccess.getConversationById(conversationToCreateId);
    expect(conversationRow).toEqual({
      id: conversationToCreateId,
      name: expect.any(String),
    });
  });

  it('should get an existing conversation by id', async () => {
    const conversation = await Conversation.findById(conversationToGet.getId());
    expect(conversation).toBeInstanceOf(Conversation);
    expect(conversation).toMatchObject({
      id: conversationToGet.getId(),
      name: conversationToGet.getName(),
      users: null,
      messages: null,
    });
  });

  it('should update an existing conversation', async () => {
    const fieldsToUpdate = { name: uuid.v4() };
    const conversation = await Conversation.findById(conversationToUpdate.getId());
    await conversation?.update(fieldsToUpdate);
    expect(conversation?.getName()).toEqual(fieldsToUpdate.name);
  });
});
