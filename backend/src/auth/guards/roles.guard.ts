import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core'; // 👈 ต้อง Import ตัวนี้จาก @nestjs/core เท่านั้นครับ!
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity'; // เช็ค Path ให้ตรงกับไฟล์ของคุณด้วยนะครับ

@Injectable()
export class RolesGuard implements CanActivate {
  // รับ Reflector เข้ามาทาง Constructor
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // ป้องกันกรณีที่ Request ไม่มี user (เช่น ลืมใส่ JwtAuthGuard ไว้คู่กัน)
    if (!user) {
        return false;
    }

    return requiredRoles.includes(user.role);
  }
}