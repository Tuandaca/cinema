/*
  Warnings:

  - A unique constraint covering the columns `[traktId]` on the table `Movie` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[imdbId]` on the table `Movie` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tmdbId]` on the table `Movie` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Movie" ADD COLUMN     "certification" TEXT,
ADD COLUMN     "imdbId" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "released" TIMESTAMP(3),
ADD COLUMN     "runtime" INTEGER,
ADD COLUMN     "tmdbId" INTEGER,
ADD COLUMN     "traktId" INTEGER,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "trailerUrl" DROP NOT NULL,
ALTER COLUMN "posterUrl" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'COMING_SOON';

-- CreateIndex
CREATE UNIQUE INDEX "Movie_traktId_key" ON "Movie"("traktId");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_imdbId_key" ON "Movie"("imdbId");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_tmdbId_key" ON "Movie"("tmdbId");
