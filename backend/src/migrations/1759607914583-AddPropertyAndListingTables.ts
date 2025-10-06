import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropertyAndListingTables1759607914583 implements MigrationInterface {
  name = 'AddPropertyAndListingTables1759607914583';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."listings_status_enum" AS ENUM('draft', 'pending_review', 'published', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."listings_language_enum" AS ENUM('en', 'ar', 'both')`,
    );
    await queryRunner.query(
      `CREATE TABLE "listings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "propertyId" uuid NOT NULL, "permitId" uuid, "titleEn" character varying NOT NULL, "titleAr" character varying NOT NULL, "descriptionEn" text NOT NULL, "descriptionAr" text NOT NULL, "features" text array NOT NULL DEFAULT '{}', "mediaUrls" jsonb NOT NULL DEFAULT '[]', "virtualStagingApplied" boolean NOT NULL DEFAULT false, "publishedChannels" text array NOT NULL DEFAULT '{}', "status" "public"."listings_status_enum" NOT NULL DEFAULT 'draft', "publishedAt" TIMESTAMP, "viewCount" integer NOT NULL DEFAULT '0', "contactCount" integer NOT NULL DEFAULT '0', "language" "public"."listings_language_enum" NOT NULL DEFAULT 'both', "badges" text array NOT NULL DEFAULT '{}', "createdBy" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_520ecac6c99ec90bcf5a603cdcb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."properties_type_enum" AS ENUM('apartment', 'villa', 'townhouse', 'penthouse', 'land', 'commercial')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."properties_status_enum" AS ENUM('available', 'reserved', 'sold', 'rented', 'off_market')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."properties_purpose_enum" AS ENUM('sale', 'rent')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."properties_completionstatus_enum" AS ENUM('ready', 'off_plan')`,
    );
    await queryRunner.query(
      `CREATE TABLE "properties" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "referenceNumber" character varying NOT NULL, "type" "public"."properties_type_enum" NOT NULL, "status" "public"."properties_status_enum" NOT NULL DEFAULT 'available', "purpose" "public"."properties_purpose_enum" NOT NULL, "community" character varying NOT NULL, "subCommunity" character varying, "developer" character varying, "bedrooms" integer NOT NULL, "bathrooms" numeric(3,1) NOT NULL, "areaSqft" integer NOT NULL, "areaSqm" integer NOT NULL, "priceAed" numeric(15,2) NOT NULL, "pricePerSqft" numeric(10,2) NOT NULL, "completionStatus" "public"."properties_completionstatus_enum" NOT NULL, "handoverDate" date, "amenities" text array NOT NULL DEFAULT '{}', "location" jsonb, "address" jsonb NOT NULL, "agentId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d5bb4cc7ed06de44878bf3ff597" UNIQUE ("referenceNumber"), CONSTRAINT "PK_2d83bfa0b9fcd45dee1785af44d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a20191ecd5d581020d372fb152" ON "properties" ("community") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_72aa95e507e2414001eed89f0f" ON "properties" ("developer") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d5bb4cc7ed06de44878bf3ff59" ON "properties" ("referenceNumber") `,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" ADD CONSTRAINT "FK_1a183ff60be4dadddaa624c62bf" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" ADD CONSTRAINT "FK_4f8a99fe5c74e02750338c8ec21" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" ADD CONSTRAINT "FK_353db6091069783cf1673cc82f6" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "properties" DROP CONSTRAINT "FK_353db6091069783cf1673cc82f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" DROP CONSTRAINT "FK_4f8a99fe5c74e02750338c8ec21"`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" DROP CONSTRAINT "FK_1a183ff60be4dadddaa624c62bf"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_d5bb4cc7ed06de44878bf3ff59"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_72aa95e507e2414001eed89f0f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a20191ecd5d581020d372fb152"`);
    await queryRunner.query(`DROP TABLE "properties"`);
    await queryRunner.query(`DROP TYPE "public"."properties_completionstatus_enum"`);
    await queryRunner.query(`DROP TYPE "public"."properties_purpose_enum"`);
    await queryRunner.query(`DROP TYPE "public"."properties_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."properties_type_enum"`);
    await queryRunner.query(`DROP TABLE "listings"`);
    await queryRunner.query(`DROP TYPE "public"."listings_language_enum"`);
    await queryRunner.query(`DROP TYPE "public"."listings_status_enum"`);
  }
}
