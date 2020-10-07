export enum Query {
  insertUser = 'INSERT INTO user SET ?',
  getUserById = 'SELECT * FROM user WHERE deletedOn = 0 AND id = ?',
  getUserByUserName = 'SELECT * FROM user WHERE deletedOn = 0 AND userName = ?',
  updateUser = 'UPDATE user SET ? WHERE id = ?',
  deleteUserById = 'UPDATE user SET deletedOn = UNIX_TIMESTAMP() WHERE id = ?',
  getUsersByConversationId = `
    SELECT * FROM user
    WHERE
      deletedOn = 0 AND
      id IN (
        SELECT DISTINCT userId
        FROM conversationUser
        WHERE conversationId = ?
      )
  `,

  insertConversation = 'INSERT INTO conversation SET ?',
  getConversationById = 'SELECT * FROM conversation WHERE isDeleted = 0 AND id = ?',
  updateConversation = 'UPDATE conversation SET ? WHERE id = ?',
  deleteConversation = 'UPDATE conversation SET isDeleted = 1 WHERE id = ?',
  getConversationsByUserId = `
    SELECT * FROM conversation
    WHERE id IN (
      SELECT DISTINCT conversationId
      FROM conversationUser
      WHERE userId = ?
    )
  `,

  insertConversationUser = 'INSERT INTO conversationUser SET ?',
  deleteConversationUser = 'DELETE FROM conversationUser WHERE conversationId = ? AND userId = ?',
  deleteConversationUsersByUserId = 'DELETE FROM conversationUser WHERE userId = ?',

  insertMessage = 'INSERT INTO message SET ?',
  getMessageById = 'SELECT * FROM message WHERE id = ?',
  getMessagesByConversationId = 'SELECT * FROM message WHERE conversationId = ?',
}
