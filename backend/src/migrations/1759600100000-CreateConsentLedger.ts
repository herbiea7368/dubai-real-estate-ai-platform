import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConsentLedger1759600100000 implements MigrationInterface {
  name = 'CreateConsentLedger1759600100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "consent_ledger" (
                "id" SERIAL NOT NULL,
                "person_id" uuid NOT NULL,
                "consent_type" character varying(50) NOT NULL,
                "granted" boolean NOT NULL,
                "version" character varying(50) NOT NULL,
                "ip_address" character varying(45),
                "granted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_consent_ledger" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_consent_ledger_person_id_consent_type" ON "consent_ledger" ("person_id", "consent_type")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_consent_ledger_person_id_granted_at" ON "consent_ledger" ("person_id", "granted_at")
        `);

    await queryRunner.query(`
            ALTER TABLE "consent_ledger"
            ADD CONSTRAINT "FK_consent_ledger_person_id"
            FOREIGN KEY ("person_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

    // Create trigger function to prevent updates (PDPL immutability requirement)
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION prevent_consent_ledger_update()
            RETURNS TRIGGER AS $$
            BEGIN
                RAISE EXCEPTION 'Consent records are immutable and cannot be updated. Create a new record instead.';
            END;
            $$ LANGUAGE plpgsql;
        `);

    // Create trigger to prevent updates
    await queryRunner.query(`
            CREATE TRIGGER trigger_prevent_consent_ledger_update
            BEFORE UPDATE ON consent_ledger
            FOR EACH ROW
            EXECUTE FUNCTION prevent_consent_ledger_update();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_prevent_consent_ledger_update ON consent_ledger`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS prevent_consent_ledger_update`);
    await queryRunner.query(
      `ALTER TABLE "consent_ledger" DROP CONSTRAINT "FK_consent_ledger_person_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_consent_ledger_person_id_granted_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_consent_ledger_person_id_consent_type"`);
    await queryRunner.query(`DROP TABLE "consent_ledger"`);
  }
}
