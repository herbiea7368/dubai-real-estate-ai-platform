import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarketToProperties1759639240477 implements MigrationInterface {
  name = 'AddMarketToProperties1759639240477';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."properties_market_enum" AS ENUM('Dubai', 'Abu Dhabi')`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" ADD "market" "public"."properties_market_enum" NOT NULL DEFAULT 'Dubai'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "market"`);
    await queryRunner.query(`DROP TYPE "public"."properties_market_enum"`);
  }
}
