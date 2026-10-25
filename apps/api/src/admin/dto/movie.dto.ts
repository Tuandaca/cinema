import { MovieStatus } from "@prisma/client";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
} from "class-validator";

export class CreateMovieDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  trailerUrl?: string;

  @IsString()
  @IsOptional()
  posterUrl?: string;

  @IsEnum(MovieStatus)
  @IsOptional()
  status?: MovieStatus;

  @IsNumber()
  @IsOptional()
  rating?: number;

  @IsNumber()
  @IsOptional()
  runtime?: number;

  @IsString()
  @IsOptional()
  released?: string;

  @IsString()
  @IsOptional()
  certification?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsArray()
  @IsOptional()
  genres?: string[];
}

export class UpdateMovieDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  trailerUrl?: string;

  @IsString()
  @IsOptional()
  posterUrl?: string;

  @IsEnum(MovieStatus)
  @IsOptional()
  status?: MovieStatus;

  @IsNumber()
  @IsOptional()
  rating?: number;

  @IsNumber()
  @IsOptional()
  runtime?: number;

  @IsString()
  @IsOptional()
  released?: string;

  @IsString()
  @IsOptional()
  certification?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsArray()
  @IsOptional()
  genres?: string[];
}
