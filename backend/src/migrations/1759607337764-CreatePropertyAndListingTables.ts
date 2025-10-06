import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePropertyAndListingTables1759607337764 implements MigrationInterface {
  name = 'CreatePropertyAndListingTables1759607337764';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_PERMITS_TRAKHEESI_NUMBER"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_PERMITS_EXPIRY_DATE"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_PERMITS_STATUS_MARKET"`);
    await queryRunner.query(
      `ALTER TABLE "permits" DROP CONSTRAINT "CHK_PERMITS_EXPIRY_AFTER_ISSUE"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3c3184db5dc5fe1314358b4824" ON "permits" ("trakheesiNumber") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1f62d7a790652a71a03c7c6f28" ON "permits" ("expiryDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aacb0f1909d906542f97bf1036" ON "permits" ("status", "market") `,
    );
    await queryRunner.query(
      `ALTER TABLE "permits" ADD CONSTRAINT "CHK_b46489f19f1a8f70eab912573a" CHECK ("expiryDate" > "issueDate")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "permits" DROP CONSTRAINT "CHK_b46489f19f1a8f70eab912573a"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_aacb0f1909d906542f97bf1036"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1f62d7a790652a71a03c7c6f28"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3c3184db5dc5fe1314358b4824"`);
    await queryRunner.query(
      `ALTER TABLE "permits" ADD CONSTRAINT "CHK_PERMITS_EXPIRY_AFTER_ISSUE" CHECK (("expiryDate" > "issueDate"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PERMITS_STATUS_MARKET" ON "permits" ("market", "status") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_PERMITS_EXPIRY_DATE" ON "permits" ("expiryDate") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_PERMITS_TRAKHEESI_NUMBER" ON "permits" ("trakheesiNumber") `,
    );
  }
}
