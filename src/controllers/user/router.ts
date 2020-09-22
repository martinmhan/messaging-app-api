import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import User from '../../models/User';
import JSONResponse from '../JSONResponse';
import { statusCodes, errorMessages } from '../constants';

const loginUser = async (req: Request, res: Response): Promise<Response> => {
  const authorizationHeader: string = req.header('Authorization');
  const userNamePassword: string = Buffer.from(authorizationHeader?.replace('Basic ', ''), 'base64').toString();
  const [userName, password] = userNamePassword?.split(':');

  const user = await User.findByUserName(userName);

  if (!user || !user?.validatePassword(password)) {
    return res.status(statusCodes.clientError.badRequest).send(errorMessages.UNSUCCESSFUL_LOGIN);
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

  return res.status(statusCodes.success.created).send(new JSONResponse(null, { jsonWebToken }, null));
};

const createUser = async (req: Request, res: Response): Promise<Response> => {
  const { user } = req.body;

  if (!user || !user.userName || !user.password || !user.firstName || !user.lastName) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse('Missing user information'));
  }

  const existingUser = await User.findByUserName(user.userName);
  if (existingUser) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse('Username already taken'));
  }

  try {
    const newUser = await User.create(user);
    return res.status(statusCodes.success.created).send(new JSONResponse(null, { newUser }));
  } catch (error) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse('Error creating user'));
  }
};

const getUser = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;

  const userIdInt = parseInt(userId);
  if (isNaN(userIdInt)) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse('userId must be an integer'));
  }

  if (req.user.getId() !== userIdInt) {
    return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.UNAUTHORIZED));
  }

  try {
    return res.status(statusCodes.success.ok).send(new JSONResponse(null, { user: req.user }));
  } catch (error) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse('Error finding user'));
  }
};

const updateUser = async (req: Request, res: Response): Promise<Response> => {
  const { fieldsToUpdate } = req.body;
  const { userId } = req.params;

  const userIdInt = parseInt(userId, 10);
  if (isNaN(userIdInt)) {
    return res.status(statusCodes.clientError.badRequest).send('userId must be an integer');
  }

  if (req.user.getId() !== userIdInt) {
    return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.UNAUTHORIZED));
  }

  try {
    await req.user.update(fieldsToUpdate);
    return res.status(statusCodes.success.ok).send(new JSONResponse(null, 'User updated successfully'));
  } catch (error) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse('Error updating user'));
  }
};

const deleteUser = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;

  const userIdInt = parseInt(userId, 10);
  if (isNaN(userIdInt)) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse('userId must be an integer'));
  }

  if (req.user.getId() !== userIdInt) {
    return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.UNAUTHORIZED));
  }

  try {
    await req.user.delete();
    return res.status(statusCodes.success.ok).send(new JSONResponse(null, 'User deleted successfully'));
  } catch (error) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse('Error deleting user'));
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
    return res.status(statusCodes.success.ok).send(new JSONResponse(null, { conversations }));
  } catch (error) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse('Error getting conversations'));
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
