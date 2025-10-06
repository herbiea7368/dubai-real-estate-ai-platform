import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAnalyticsTables1759675384212 implements MigrationInterface {
    name = 'CreateAnalyticsTables1759675384212'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."analytics_events_eventtype_enum" AS ENUM('page_view', 'search', 'listing_click', 'property_view', 'contact_click', 'whatsapp_click', 'call_click', 'email_click', 'favorite_add', 'favorite_remove', 'filter_apply', 'share_click')`);
        await queryRunner.query(`CREATE TYPE "public"."analytics_events_devicetype_enum" AS ENUM('desktop', 'mobile', 'tablet')`);
        await queryRunner.query(`CREATE TABLE "analytics_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "eventType" "public"."analytics_events_eventtype_enum" NOT NULL, "sessionId" uuid NOT NULL, "userId" uuid, "propertyId" uuid, "listingId" uuid, "leadId" uuid, "eventData" jsonb, "source" character varying(50) NOT NULL DEFAULT 'web', "deviceType" "public"."analytics_events_devicetype_enum", "userAgent" text, "ipAddress" character varying(45), "referrer" text, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5d643d67a09b55653e98616f421" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5d77d5048752272e97bbdccce8" ON "analytics_events" ("eventType", "timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_133b692115b192a431bbc8a54e" ON "analytics_events" ("sessionId", "timestamp") `);
        await queryRunner.query(`CREATE TYPE "public"."funnel_stages_stage_enum" AS ENUM('search', 'listing', 'detail', 'contact', 'conversion')`);
        await queryRunner.query(`CREATE TYPE "public"."funnel_stages_previousstage_enum" AS ENUM('search', 'listing', 'detail', 'contact', 'conversion')`);
        await queryRunner.query(`CREATE TABLE "funnel_stages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sessionId" uuid NOT NULL, "stage" "public"."funnel_stages_stage_enum" NOT NULL, "propertyId" uuid, "listingId" uuid, "previousStage" "public"."funnel_stages_previousstage_enum", "timeInStageSeconds" integer NOT NULL DEFAULT '0', "exitedAt" TIMESTAMP WITH TIME ZONE, "convertedToNextStage" boolean NOT NULL DEFAULT false, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4a0c461c532e1acb63ce6c44e32" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e743e3a1ddce33d951b0ff3b23" ON "funnel_stages" ("sessionId", "timestamp") `);
        await queryRunner.query(`ALTER TABLE "analytics_events" ADD CONSTRAINT "FK_5a6943770a0e7335b8c9b401aa6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "analytics_events" ADD CONSTRAINT "FK_a3d6aee4f70b96fffd932947212" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "analytics_events" ADD CONSTRAINT "FK_677984d365f65f5c5ef4c6a39b7" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "analytics_events" ADD CONSTRAINT "FK_0cde1ee57221e53cca6b60eaccc" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "funnel_stages" ADD CONSTRAINT "FK_b7bff90ac612ca4aae223456a00" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "funnel_stages" ADD CONSTRAINT "FK_66b9593f01afaeb532195f7abb8" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "funnel_stages" DROP CONSTRAINT "FK_66b9593f01afaeb532195f7abb8"`);
        await queryRunner.query(`ALTER TABLE "funnel_stages" DROP CONSTRAINT "FK_b7bff90ac612ca4aae223456a00"`);
        await queryRunner.query(`ALTER TABLE "analytics_events" DROP CONSTRAINT "FK_0cde1ee57221e53cca6b60eaccc"`);
        await queryRunner.query(`ALTER TABLE "analytics_events" DROP CONSTRAINT "FK_677984d365f65f5c5ef4c6a39b7"`);
        await queryRunner.query(`ALTER TABLE "analytics_events" DROP CONSTRAINT "FK_a3d6aee4f70b96fffd932947212"`);
        await queryRunner.query(`ALTER TABLE "analytics_events" DROP CONSTRAINT "FK_5a6943770a0e7335b8c9b401aa6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e743e3a1ddce33d951b0ff3b23"`);
        await queryRunner.query(`DROP TABLE "funnel_stages"`);
        await queryRunner.query(`DROP TYPE "public"."funnel_stages_previousstage_enum"`);
        await queryRunner.query(`DROP TYPE "public"."funnel_stages_stage_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_133b692115b192a431bbc8a54e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5d77d5048752272e97bbdccce8"`);
        await queryRunner.query(`DROP TABLE "analytics_events"`);
        await queryRunner.query(`DROP TYPE "public"."analytics_events_devicetype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."analytics_events_eventtype_enum"`);
    }

}
