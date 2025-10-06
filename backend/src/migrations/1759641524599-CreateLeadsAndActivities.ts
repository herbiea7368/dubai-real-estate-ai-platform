import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLeadsAndActivities1759641524599 implements MigrationInterface {
    name = 'CreateLeadsAndActivities1759641524599'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."lead_activities_activitytype_enum" AS ENUM('email_sent', 'email_opened', 'sms_sent', 'whatsapp_sent', 'call_made', 'property_viewed', 'meeting_scheduled', 'meeting_completed', 'offer_made', 'note_added', 'lead_created', 'status_changed', 'assigned')`);
        await queryRunner.query(`CREATE TABLE "lead_activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "leadId" uuid NOT NULL, "activityType" "public"."lead_activities_activitytype_enum" NOT NULL, "performedBy" uuid, "details" jsonb NOT NULL DEFAULT '{}', "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1aa1cc6988a817368568ca26bf1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_799722539181f32939d64567fa" ON "lead_activities" ("activityType") `);
        await queryRunner.query(`CREATE INDEX "IDX_6e38772dbcc845ea73e1bbde4e" ON "lead_activities" ("leadId", "timestamp") `);
        await queryRunner.query(`CREATE TYPE "public"."leads_source_enum" AS ENUM('website', 'bayut', 'dubizzle', 'pf', 'facebook', 'instagram', 'referral', 'walk_in', 'call')`);
        await queryRunner.query(`CREATE TYPE "public"."leads_tier_enum" AS ENUM('hot', 'warm', 'cold')`);
        await queryRunner.query(`CREATE TYPE "public"."leads_status_enum" AS ENUM('new', 'contacted', 'qualified', 'nurture', 'converted', 'lost')`);
        await queryRunner.query(`CREATE TYPE "public"."leads_preferredpropertytype_enum" AS ENUM('apartment', 'villa', 'townhouse', 'penthouse')`);
        await queryRunner.query(`CREATE TABLE "leads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "personId" uuid, "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(20) NOT NULL, "countryCode" character varying(10) NOT NULL DEFAULT '+971', "source" "public"."leads_source_enum" NOT NULL, "campaign" character varying(255), "utmSource" character varying(255), "utmMedium" character varying(255), "utmCampaign" character varying(255), "score" numeric(3,2) NOT NULL DEFAULT '0', "tier" "public"."leads_tier_enum" NOT NULL DEFAULT 'cold', "status" "public"."leads_status_enum" NOT NULL DEFAULT 'new', "assignedToAgentId" uuid, "propertyInterests" jsonb NOT NULL DEFAULT '[]', "budget" jsonb, "preferredCommunities" text array NOT NULL DEFAULT '{}', "preferredPropertyType" "public"."leads_preferredpropertytype_enum", "interestedInOffPlan" boolean NOT NULL DEFAULT false, "investorProfile" boolean NOT NULL DEFAULT false, "visaEligibilityInterest" boolean NOT NULL DEFAULT false, "lastContactedAt" TIMESTAMP, "conversionDate" TIMESTAMP, "notes" text, "scoringFeatures" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cd102ed7a9a4ca7d4d8bfeba406" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b65118404b3b0f8898ddf0c9ee" ON "leads" ("source") `);
        await queryRunner.query(`CREATE INDEX "IDX_e712a54af130f8f36647f65da8" ON "leads" ("assignedToAgentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c179b160113c2c5349b5bb38c8" ON "leads" ("tier", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_42ebb4366d014febbcfdef39e3" ON "leads" ("phone") `);
        await queryRunner.query(`CREATE INDEX "IDX_b3eea7add0e16594dba102716c" ON "leads" ("email") `);
        await queryRunner.query(`ALTER TABLE "lead_activities" ADD CONSTRAINT "FK_e9bae3444c9d4f23c8b8e4aa69a" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lead_activities" ADD CONSTRAINT "FK_e78e577e0a9b0093320cb8884a1" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leads" ADD CONSTRAINT "FK_f0d630574c1ee29bb46de42373f" FOREIGN KEY ("personId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leads" ADD CONSTRAINT "FK_e712a54af130f8f36647f65da8d" FOREIGN KEY ("assignedToAgentId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_e712a54af130f8f36647f65da8d"`);
        await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_f0d630574c1ee29bb46de42373f"`);
        await queryRunner.query(`ALTER TABLE "lead_activities" DROP CONSTRAINT "FK_e78e577e0a9b0093320cb8884a1"`);
        await queryRunner.query(`ALTER TABLE "lead_activities" DROP CONSTRAINT "FK_e9bae3444c9d4f23c8b8e4aa69a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b3eea7add0e16594dba102716c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_42ebb4366d014febbcfdef39e3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c179b160113c2c5349b5bb38c8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e712a54af130f8f36647f65da8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b65118404b3b0f8898ddf0c9ee"`);
        await queryRunner.query(`DROP TABLE "leads"`);
        await queryRunner.query(`DROP TYPE "public"."leads_preferredpropertytype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."leads_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."leads_tier_enum"`);
        await queryRunner.query(`DROP TYPE "public"."leads_source_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6e38772dbcc845ea73e1bbde4e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_799722539181f32939d64567fa"`);
        await queryRunner.query(`DROP TABLE "lead_activities"`);
        await queryRunner.query(`DROP TYPE "public"."lead_activities_activitytype_enum"`);
    }

}
