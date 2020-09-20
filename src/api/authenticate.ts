import { Request, Response } from 'express';
import passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

import User from '../types/user';

passport.use(
  new Strategy(
    {
      secretOrKey: process.env.JWT_KEY,
      passReqToCallback: true,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    },
    async (req: Request, jwtPayload: { userId: number }, done: Function): Promise<void> => {
      const { userId } = jwtPayload;
      const user = await new User(userId).get();

      if (!user) {
        return done(new Error('User could not be found'), false);
      }

      return done(null, user);
    },
  ),
);

const authenticate = async (req: Request, res: Response, next: Function): Promise<void> => {
  if (req.originalUrl === '/api/user/login') {
    next();
  } else {
    passport.authenticate('jwt', { session: false })(req, res, next);
  }
};

export default authenticate;
