// user queries
const createUser = 'INSERT INTO user SET ?';
const getUserById = 'SELECT * FROM user WHERE isDeleted = 0 AND id = ?';
const getUserByUserName = 'SELECT * FROM user WHERE isDeleted = 0 AND userName = ?';
const updateUser = 'UPDATE user SET ? WHERE id = ?';
const deleteUserById = 'UPDATE user SET isDeleted = 1 WHERE id = ?';
const getUsersByConversationId = `
  SELECT *
  FROM user
  WHERE
    isDeleted = 0 AND
    id IN (
      SELECT DISTINCT userId
      FROM conversationUser
      WHERE
        isDeleted = 0 AND
        conversationId = ?
    )
`;

// conversation queries
const createConversation = 'INSERT INTO conversation SET ?';
const getConversationById = 'SELECT * FROM conversation WHERE isDeleted = 0 AND id = ?';
const updateConversation = 'UPDATE conversation SET ? WHERE id = ?';
const deleteConversation = 'UPDATE conversation SET isDeleted = 1 WHERE id = ?';
const getConversationsByUserId = `
  SELECT *
  FROM conversation
  WHERE id IN (
    SELECT DISTINCT conversation_id
    WHERE user_id = ?
  )
`;

// conversationUser queries
const createConversationUser = 'INSERT INTO conversationUser SET ?';
const deleteConversationUser = 'UPDATE conversationUser SET isDeleted = 1 WHERE conversationId = ? AND userId = ?';

// message queries
const createMessage = 'INSERT INTO message SET ?';
const getMessagesByConversationId = 'SELECT * FROM message WHERE conversationId = ?';

export default {
  createUser,
  getUserById,
  getUserByUserName,
  getUsersByConversationId,
  deleteUserById,
  updateUser,
  createConversation,
  getConversationById,
  getConversationsByUserId,
  updateConversation,
  deleteConversation,
  createConversationUser,
  deleteConversationUser,
  createMessage,
  getMessagesByConversationId,
};
