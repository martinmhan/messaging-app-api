import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

import { ErrorMessage } from '../../types/types';
import User from '../../models/User';

const jwtKey = process.env.JWT_KEY;
if (!jwtKey) {
  throw new Error(ErrorMessage.MISSING_JWT_KEY);
}

passport.use(
  new Strategy(
    {
      secretOrKey: jwtKey,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    },
    async (jwtPayload: { userId: number }, done: Function): Promise<void> => {
      const { userId } = jwtPayload;
      const user = await User.findById(userId);

      if (!user) {
        return done(new Error(ErrorMessage.USER_DOES_NOT_EXIST), false);
      }

      return done(null, user);
    },
  ),
);

const authenticationHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const isJWTNotRequired =
    (req.method === 'POST' && req.originalUrl === '/api/user/login') ||
    (req.method === 'POST' && req.originalUrl === '/api/user');

  if (isJWTNotRequired) {
    next();
  } else {
    passport.authenticate('jwt', { session: false })(req, res, next);
  }
};

export default authenticationHandler;
