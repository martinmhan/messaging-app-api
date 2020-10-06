import { Request, Response, NextFunction } from 'express';

import * as types from 'src/types/types';

abstract class BaseController {
  readonly httpMethod: types.HTTPMethod;
  readonly path: string;

  // util function to format return value in handleRequest
  format(
    statusCode: types.StatusCode,
    error: types.ErrorMessage | null,
    data?: unknown,
    meta?: unknown,
  ): { statusCode: types.StatusCode; jsonResponse: types.JSONResponse } {
    return {
      statusCode,
      jsonResponse: {
        error,
        data: data || null,
        meta: meta || null,
      },
    };
  }

  abstract handleRequest(
    request: Request,
    response?: Response,
    next?: NextFunction,
  ): Promise<{ statusCode: types.StatusCode; jsonResponse: types.JSONResponse }>;

  execute = async (request: Request, response: Response, next: NextFunction): Promise<Response> => {
    const { statusCode, jsonResponse } = await this.handleRequest(request, response, next);
    return response.status(statusCode).send(jsonResponse);
  };
}

export default BaseController;
