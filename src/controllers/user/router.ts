import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import User from '../../models/User';

const loginUser = async (req: Request, res: Response): Promise<Response> => {
  const authorizationHeader: string = req.header('Authorization');
  const userNamePassword: string = Buffer.from(authorizationHeader?.replace('Basic ', ''), 'base64').toString();
  const [userName, password] = userNamePassword?.split(':');

  const user = await User.findByUserName(userName);

  if (!user || !user?.validatePassword(password)) {
    return res.status(401).send('Unsuccessful login');
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

  return res.status(200).send(jsonWebToken);
};

const createUser = async (req: Request, res: Response): Promise<Response> => {
  const { user } = req.body;

  if (!user || !user.userName || !user.password || !user.firstName || !user.lastName) {
    return res.status(400).send('Missing user information');
  }

  const existingUser = await User.findByUserName(user.userName);
  if (existingUser) {
    return res.status(400).send('Username already taken');
  }

  try {
    const newUser = await User.create(user);
    return res.status(200).send(newUser);
  } catch (error) {
    return res.status(400).send('Error creating user');
  }
};

const getUser = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;

  const userIdInt = parseInt(userId);
  if (isNaN(userIdInt)) {
    return res.status(400).send('userId must be an integer');
  }

  if (req.user.getId() !== userIdInt) {
    return res.status(400).send('Unauthorized');
  }

  try {
    const user = await User.findByUserId(userIdInt);
    return res.status(200).send(user);
  } catch (error) {
    return res.status(400).send('Error finding user');
  }
};

const updateUser = async (req: Request, res: Response): Promise<Response> => {
  const { fieldsToUpdate } = req.body;
  const { userId } = req.params;

  const userIdInt = parseInt(userId, 10);
  if (isNaN(userIdInt)) {
    return res.status(400).send('userId must be an integer');
  }

  if (req.user.getId() !== userIdInt) {
    return res.status(400).send('Unauthorized');
  }

  try {
    const user = await User.findByUserId(userIdInt);
    await user.update(fieldsToUpdate);
    return res.status(200).send('User updated successfully');
  } catch (error) {
    return res.status(400).send('Error updating user');
  }
};

const getConversations = async (req: Request, res: Response): Promise<Response> => {
  return res.status(200).send('hiya');
};

const deleteUser = async (req: Request, res: Response): Promise<Response> => {
  return res.status(200).send('hi');
};

const router = Router();
router.post('/', createUser);
router.get('/:userId', getUser);
router.patch('/:userId', updateUser);
router.delete('/:userId', deleteUser);
router.post('/login', loginUser);
router.get('/conversations', getConversations);

export default router;
