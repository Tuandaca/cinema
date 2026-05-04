import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MoviesService } from '../movies/movies.service';
import { BookingService } from '../booking/booking.service';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
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
    this.logger.log(`Chat request: user=${userId}, session=${sessionId}, message=${message}`);

    // Ensure valid user
    let validUserId = userId;
    const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      const firstUser = await this.prisma.user.findFirst();
      if (firstUser) {
        validUserId = firstUser.id;
      } else {
        const systemUser = await this.prisma.user.create({
          data: {
            email: 'system@coicine.com',
            name: 'System User',
            password: 'system-password-placeholder',
          },
        });
        validUserId = systemUser.id;
      }
    }

    // 1. Get or Create Session
    let session;
    if (sessionId) {
      session = await this.prisma.aIChatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
      });
    }
    if (!session) {
      session = await this.prisma.aIChatSession.create({
        data: { userId: validUserId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
    }

    // 2. Prepare conversation history
    const history = session.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    // 3. Build current date context
    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // 4. Call AI with comprehensive tools
    let result: any;
    try {
      result = await generateText({
        model: google('gemini-2.5-flash'),
        system: `Bạn là **CoiCine AI Buddy** – trợ lý rạp chiếu phim thông minh của nền tảng CoiCine.
Hôm nay là ${dateStr}.

## Vai trò của bạn
Bạn là một chuyên gia điện ảnh, biết mọi thứ về rạp CoiCine. Bạn giúp khách hàng:
- Tìm kiếm & gợi ý phim phù hợp (theo thể loại, tâm trạng, đánh giá)
- Xem lịch chiếu, giá vé, thông tin phòng chiếu
- Hướng dẫn đặt vé từng bước (chọn phim → chọn suất → chọn ghế → thanh toán)
- Xem combo bắp nước (F&B)
- Kiểm tra ghế trống trước khi đặt
- Giải đáp mọi câu hỏi liên quan đến rạp

## Nguyên tắc PHẢI tuân thủ
1. **LUÔN gọi tool** khi cần dữ liệu thực. KHÔNG bịa ra tên phim, giá vé, suất chiếu.
2. **Gợi ý thông minh**: Khi user hỏi chung chung ("tôi muốn xem phim gì hay"), hãy hỏi thêm sở thích hoặc dùng getTopRatedMovies.
3. **Hướng dẫn proactive**: Sau khi tìm phim, TỰ ĐỘNG đề xuất "Bạn muốn xem suất chiếu không?" hoặc "Bạn có muốn tôi kiểm tra ghế trống?"
4. **Navigation links**: Khi đề cập đến phim, luôn kèm link dạng /movies/{id}. Khi nói về đặt vé, dùng /movies/{movieId}/booking.
5. **Phản hồi bằng tiếng Việt**, thân thiện, tự nhiên, đậm chất điện ảnh. Dùng emoji phù hợp.
6. **Không tự đặt vé / thanh toán**. Chỉ hướng dẫn và cung cấp link.
7. Khi không tìm thấy kết quả, gợi ý phương án thay thế.

## Cấu trúc website CoiCine (để hướng dẫn user)
- Trang chủ: /
- Danh sách phim: /movies
- Chi tiết phim: /movies/{movieId}
- Đặt vé (chọn ghế): /movies/{movieId}/booking
- Thanh toán: /checkout
- Thanh toán thành công: /checkout/success

## Cách gợi ý phim thông minh
- Nếu user muốn "phim vui": tìm Comedy, Animation
- Nếu user muốn "phim gay cấn": tìm Action, Thriller
- Nếu user muốn "phim tình cảm": tìm Romance, Drama
- Nếu user muốn "phim kinh dị": tìm Horror, Mystery
- Nếu user muốn "phim cho gia đình": tìm Animation, Family
- Nếu user muốn "phim hay nhất": dùng getTopRatedMovies`,
        messages: [
          ...history.filter((m) => m.content && m.content.trim() !== ''),
          { role: 'user', content: message },
        ],
        tools: {
          // ═══════════════════════════════════════════
          // 🎬 MOVIE TOOLS
          // ═══════════════════════════════════════════
          searchMovies: {
            description:
              'Tìm kiếm phim theo từ khóa (tên phim, mô tả, nội dung). Dùng khi user muốn tìm phim cụ thể.',
            parameters: z.object({
              query: z.string().describe('Từ khóa tìm kiếm (tên phim, keyword, mô tả)'),
            }),
            execute: async ({ query }: { query: string }) => {
              const movies = await this.moviesService.search(query);
              return movies.map((m) => ({
                id: m.id,
                title: m.title,
                posterUrl: m.posterUrl,
                rating: m.rating,
                runtime: m.runtime,
                description: m.description?.slice(0, 120),
                genres: m.genres,
                status: m.status,
              }));
            },
          } as any,

          getMovieDetails: {
            description:
              'Lấy thông tin chi tiết đầy đủ của một bộ phim (bao gồm rating, thời lượng, mô tả, thể loại, trailer). Dùng khi user muốn biết sâu về 1 phim.',
            parameters: z.object({
              movieId: z.string().describe('ID của bộ phim cần xem chi tiết'),
            }),
            execute: async ({ movieId }: { movieId: string }) => {
              const movie = await this.moviesService.findOne(movieId);
              if (!movie) return { error: 'Không tìm thấy phim' };
              return {
                id: movie.id,
                title: movie.title,
                posterUrl: movie.posterUrl,
                rating: movie.rating,
                runtime: movie.runtime,
                description: movie.description,
                genres: movie.genres,
                released: movie.released,
                language: movie.language,
                certification: movie.certification,
                trailerUrl: movie.trailerUrl,
                status: movie.status,
                link: `/movies/${movie.id}`,
              };
            },
          } as any,

          getNowShowingMovies: {
            description:
              'Lấy danh sách phim đang chiếu (NOW_SHOWING). Dùng khi user hỏi "đang chiếu phim gì?", "phim gì hay đang chiếu?"',
            parameters: z.object({}),
            execute: async () => {
              const movies = await this.prisma.movie.findMany({
                where: { status: 'NOW_SHOWING' },
                include: { genres: true },
                orderBy: { rating: 'desc' },
              });
              return movies.map((m) => ({
                id: m.id,
                title: m.title,
                posterUrl: m.posterUrl,
                rating: m.rating,
                runtime: m.runtime,
                genres: m.genres,
                status: m.status,
              }));
            },
          } as any,

          getComingSoonMovies: {
            description:
              'Lấy danh sách phim sắp chiếu (COMING_SOON). Dùng khi user hỏi "phim sắp chiếu?", "phim mới sắp ra?"',
            parameters: z.object({}),
            execute: async () => {
              const movies = await this.prisma.movie.findMany({
                where: { status: 'COMING_SOON' },
                include: { genres: true },
                orderBy: { released: 'asc' },
              });
              return movies.map((m) => ({
                id: m.id,
                title: m.title,
                posterUrl: m.posterUrl,
                rating: m.rating,
                runtime: m.runtime,
                released: m.released,
                genres: m.genres,
              }));
            },
          } as any,

          getTopRatedMovies: {
            description:
              'Lấy phim có đánh giá cao nhất. Dùng khi user hỏi "phim hay nhất?", "phim nên xem?", "gợi ý phim"',
            parameters: z.object({
              limit: z.number().optional().describe('Số lượng phim muốn lấy (mặc định 5)'),
            }),
            execute: async ({ limit }: { limit?: number }) => {
              const movies = await this.prisma.movie.findMany({
                include: { genres: true },
                orderBy: { rating: 'desc' },
                take: limit || 5,
                where: { rating: { not: null } },
              });
              return movies.map((m) => ({
                id: m.id,
                title: m.title,
                posterUrl: m.posterUrl,
                rating: m.rating,
                runtime: m.runtime,
                genres: m.genres,
              }));
            },
          } as any,

          getMoviesByGenre: {
            description:
              'Lấy danh sách phim theo thể loại. Dùng khi user muốn xem phim theo thể loại cụ thể (Action, Comedy, Drama, Horror, Sci-Fi, v.v.)',
            parameters: z.object({
              genre: z.string().describe('Tên thể loại (ví dụ: Action, Comedy, Drama, Horror, Sci-Fi, Romance, Animation, Thriller)'),
            }),
            execute: async ({ genre }: { genre: string }) => {
              const movies = await this.moviesService.findAll(genre);
              return movies.map((m) => ({
                id: m.id,
                title: m.title,
                posterUrl: m.posterUrl,
                rating: m.rating,
                runtime: m.runtime,
                genres: m.genres,
              }));
            },
          } as any,

          // ═══════════════════════════════════════════
          // 🎟️ SHOWTIME & BOOKING TOOLS
          // ═══════════════════════════════════════════
          getShowtimes: {
            description:
              'Lấy danh sách suất chiếu (lịch chiếu) của một bộ phim. Dùng khi user hỏi "lịch chiếu phim X?", "suất chiếu phim X?"',
            parameters: z.object({
              movieId: z.string().describe('ID của bộ phim cần xem suất chiếu'),
            }),
            execute: async ({ movieId }: { movieId: string }) => {
              const showtimes = await this.moviesService.getShowtimes(movieId);
              return showtimes.map((st) => ({
                id: st.id,
                startTime: st.startTime,
                endTime: st.endTime,
                priceBase: st.priceBase,
                movieId: st.movieId,
                room: { name: st.room.name, capacity: st.room.capacity },
              }));
            },
          } as any,

          getSeatAvailability: {
            description:
              'Kiểm tra ghế trống cho một suất chiếu. Trả về thống kê số ghế trống, đã đặt, đang giữ. Dùng khi user hỏi "còn ghế không?", "ghế trống suất chiếu X?"',
            parameters: z.object({
              showtimeId: z.string().describe('ID của suất chiếu cần kiểm tra ghế'),
            }),
            execute: async ({ showtimeId }: { showtimeId: string }) => {
              try {
                const seats = await this.bookingService.getSeatsStatus(showtimeId);
                const total = seats.length;
                const available = seats.filter((s) => s.status === 'AVAILABLE').length;
                const booked = seats.filter((s) => s.status === 'BOOKED').length;
                const locked = seats.filter((s) => s.status === 'LOCKED' || s.status === 'SELECTING').length;
                const vipAvailable = seats.filter(
                  (s) => s.type === 'VIP' && s.status === 'AVAILABLE',
                ).length;
                const normalAvailable = seats.filter(
                  (s) => s.type === 'NORMAL' && s.status === 'AVAILABLE',
                ).length;

                return {
                  total,
                  available,
                  booked,
                  locked,
                  vipAvailable,
                  normalAvailable,
                  bookingLink: `/movies/booking?showtimeId=${showtimeId}`,
                };
              } catch {
                return { error: 'Không tìm thấy suất chiếu hoặc lỗi khi kiểm tra ghế.' };
              }
            },
          } as any,

          // ═══════════════════════════════════════════
          // 🍿 COMBO / F&B TOOLS
          // ═══════════════════════════════════════════
          getCombos: {
            description:
              'Lấy danh sách combo bắp nước (F&B). Dùng khi user hỏi "có combo gì?", "bắp nước bao nhiêu?", "đồ ăn?"',
            parameters: z.object({}),
            execute: async () => {
              const combos = await this.prisma.combo.findMany();
              return combos.map((c) => ({
                id: c.id,
                name: c.name,
                description: c.description,
                price: c.price,
              }));
            },
          } as any,

          // ═══════════════════════════════════════════
          // 📊 GENERAL INFO TOOLS
          // ═══════════════════════════════════════════
          getTheaterInfo: {
            description:
              'Lấy thông tin về rạp chiếu phim (danh sách phòng, sức chứa). Dùng khi user hỏi "rạp có mấy phòng?", "phòng chiếu nào?"',
            parameters: z.object({}),
            execute: async () => {
              const rooms = await this.prisma.theaterRoom.findMany({
                include: { _count: { select: { seats: true } } },
              });
              return {
                theaterName: 'CoiCine Premium Cinema',
                rooms: rooms.map((r) => ({
                  id: r.id,
                  name: r.name,
                  capacity: r.capacity,
                  totalSeats: r._count.seats,
                })),
                facilities: [
                  'Dolby Atmos Sound System',
                  'IMAX Laser Projection',
                  'Luxury Recliner Seats',
                  'Premium F&B Lounge',
                ],
              };
            },
          } as any,
        },
      });
    } catch (error) {
      this.logger.error(`AI generateText error: ${error.message}`);
      
      // Handle rate limit / quota errors gracefully
      const errMsg = error.message || '';
      if (errMsg.includes('quota') || errMsg.includes('rate') || errMsg.includes('429') || errMsg.includes('Quota exceeded')) {
        // Save to DB to keep session alive
        await this.prisma.aIChatMessage.createMany({
          data: [
            { sessionId: session.id, role: 'user', content: message },
            { sessionId: session.id, role: 'assistant', content: 'Xin lỗi bạn, hệ thống đang quá tải. Vui lòng thử lại sau ít giây nhé! 🙏' },
          ],
        });
        return {
          sessionId: session.id,
          text: 'Xin lỗi bạn, hệ thống đang quá tải. Vui lòng thử lại sau ít giây nhé! 🙏',
          uiCards: [],
        };
      }
      throw error;
    }

    const { text, toolResults } = result;

    // 5. Save messages to DB
    await this.prisma.aIChatMessage.createMany({
      data: [
        { sessionId: session.id, role: 'user', content: message },
        { sessionId: session.id, role: 'assistant', content: text || '' },
      ],
    });

    // 6. Build rich UI cards from tool results
    const uiCards: any[] = [];
    if (toolResults) {
      for (const res of toolResults) {
        const data = res.result || res.output;

        switch (res.toolName) {
          case 'searchMovies':
          case 'getNowShowingMovies':
          case 'getComingSoonMovies':
          case 'getTopRatedMovies':
          case 'getMoviesByGenre':
            if (Array.isArray(data) && data.length > 0) {
              uiCards.push({ type: 'MOVIE_LIST', data });
            }
            break;

          case 'getMovieDetails':
            if (data && !data.error) {
              uiCards.push({ type: 'MOVIE_DETAIL', data });
            }
            break;

          case 'getShowtimes':
            if (Array.isArray(data)) {
              uiCards.push({ type: 'SHOWTIME_LIST', data });
            }
            break;

          case 'getCombos':
            if (Array.isArray(data) && data.length > 0) {
              uiCards.push({ type: 'COMBO_LIST', data });
            }
            break;

          case 'getSeatAvailability':
            if (data && !data.error) {
              uiCards.push({ type: 'SEAT_AVAILABILITY', data });
            }
            break;

          case 'getTheaterInfo':
            if (data) {
              uiCards.push({ type: 'THEATER_INFO', data });
            }
            break;
        }
      }
    }

    this.logger.log(`AI Response (${uiCards.length} cards): ${text?.slice(0, 100)}`);
    return {
      sessionId: session.id,
      text,
      uiCards,
    };
  }

  async getHistory(sessionId: string) {
    return this.prisma.aIChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
