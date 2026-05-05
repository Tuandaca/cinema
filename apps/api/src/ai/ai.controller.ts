import { Controller, Post, Get, Body, UseGuards, Req, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @UseGuards(ThrottlerGuard)
  async chat(
    @Req() req: any,
    @Body('message') message: string,
    @Body('sessionId') sessionId?: string,
  ) {
    // Support both authenticated and guest users, but throttle all
    const userId = req.user?.id || 'guest-user-id';
    return this.aiService.chat(userId, sessionId || null, message);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@Query('sessionId') sessionId: string) {
    return this.aiService.getHistory(sessionId);
  }
}
