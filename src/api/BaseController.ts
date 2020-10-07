import { Request, Response, NextFunction } from 'express';

import { HTTPMethod, StatusCode, ErrorMessage, JSONResponse } from 'src/types/types';

abstract class BaseController {
  readonly httpMethod: HTTPMethod;
  readonly path: string;

  constructor(httpMethod: HTTPMethod, path: string) {
    this.httpMethod = httpMethod;
    this.path = path;
  }

  // util function to format return value in handleRequest
  format(
    statusCode: StatusCode,
    error: ErrorMessage | null,
    data?: unknown,
    meta?: unknown,
  ): { statusCode: StatusCode; jsonResponse: JSONResponse } {
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
  ): Promise<{ statusCode: StatusCode; jsonResponse: JSONResponse }>;

  execute = async (request: Request, response: Response, next: NextFunction): Promise<Response> => {
    const { statusCode, jsonResponse } = await this.handleRequest(request, response, next);
    return response.status(statusCode).send(jsonResponse);
  };
}

export default BaseController;
