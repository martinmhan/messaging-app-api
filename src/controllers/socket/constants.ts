export const events = {
  // server to client
  AUTHENTICATED: 'authenticated',
  JOINED_ROOM: 'joinedRoom',
  LEFT_ROOM: 'leftRoom',

  // client to server
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',

  // bi-directional
  NEW_MESSAGE: 'newMessage',
};
