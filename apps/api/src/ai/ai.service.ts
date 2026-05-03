import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MoviesService } from '../movies/movies.service';
import { BookingService } from '../booking/booking.service';
import { generateText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly moviesService: MoviesService,
    private readonly bookingService: BookingService,
  ) {}

  async chat(userId: string, sessionId: string | null, message: string) {
    // Ensure we have a valid user to link the session to (fallback for guest/dev)
    let validUserId = userId;
    const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      const firstUser = await this.prisma.user.findFirst();
      if (firstUser) {
        validUserId = firstUser.id;
      } else {
        // Create a system user if none exists
        const systemUser = await this.prisma.user.create({
          data: {
            email: 'system-ai@coicine.com',
            password: 'system-locked-account',
            name: 'AI Guest System',
          }
        });
        validUserId = systemUser.id;
      }
    }

    // 1. Get or create session
    let session = sessionId 
      ? await this.prisma.aIChatSession.findUnique({ where: { id: sessionId }, include: { messages: true } })
      : null;

    if (!session) {
      session = await this.prisma.aIChatSession.create({
        data: { userId: validUserId },
        include: { messages: true },
      });
    }

    // 2. Prepare conversation history
    const history = session.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // 3. Call AI
    const { text, toolResults } = await generateText({
      model: google('gemini-1.5-flash'),
      system: `Bạn là CoiCine Assistant - một trợ lý rạp chiếu phim chuyên nghiệp, thân thiện và am hiểu điện ảnh.
      Nhiệm vụ của bạn là giúp người dùng tìm phim, xem suất chiếu và hỗ trợ đặt vé.
      
      Nguyên tắc:
      1. Luôn ưu tiên thông tin từ Database thông qua các công cụ (tools).
      2. Khi người dùng hỏi về phim, hãy dùng searchMovies.
      3. Khi người dùng hỏi về suất chiếu, hãy dùng getShowtimes.
      4. Nếu người dùng muốn đặt vé, hãy tìm suất chiếu trước, sau đó hướng dẫn họ chọn ghế.
      5. Bạn KHÔNG được tự ý đặt vé hoặc thanh toán. Mọi quyết định cuối cùng thuộc về người dùng.
      6. Phản hồi bằng tiếng Việt, súc tích, đậm chất điện ảnh.`,
      messages: [...history, { role: 'user', content: message }],
      tools: {
        searchMovies: {
          description: 'Tìm kiếm phim theo tên hoặc mô tả',
          parameters: z.object({
            query: z.string().describe('Tên phim hoặc từ khóa tìm kiếm'),
          }),
          execute: async ({ query }: { query: string }) => {
            return this.moviesService.search(query);
          },
        } as any,
        getShowtimes: {
          description: 'Lấy danh sách suất chiếu của một bộ phim',
          parameters: z.object({
            movieId: z.string().describe('ID của bộ phim'),
          }),
          execute: async ({ movieId }: { movieId: string }) => {
            return this.moviesService.getShowtimes(movieId);
          },
        } as any,
      },
    });

    // 4. Save messages to DB
    await this.prisma.aIChatMessage.createMany({
      data: [
        { sessionId: session.id, role: 'user', content: message },
        { sessionId: session.id, role: 'assistant', content: text },
      ],
    });

    // 5. Prepare UI Cards
    const uiCards = [];
    
    for (const result of (toolResults as any) || []) {
      if (result.toolName === 'searchMovies') {
        uiCards.push({
          type: 'MOVIE_LIST',
          data: result.output,
        });
      }
      if (result.toolName === 'getShowtimes') {
        uiCards.push({
          type: 'SHOWTIME_LIST',
          data: result.output,
        });
      }
    }

    return {
      sessionId: session.id,
      text,
      uiCards,
    };
  }

  async getHistory(userId: string) {
    return this.prisma.aIChatSession.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
