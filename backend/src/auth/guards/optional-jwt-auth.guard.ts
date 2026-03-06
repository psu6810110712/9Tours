import { Injectable } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = { id?: string }>(
    err: unknown,
    user: TUser,
    _info: unknown,
    _context: ExecutionContext,
    _status?: unknown,
  ): TUser | null {
    if (err) return null;
    return user ?? null;
  }
}
