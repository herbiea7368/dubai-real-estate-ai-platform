import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1759599999496 implements MigrationInterface {
  name = 'CreateAuditLogs1759599999496';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "consents" DROP CONSTRAINT "FK_consents_personId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_phone"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_roles"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_consents_personId_consentType"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_consents_timestamp"`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "createdAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "consents" ALTER COLUMN "timestamp" SET DEFAULT now()`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a000cca60bcf04454e72769949" ON "users" ("phone") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c3ae1777759a6557771d905d4a" ON "consents" ("timestamp") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4d74caea201a79f092d8123516" ON "consents" ("personId", "consentType") `,
    );
    await queryRunner.query(
      `ALTER TABLE "consents" ADD CONSTRAINT "FK_c347e68e743799051eb37ec84bf" FOREIGN KEY ("personId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "consents" DROP CONSTRAINT "FK_c347e68e743799051eb37ec84bf"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_4d74caea201a79f092d8123516"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c3ae1777759a6557771d905d4a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a000cca60bcf04454e72769949"`);
    await queryRunner.query(
      `ALTER TABLE "consents" ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_consents_timestamp" ON "consents" ("timestamp") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_consents_personId_consentType" ON "consents" ("personId", "consentType") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_users_roles" ON "users" ("roles") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_phone" ON "users" ("phone") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email") `);
    await queryRunner.query(
      `ALTER TABLE "consents" ADD CONSTRAINT "FK_consents_personId" FOREIGN KEY ("personId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
