import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = request.user?.id || 'anonymous';

    const startTime = Date.now();

    this.logger.log({
      message: 'Incoming request',
      method,
      url,
      ip,
      userAgent,
      userId,
    });

    return next.handle().pipe(
      tap({
        next: (_data) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const responseTime = Date.now() - startTime;

          this.logger.log({
            message: 'Request completed',
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
            userId,
          });
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;

          this.logger.error({
            message: 'Request failed',
            method,
            url,
            error: error.message,
            stack: error.stack,
            responseTime: `${responseTime}ms`,
            userId,
          });
        },
      }),
    );
  }
}
