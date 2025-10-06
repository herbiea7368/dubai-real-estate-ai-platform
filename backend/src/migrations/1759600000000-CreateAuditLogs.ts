import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1759600000000 implements MigrationInterface {
  name = 'CreateAuditLogs1759600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" SERIAL NOT NULL,
                "user_id" uuid NOT NULL,
                "action" character varying(100) NOT NULL,
                "entity_type" character varying(50),
                "entity_id" integer,
                "details" jsonb,
                "ip_address" character varying(45),
                "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_audit_logs_user_id_timestamp" ON "audit_logs" ("user_id", "timestamp")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_audit_logs_timestamp" ON "audit_logs" ("timestamp")
        `);

    await queryRunner.query(`
            ALTER TABLE "audit_logs"
            ADD CONSTRAINT "FK_audit_logs_user_id"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_timestamp"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_action"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_user_id_timestamp"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
  }
}
