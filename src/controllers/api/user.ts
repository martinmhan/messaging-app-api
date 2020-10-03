import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import JSONResponse from './utils/JSONResponse';
import { statusCodes, errorMessages } from './utils/constants';
import User from '../../models/User';

const loginUser = async (req: Request, res: Response): Promise<Response> => {
  const authorizationHeader: string = req.headers.authorization;
  if (!authorizationHeader) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.UNSUCCESSFUL_LOGIN));
  }

  const userNamePassword: string = Buffer.from(authorizationHeader?.replace('Basic ', ''), 'base64').toString();
  const [userName, password] = userNamePassword?.split(':');

  const user = await User.findByUserName(userName);
  if (!user || !user?.validatePassword(password)) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.UNSUCCESSFUL_LOGIN));
  }

  const jwtSecretKey = process.env.JWT_KEY;
  const jwtPayload = {
    userName: user.getUserName(),
    userId: user.getId(),
  };
  const jwtOptions = {
    expiresIn: '4 hours',
  };

  const jsonWebToken = jwt.sign(jwtPayload, jwtSecretKey, jwtOptions);
  const userId = user.getId();
  return res.status(statusCodes.success.created).send(new JSONResponse(null, { jsonWebToken, userId }, null));
};

const createUser = async (req: Request, res: Response): Promise<Response> => {
  const { user } = req.body;

  if (!user || !user.userName || !user.password || !user.firstName || !user.lastName || !user.email) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.MISSING_INFO));
  }

  try {
    const existingUser = await User.findByUserName(user.userName);
    if (existingUser) {
      return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.USERNAME_TAKEN));
    }

    const newUser = await User.create(user);
    return res.status(statusCodes.success.created).send(new JSONResponse(null, newUser.truncate()));
  } catch (error) {
    return res.status(statusCodes.server.internalServerError).send(new JSONResponse(errorMessages.ERROR_CREATING_USER));
  }
};

const getUser = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;

  const userIdInt = parseInt(userId);
  if (isNaN(userIdInt)) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.INVALID_USER_ID));
  }

  if (req.user.getId() !== userIdInt) {
    return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.UNAUTHORIZED));
  }

  try {
    return res.status(statusCodes.success.ok).send(new JSONResponse(null, req.user.truncate()));
  } catch (error) {
    return res.status(statusCodes.server.internalServerError).send(new JSONResponse(errorMessages.ERROR_FINDING_USER));
  }
};

const updateUser = async (req: Request, res: Response): Promise<Response> => {
  const { fieldsToUpdate } = req.body;
  const { userId } = req.params;

  const userIdInt = parseInt(userId, 10);
  if (isNaN(userIdInt)) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.INVALID_USER_ID));
  }

  if (req.user.getId() !== userIdInt) {
    return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.UNAUTHORIZED));
  }

  if (!fieldsToUpdate) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.MISSING_INFO));
  }

  try {
    const updatedUser = await req.user.update(fieldsToUpdate);
    return res.status(statusCodes.success.ok).send(new JSONResponse(null, updatedUser.truncate()));
  } catch (error) {
    return res.status(statusCodes.server.internalServerError).send(new JSONResponse(errorMessages.ERROR_UPDATING_USER));
  }
};

const deleteUser = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;

  const userIdInt = parseInt(userId, 10);
  if (isNaN(userIdInt)) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.INVALID_USER_ID));
  }

  if (req.user.getId() !== userIdInt) {
    return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.UNAUTHORIZED));
  }

  try {
    await req.user.delete();
    return res.status(statusCodes.success.ok).send(new JSONResponse(null, 'User deleted successfully'));
  } catch (error) {
    return res.status(statusCodes.server.internalServerError).send(new JSONResponse(errorMessages.ERROR_DELETING_USER));
  }
};

const getConversations = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;

  const userIdInt = parseInt(userId, 10);
  if (req.user.getId() !== userIdInt) {
    return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.UNAUTHORIZED));
  }

  try {
    const conversations = await req.user.getConversations();
    const conversationsTruncated = conversations.map(c => c.truncate());
    return res.status(statusCodes.success.ok).send(new JSONResponse(null, conversationsTruncated));
  } catch (error) {
    return res
      .status(statusCodes.server.internalServerError)
      .send(new JSONResponse(errorMessages.ERROR_FINDING_USER_CONVOS));
  }
};

const router = Router();
router.post('/login', loginUser);
router.post('/', createUser);
router.get('/:userId', getUser);
router.patch('/:userId', updateUser);
router.delete('/:userId', deleteUser);
router.get('/:userId/conversations', getConversations);

export default router;
