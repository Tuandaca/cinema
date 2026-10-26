import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Optional,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ShowtimeGuard implements CanActivate {
  constructor(@Optional() private readonly prisma?: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const showtimeId = request.params?.id || request.body?.showtimeId;

    if (!showtimeId || !this.prisma) {
      return true;
    }

    const showtime = await this.prisma.showtime.findUnique({
      where: { id: showtimeId },
      select: { id: true, startTime: true },
    });

    if (!showtime) {
      throw new BadRequestException("Suất chiếu không tồn tại");
    }

    if (new Date(showtime.startTime).getTime() <= Date.now()) {
      throw new BadRequestException(
        "Không thể đặt hoặc giữ ghế cho suất chiếu đã kết thúc hoặc đang diễn ra",
      );
    }

    return true;
  }
}
