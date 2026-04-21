export const CINEMA_APP_NAME = "Cinema AI Booking";

export interface Movie {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
}

export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED"
}
