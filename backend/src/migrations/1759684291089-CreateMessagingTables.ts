import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMessagingTables1759684291089 implements MigrationInterface {
    name = 'CreateMessagingTables1759684291089'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."messages_channel_enum" AS ENUM('whatsapp', 'sms', 'email')`);
        await queryRunner.query(`CREATE TYPE "public"."messages_messagetype_enum" AS ENUM('transactional', 'marketing', 'notification')`);
        await queryRunner.query(`CREATE TYPE "public"."messages_language_enum" AS ENUM('en', 'ar')`);
        await queryRunner.query(`CREATE TYPE "public"."messages_status_enum" AS ENUM('queued', 'sent', 'delivered', 'failed', 'blocked', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "recipientId" uuid, "recipientPhone" character varying(20) NOT NULL, "channel" "public"."messages_channel_enum" NOT NULL, "messageType" "public"."messages_messagetype_enum" NOT NULL, "templateId" character varying(100), "content" text NOT NULL, "language" "public"."messages_language_enum" NOT NULL DEFAULT 'en', "status" "public"."messages_status_enum" NOT NULL DEFAULT 'queued', "blockReason" character varying(255), "sentAt" TIMESTAMP, "deliveredAt" TIMESTAMP, "scheduledFor" TIMESTAMP, "consentVerified" boolean NOT NULL DEFAULT false, "consentVersion" character varying(50), "metadata" jsonb, "vendorMessageId" character varying(255), "vendorResponse" jsonb, "retryCount" integer NOT NULL DEFAULT '0', "createdBy" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6ce6acdb0801254590f8a78c08" ON "messages" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_f3df5d02eb1103d959cc606577" ON "messages" ("scheduledFor") `);
        await queryRunner.query(`CREATE INDEX "IDX_befd307485dbf0559d17e4a4d2" ON "messages" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_e892abf626277c40156742c613" ON "messages" ("recipientPhone") `);
        await queryRunner.query(`CREATE TYPE "public"."message_templates_channel_enum" AS ENUM('whatsapp', 'sms', 'email')`);
        await queryRunner.query(`CREATE TYPE "public"."message_templates_language_enum" AS ENUM('en', 'ar')`);
        await queryRunner.query(`CREATE TYPE "public"."message_templates_category_enum" AS ENUM('property_alert', 'lead_followup', 'appointment_reminder', 'market_update', 'valuation_ready', 'viewing_confirmation')`);
        await queryRunner.query(`CREATE TABLE "message_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "templateKey" character varying(100) NOT NULL, "channel" "public"."message_templates_channel_enum" NOT NULL, "language" "public"."message_templates_language_enum" NOT NULL, "name" character varying(255) NOT NULL, "content" text NOT NULL, "category" "public"."message_templates_category_enum" NOT NULL, "variables" jsonb NOT NULL, "whatsappTemplateId" character varying(255), "active" boolean NOT NULL DEFAULT true, "approvedBy" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_09f32307bdf4a97daec53b8b8cb" UNIQUE ("templateKey"), CONSTRAINT "PK_9ac2bd9635be662d183f314947d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_78c123b6e69b63570029f6eda2" ON "message_templates" ("active") `);
        await queryRunner.query(`CREATE INDEX "IDX_df258c13f0aa8f0cf211b15d7a" ON "message_templates" ("channel", "language") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_09f32307bdf4a97daec53b8b8c" ON "message_templates" ("templateKey") `);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_99d184ff35c63f34ed196cc14d3" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_templates" ADD CONSTRAINT "FK_7b8be8180462d124025ec493712" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message_templates" DROP CONSTRAINT "FK_7b8be8180462d124025ec493712"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_99d184ff35c63f34ed196cc14d3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_09f32307bdf4a97daec53b8b8c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_df258c13f0aa8f0cf211b15d7a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_78c123b6e69b63570029f6eda2"`);
        await queryRunner.query(`DROP TABLE "message_templates"`);
        await queryRunner.query(`DROP TYPE "public"."message_templates_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."message_templates_language_enum"`);
        await queryRunner.query(`DROP TYPE "public"."message_templates_channel_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e892abf626277c40156742c613"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_befd307485dbf0559d17e4a4d2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f3df5d02eb1103d959cc606577"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6ce6acdb0801254590f8a78c08"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TYPE "public"."messages_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."messages_language_enum"`);
        await queryRunner.query(`DROP TYPE "public"."messages_messagetype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."messages_channel_enum"`);
    }

}
