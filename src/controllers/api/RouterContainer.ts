import { Request, Response, NextFunction, Router } from 'express';

import * as types from '../../types/types';
import BaseController from './BaseController';

class RouterContainer {
  router: Router;

  constructor() {
    this.router = Router();
  }

  useRouter(path: string, routerContainer: RouterContainer): void {
    this.router.use(path, routerContainer.router);
  }

  useControllers(controllers: Array<BaseController>): void {
    controllers.forEach((controller: BaseController) => {
      switch (controller.httpMethod) {
        case types.HTTPMethod.POST:
          this.router.post(controller.path, controller.execute);
          break;
        case types.HTTPMethod.GET:
          this.router.get(controller.path, controller.execute);
          break;
        case types.HTTPMethod.PATCH:
          this.router.patch(controller.path, controller.execute);
          break;
        case types.HTTPMethod.PUT:
          this.router.put(controller.path, controller.execute);
          break;
        case types.HTTPMethod.DELETE:
          this.router.delete(controller.path, controller.execute);
          break;
      }
    });
  }

  useHandler(path: string, handler: (req: Request, res: Response, next: NextFunction) => void): void {
    this.router.use(handler);
  }
}

export default RouterContainer;
