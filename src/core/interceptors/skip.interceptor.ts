import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  // Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class SkipInterceptor implements NestInterceptor {
  constructor() {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle();
  }
}
