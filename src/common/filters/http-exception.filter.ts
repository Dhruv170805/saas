import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { logger } from '@/lib/logger';

/**
 * Universal Global Exception Filter.
 * Ensures consistent, high-integrity error response format across the entire SaaS Control Plane.
 * Every failure is intercepted and returned as a standardized JSON object.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = 
      exception instanceof HttpException
        ? (exception.getResponse() as any).message || exception.message
        : 'Internal Strategic Failure';

    // Log the operational incident
    logger.error(`[INCIDENT] ${request.method} ${request.url} - ${status}: ${message}`);
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error(exception); // Full stack for terminal diagnostics
    }

    response.status(status).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
