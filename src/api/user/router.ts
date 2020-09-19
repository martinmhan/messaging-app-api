import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import User from '../../types/user';

const loginUser = async (req: Request, res: Response): Promise<Response> => {
  const authorizationHeader: string = req.header('Authorization');
  const userNamePassword: string = Buffer.from(authorizationHeader.replace('Basic ', ''), 'base64').toString();
  const [userName, password] = userNamePassword.split(':');

  const user = await User.find(userName);

  if (password !== user.password) {
    return res.status(401).send('Unsuccessful login');
  }

  const jwtSecretKey = process.env.JWT_KEY;
  const jwtPayload = {
    userName: user.userName,
    userId: user.id,
  };
  const jwtOptions = {
    expiresIn: '1 day',
  };

  const jsonWebToken = jwt.sign(jwtPayload, jwtSecretKey, jwtOptions);

  return res.status(200).send(jsonWebToken);
};

const createUser = async (req: Request, res: Response): Promise<Response> => {
  const { user } = req.body;

  if (!user.userName || !user.password || !user.firstName || !user.lastName) {
    return res.status(400).send('Missing user information');
  }

  const existingUser = await User.find(user.userName);
  if (existingUser) {
    return res.status(400).send('Username already taken');
  }

  try {
    const newUser = await new User().create(user);
    return res.status(200).send(newUser);
  } catch (error) {
    return res.status(400).send('Error creating user');
  }
};

const getUser = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).send('userId is required');
  }

  const userIdInt = parseInt(userId);
  if (isNaN(userIdInt)) {
    return res.status(400).send('userId must be an integer');
  }

  try {
    const user = await new User(userIdInt).get();
    return res.status(200).send(user);
  } catch (error) {
    return res.status(400).send('Error finding user');
  }
};

const updateUser = async (req: Request, res: Response): Promise<Response> => {
  return res.status(200).send('hi');
};

const router = Router();
router.post('/login', loginUser);
router.post('/', createUser);
router.get('/:userId', getUser);
router.put('/:userId', updateUser);

export default router;
