import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDocumentTables1759693835998 implements MigrationInterface {
    name = 'CreateDocumentTables1759693835998'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."extracted_fields_fieldtype_enum" AS ENUM('text', 'date', 'number', 'boolean')`);
        await queryRunner.query(`CREATE TABLE "extracted_fields" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "documentId" uuid NOT NULL, "fieldName" character varying(255) NOT NULL, "fieldValue" text NOT NULL, "fieldType" "public"."extracted_fields_fieldtype_enum" NOT NULL, "confidence" numeric(3,2) NOT NULL, "boundingBox" jsonb, "validated" boolean NOT NULL DEFAULT false, "validationError" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2a7f9f4bb6cafeac5a15956a084" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."documents_filetype_enum" AS ENUM('pdf', 'image', 'jpeg', 'png')`);
        await queryRunner.query(`CREATE TYPE "public"."documents_documenttype_enum" AS ENUM('emirates_id', 'passport', 'trade_license', 'title_deed', 'tenancy_contract', 'noc', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."documents_processingstatus_enum" AS ENUM('pending', 'processing', 'completed', 'failed', 'validated')`);
        await queryRunner.query(`CREATE TYPE "public"."documents_language_enum" AS ENUM('en', 'ar', 'mixed')`);
        await queryRunner.query(`CREATE TABLE "documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fileName" character varying(500) NOT NULL, "fileUrl" text NOT NULL, "fileType" "public"."documents_filetype_enum" NOT NULL, "documentType" "public"."documents_documenttype_enum" NOT NULL, "uploadedBy" uuid NOT NULL, "relatedToPersonId" uuid, "relatedToPropertyId" uuid, "relatedToLeadId" uuid, "processingStatus" "public"."documents_processingstatus_enum" NOT NULL DEFAULT 'pending', "ocrCompleted" boolean NOT NULL DEFAULT false, "validationCompleted" boolean NOT NULL DEFAULT false, "extractedData" jsonb, "validationResults" jsonb, "ocrProvider" character varying(100), "processingErrors" text array, "confidenceScore" numeric(3,2), "language" "public"."documents_language_enum", "pageCount" integer, "fileSize" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "extracted_fields" ADD CONSTRAINT "FK_d18e05635cb3a9481b45308d725" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_236dfbbac76eceda26294a645de" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_a6f10181b2048a4cdc57be80a39" FOREIGN KEY ("relatedToPersonId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_bde72f37b70e355a96b83d7ee3c" FOREIGN KEY ("relatedToPropertyId") REFERENCES "properties"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_e67cca3c25775406abd787b0fec" FOREIGN KEY ("relatedToLeadId") REFERENCES "leads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_e67cca3c25775406abd787b0fec"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_bde72f37b70e355a96b83d7ee3c"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_a6f10181b2048a4cdc57be80a39"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_236dfbbac76eceda26294a645de"`);
        await queryRunner.query(`ALTER TABLE "extracted_fields" DROP CONSTRAINT "FK_d18e05635cb3a9481b45308d725"`);
        await queryRunner.query(`DROP TABLE "documents"`);
        await queryRunner.query(`DROP TYPE "public"."documents_language_enum"`);
        await queryRunner.query(`DROP TYPE "public"."documents_processingstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."documents_documenttype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."documents_filetype_enum"`);
        await queryRunner.query(`DROP TABLE "extracted_fields"`);
        await queryRunner.query(`DROP TYPE "public"."extracted_fields_fieldtype_enum"`);
    }

}
