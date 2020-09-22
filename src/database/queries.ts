const createUser = 'INSERT INTO user SET ?';
const getUserById = 'SELECT * FROM user WHERE isDeleted = 0 AND id = ?';
const getUserByUserName = 'SELECT * FROM user WHERE isDeleted = 0 AND userName = ?';
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
const deleteUserById = 'UPDATE user SET isDeleted = 1 WHERE id = ?';
const updateUser = 'UPDATE user SET ? WHERE id = ?';

export default {
  createUser,
  getUserById,
  getUserByUserName,
  getUsersByConversationId,
  deleteUserById,
  updateUser,
};
