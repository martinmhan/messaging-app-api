import dotenv from 'dotenv';
import * as uuid from 'uuid';

dotenv.config();

import Conversation from '../../src/models/Conversation';
import MySQLDatabaseAccess from '../../src/database/MySQLDatabaseAccess';

jest.mock('../../src/database/MySQLDatabaseAccess.ts'); // comment this line to use the real database

describe('Conversation model', () => {
  const mySQLDatabaseAccess = MySQLDatabaseAccess.getInstance();

  let conversationToCreateId: number;
  let conversationToGetId: number;
  let conversationToUpdateId: number;
  const conversationToCreate = { name: uuid.v4() };
  const conversationToGet = { name: uuid.v4() };
  const conversationToUpdate = { name: uuid.v4() };

  beforeAll(async () => {
    const [conversation1, conversation2] = await Promise.all([
      Conversation.create(conversationToGet),
      Conversation.create(conversationToUpdate),
    ]);
    conversationToGetId = conversation1.getId();
    conversationToUpdateId = conversation2.getId();
  });

  afterAll(async () => {
    await Promise.all([
      mySQLDatabaseAccess.deleteConversation(conversationToCreateId),
      mySQLDatabaseAccess.deleteConversation(conversationToGetId),
      mySQLDatabaseAccess.deleteConversation(conversationToUpdateId),
    ]);
  });

  it('should create a new conversation', async () => {
    const conversation = await Conversation.create(conversationToCreate);
    conversationToCreateId = conversation.getId();
    const conversationRow = await mySQLDatabaseAccess.getConversationById(conversationToCreateId);
    expect(conversationRow).toMatchObject({
      id: conversationToCreateId,
      name: expect.any(String),
    });
  });

  it('should get an existing conversation by id', async () => {
    const conversation = await Conversation.findById(conversationToGetId);
    expect(conversation).toBeInstanceOf(Conversation);
    expect(conversation).toEqual({
      id: conversationToGetId,
      name: conversationToGet.name,
      users: null,
      messages: null,
    });
  });

  it('should update an existing conversation', async () => {
    const conversation = await Conversation.findById(conversationToUpdateId);
    const fieldsToUpdate = { name: uuid.v4() };
    await conversation.update(fieldsToUpdate);
    expect(conversation.getName()).toEqual(fieldsToUpdate.name);
  });
});
