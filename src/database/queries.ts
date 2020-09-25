// user queries
const insertUser = 'INSERT INTO user SET ?';
const getUserById = 'SELECT * FROM user WHERE deletedOn = 0 AND id = ?';
const getUserByUserName = 'SELECT * FROM user WHERE deletedOn = 0 AND userName = ?';
const updateUser = 'UPDATE user SET ? WHERE id = ?';
const deleteUserById = 'UPDATE user SET deletedOn = UNIX_TIMESTAMP() WHERE id = ?';
const getUsersByConversationId = `
  SELECT * FROM user
  WHERE
    deletedOn = 0 AND
    id IN (
      SELECT DISTINCT userId
      FROM conversationUser
      WHERE conversationId = ?
    )
`;

// conversation queries
const insertConversation = 'INSERT INTO conversation SET ?';
const getConversationById = 'SELECT * FROM conversation WHERE isDeleted = 0 AND id = ?';
const updateConversation = 'UPDATE conversation SET ? WHERE id = ?';
const deleteConversation = 'UPDATE conversation SET isDeleted = 1 WHERE id = ?';
const getConversationsByUserId = `
  SELECT * FROM conversation
  WHERE id IN (
    SELECT DISTINCT conversation_id
    WHERE user_id = ?
  )
`;

// conversationUser queries
const insertConversationUser = 'INSERT INTO conversationUser SET ?';
const deleteConversationUser = 'DELETE FROM conversationUser WHERE conversationId = ? AND userId = ?';
const deleteConversationUsersByUserId = 'DELETE FROM conversationUser WHERE userId = ?';

// message queries
const insertMessage = 'INSERT INTO message SET ?';
const getMessagesByConversationId = 'SELECT * FROM message WHERE conversationId = ?';

export default {
  insertUser,
  getUserById,
  getUserByUserName,
  getUsersByConversationId,
  deleteUserById,
  updateUser,
  insertConversation,
  getConversationById,
  getConversationsByUserId,
  updateConversation,
  deleteConversation,
  insertConversationUser,
  deleteConversationUser,
  deleteConversationUsersByUserId,
  insertMessage,
  getMessagesByConversationId,
};
