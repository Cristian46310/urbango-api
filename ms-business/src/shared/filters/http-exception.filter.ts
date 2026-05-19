import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'Internal server error';
    let reason: string | undefined;

    if (typeof errorResponse === 'object' && errorResponse !== null) {
      const body = errorResponse as {
        message?: string | string[];
        reason?: string;
      };

      if (typeof body.reason === 'string') {
        reason = body.reason;
      }

      if (typeof body.message === 'string') {
        message = body.message;
      } else if (Array.isArray(body.message)) {
        message = body.message.join(', ');
      } else if (reason) {
        message = reason;
      }
    } else if (typeof errorResponse === 'string') {
      message = errorResponse;
    }

    const error =
      typeof errorResponse === 'object' &&
      errorResponse !== null &&
      'error' in errorResponse
        ? (errorResponse as { error: string }).error
        : status === HttpStatus.UNAUTHORIZED
          ? 'UNAUTHORIZED'
          : status === HttpStatus.FORBIDDEN
            ? 'FORBIDDEN'
            : (HttpStatus[status] ?? 'Error');

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
      message,
      ...(reason ? { reason } : {}),
    });
  }
}
