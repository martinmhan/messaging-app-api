import { Request, Response } from 'express';
import passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

import User from '../models/User';

passport.use(
  new Strategy(
    {
      secretOrKey: process.env.JWT_KEY,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    },
    async (jwtPayload: { userId: number }, done: Function): Promise<void> => {
      const { userId } = jwtPayload;
      const user = await User.findByUserId(userId);

      if (!user) {
        return done(new Error('User could not be found'), false);
      }

      return done(null, user);
    },
  ),
);

const authenticate = async (req: Request, res: Response, next: Function): Promise<void> => {
  const isJWTNotRequired =
    req.originalUrl === '/api/test' ||
    req.originalUrl === '/api/user/login' ||
    (req.method === 'POST' && req.originalUrl === '/api/user');

  if (isJWTNotRequired) {
    next();
  } else {
    passport.authenticate('jwt', { session: false })(req, res, next);
  }
};

export default authenticate;
