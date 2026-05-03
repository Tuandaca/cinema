import { Controller, Post, Get, Body, UseGuards, Req, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(
    @Req() req: any,
    @Body('message') message: string,
    @Body('sessionId') sessionId?: string,
  ) {
    // If not logged in, use a guest ID
    const userId = req.user?.id || 'guest-user-id';
    return this.aiService.chat(userId, sessionId || null, message);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@Req() req: any) {
    const userId = req.user.id;
    return this.aiService.getHistory(userId);
  }
}
