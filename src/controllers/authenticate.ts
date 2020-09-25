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
      const user = await User.findById(userId);

      if (!user) {
        return done(new Error(User.constants.USER_DOES_NOT_EXIST), false);
      }

      return done(null, user);
    },
  ),
);

const authenticate = async (req: Request, res: Response, next: Function): Promise<void> => {
  const isJWTNotRequired =
    (req.method === 'POST' && req.originalUrl === '/api/user/login') ||
    (req.method === 'POST' && req.originalUrl === '/api/user') ||
    req.originalUrl === '/api/test';

  if (isJWTNotRequired) {
    next();
  } else {
    passport.authenticate('jwt', { session: false })(req, res, next);
  }
};

export default authenticate;
