import dotenv from 'dotenv';
import * as uuid from 'uuid';

dotenv.config();

import Conversation from '../../src/models/Conversation';
import MySQLDatabaseAccess from '../../src/database/MySQLDatabaseAccess';
import * as utils from '../utils';

jest.mock('../../src/database/MySQLDatabaseAccess.ts'); // Use this line to use a mock DB (NOTE - behavior may differ from real DB)

describe('Conversation model', () => {
  const mySQLDatabaseAccess = MySQLDatabaseAccess.getInstance();

  let testConversation: Conversation;
  let createdConversation: Conversation;

  beforeEach(async () => {
    testConversation = await utils.createTestConversation();
  });

  afterEach(async () => {
    await mySQLDatabaseAccess.deleteConversation(testConversation.getId());
    await mySQLDatabaseAccess.deleteConversation(createdConversation.getId());
  });

  it('should create a new conversation', async () => {
    const conversationConfig = { name: uuid.v4() };
    const conversation = await Conversation.create(conversationConfig);
    createdConversation = conversation;
    const conversationRow = await mySQLDatabaseAccess.getConversationById(createdConversation.getId());
    expect(conversationRow).toMatchObject({
      id: createdConversation.getId(),
      name: expect.any(String),
    });
  });

  it('should return null when finding a nonexistent conversationId', async () => {
    const conversation = await Conversation.findById(-1);
    expect(conversation).toBeNull();
  });

  it('should get an existing conversation by id', async () => {
    const conversation = await Conversation.findById(testConversation.getId());
    expect(conversation).toBeInstanceOf(Conversation);
    expect(conversation).toMatchObject({
      id: testConversation.getId(),
      name: testConversation.getName(),
      users: null,
      messages: null,
    });
  });

  it('should update an existing conversation', async () => {
    const fieldsToUpdate = { name: uuid.v4() };
    const conversation = await Conversation.findById(testConversation.getId());
    await conversation?.update(fieldsToUpdate);
    expect(conversation?.getName()).toEqual(fieldsToUpdate.name);
  });
});
