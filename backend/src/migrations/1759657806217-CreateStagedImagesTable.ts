import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStagedImagesTable1759657806217 implements MigrationInterface {
    name = 'CreateStagedImagesTable1759657806217'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."staged_images_style_enum" AS ENUM('modern', 'minimal', 'luxury', 'traditional', 'scandinavian', 'arabic')`);
        await queryRunner.query(`CREATE TYPE "public"."staged_images_roomtype_enum" AS ENUM('living', 'bedroom', 'kitchen', 'dining', 'bathroom', 'outdoor')`);
        await queryRunner.query(`CREATE TYPE "public"."staged_images_processingstatus_enum" AS ENUM('pending', 'processing', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "staged_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "listingId" uuid NOT NULL, "originalImageUrl" character varying(1000) NOT NULL, "stagedImageUrl" character varying(1000), "style" "public"."staged_images_style_enum" NOT NULL, "roomType" "public"."staged_images_roomtype_enum" NOT NULL, "processingStatus" "public"."staged_images_processingstatus_enum" NOT NULL DEFAULT 'pending', "aiModel" character varying(100) NOT NULL DEFAULT 'stable-diffusion-xl', "processingTimeMs" integer, "metadata" jsonb, "watermarkApplied" boolean NOT NULL DEFAULT true, "createdBy" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_fe27fb268bdb4fa3e06871e6afb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "staged_images" ADD CONSTRAINT "FK_7a7aec815eae1dc698a80867f9a" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "staged_images" ADD CONSTRAINT "FK_c9198301cb8100f6c367e0427a0" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "staged_images" DROP CONSTRAINT "FK_c9198301cb8100f6c367e0427a0"`);
        await queryRunner.query(`ALTER TABLE "staged_images" DROP CONSTRAINT "FK_7a7aec815eae1dc698a80867f9a"`);
        await queryRunner.query(`DROP TABLE "staged_images"`);
        await queryRunner.query(`DROP TYPE "public"."staged_images_processingstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."staged_images_roomtype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."staged_images_style_enum"`);
    }

}
