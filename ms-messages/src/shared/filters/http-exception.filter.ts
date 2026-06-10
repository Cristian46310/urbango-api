import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

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
    } else if (exception instanceof Error && exception.message) {
      message = exception.message;
    }

    const error =
      typeof errorResponse === 'object' &&
      errorResponse !== null &&
      'error' in errorResponse
        ? (errorResponse as { error: string }).error
        : status === 401
          ? 'UNAUTHORIZED'
          : status === 403
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
