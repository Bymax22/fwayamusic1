import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function sanitize(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') {
    try {
      const asNumber = Number(value);
      if (Number.isSafeInteger(asNumber)) return asNumber;
    } catch (_) {}
    return value.toString();
  }
  if (Array.isArray(value)) return value.map((v) => sanitize(v));
  if (typeof value === 'object') {
    const out: any = {};
    for (const k of Object.keys(value)) {
      out[k] = sanitize(value[k]);
    }
    return out;
  }
  return value;
}

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => sanitize(data))
    );
  }
}
