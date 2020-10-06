export interface JSONResponse {
  error: ErrorMessage;
  data: unknown;
  meta: unknown;
}

export enum HTTPMethod {
  POST = 'POST',
  GET = 'GET',
  PATCH = 'PATCH',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export enum StatusCode {
  ok = 200,
  created = 201,
  badRequest = 400,
  unauthorized = 401,
  forbidden = 403,
  notFound = 404,
  internalServerError = 500,
}

export enum ErrorMessage {
  UNAUTHORIZED = 'Unauthorized',
  UNSUCCESSFUL_LOGIN = 'Unsuccessful Login',
  USERNAME_TAKEN = 'Username already taken',
  MISSING_INFO = 'Missing required information',
  INVALID_USER_ID = 'userId is invalid',
  ERROR_CREATING_USER = 'Error creating user',
  ERROR_FINDING_USER = 'Error finding user',
  ERROR_UPDATING_USER = 'Error updating user',
  ERROR_DELETING_USER = 'Error deleting user',
  ERROR_FINDING_USER_CONVOS = 'Error finding user conversations',
  INVALID_CONVO_ID = 'conversationId is invalid',
  CONVO_DOES_NOT_EXIST = 'Conversation does not exist',
  ERROR_CREATING_CONVO = 'Error creating conversation',
  ERROR_FINDING_CONVO = 'Error finding conversation',
  ERROR_UPDATING_CONVO = 'Error updating conversation',
  ERROR_DELETING_CONVO = 'Error deleting conversation',
  ERROR_FINDING_CONVO_MEMBERS = 'Error finding members in this conversation',
  ERROR_FINDING_MESSAGES = 'Error finding messages',
  ERROR_CREATING_MESSAGE = 'Error creating message',
  USER_ALREADY_IN_CONVO = 'User is already part of this conversation',
  USER_NOT_IN_CONVO = 'User is not a part of this conversation',
  ERROR_ADDING_USER_TO_CONVO = 'Error adding user to conversation',
  ERROR_REMOVING_USER_FROM_CONVO = 'Error removing user from conversation',
}
