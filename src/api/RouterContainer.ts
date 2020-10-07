import { Request, Response, NextFunction, Router } from 'express';

import { HTTPMethod } from '../types/types';
import BaseController from './BaseController';

class RouterContainer {
  router: Router;

  constructor() {
    this.router = Router();
  }

  useRouter(path: string, routerContainer: RouterContainer): void {
    this.router.use(path, routerContainer.router);
  }

  useControllers(controllers: BaseController[]): void {
    controllers.forEach((controller: BaseController) => {
      switch (controller.httpMethod) {
        case HTTPMethod.POST:
          this.router.post(controller.path, controller.execute);
          break;
        case HTTPMethod.GET:
          this.router.get(controller.path, controller.execute);
          break;
        case HTTPMethod.PATCH:
          this.router.patch(controller.path, controller.execute);
          break;
        case HTTPMethod.PUT:
          this.router.put(controller.path, controller.execute);
          break;
        case HTTPMethod.DELETE:
          this.router.delete(controller.path, controller.execute);
          break;
      }
    });
  }

  useHandler(path: string, handler: (req: Request, res: Response, next: NextFunction) => void): void {
    this.router.use(path, handler);
  }
}

export default RouterContainer;
