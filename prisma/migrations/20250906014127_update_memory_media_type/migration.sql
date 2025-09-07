-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO');

-- AlterTable
ALTER TABLE "public"."memories" ADD COLUMN     "media_type" "public"."MediaType" NOT NULL DEFAULT 'IMAGE';
