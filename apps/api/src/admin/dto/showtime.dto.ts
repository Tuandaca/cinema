import { IsString, IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class CreateShowtimeDto {
  @IsString()
  @IsNotEmpty()
  movieId: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  startTime: string; // ISO date string

  @IsNumber()
  priceBase: number;
}

export class UpdateShowtimeDto {
  @IsString()
  @IsOptional()
  movieId?: string;

  @IsString()
  @IsOptional()
  roomId?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsNumber()
  @IsOptional()
  priceBase?: number;
}
