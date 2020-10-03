export const events = {
  // server to client
  AUTHENTICATED: 'authenticated',
  JOINED_ROOM: 'joinedConversationRoom',
  LEFT_ROOM: 'leftConversationRoom',

  // client to server
  JOIN_ROOM: 'joinConversationRoom',
  LEAVE_ROOM: 'leaveConversationRoom',

  // bi-directional
  NEW_MESSAGE: 'newMessage',
};
