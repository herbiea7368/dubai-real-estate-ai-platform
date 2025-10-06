import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStagedImageCountToListings1759658159902 implements MigrationInterface {
    name = 'AddStagedImageCountToListings1759658159902'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "listings" ADD "stagedImageCount" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN "stagedImageCount"`);
    }

}
