import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const res: any = exception instanceof HttpException ? exception.getResponse() : null;
    const message = typeof res === 'object' && res.message ? res.message : exception.message || 'Internal server error';

    response.status(status).json({
      success: false,
      message: Array.isArray(message) ? message.join(', ') : message,
      code: status,
      errors: typeof res === 'object' && res.message ? (Array.isArray(res.message) ? res.message : [res.message]) : [message],
      timestamp: new Date().toISOString(),
    });
  }
}
