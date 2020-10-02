import User from '../models/User';

declare module 'express' {
  export interface Request {
    user?: User;
  }
}

declare module 'socket.io' {
  export interface Socket {
    userId?: number;
    isAuthenticated?: boolean;
  }
}
