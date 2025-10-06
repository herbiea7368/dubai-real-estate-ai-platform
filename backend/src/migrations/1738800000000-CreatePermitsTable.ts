import { MigrationInterface, QueryRunner, Table, TableIndex, TableCheck } from 'typeorm';

export class CreatePermitsTable1738800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "permits_permittype_enum" AS ENUM('broker', 'listing', 'advertisement')
    `);

    await queryRunner.query(`
      CREATE TYPE "permits_market_enum" AS ENUM('Dubai', 'Abu Dhabi')
    `);

    await queryRunner.query(`
      CREATE TYPE "permits_issuer_enum" AS ENUM('DLD', 'RERA', 'ADGM', 'ADREC')
    `);

    await queryRunner.query(`
      CREATE TYPE "permits_status_enum" AS ENUM('valid', 'expired', 'revoked', 'pending')
    `);

    // Create permits table
    await queryRunner.createTable(
      new Table({
        name: 'permits',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'trakheesiNumber',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'propertyId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'permitType',
            type: 'permits_permittype_enum',
          },
          {
            name: 'market',
            type: 'permits_market_enum',
          },
          {
            name: 'issuer',
            type: 'permits_issuer_enum',
          },
          {
            name: 'issueDate',
            type: 'date',
          },
          {
            name: 'expiryDate',
            type: 'date',
          },
          {
            name: 'status',
            type: 'permits_status_enum',
            default: "'valid'",
          },
          {
            name: 'validationHistory',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'lastCheckedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create unique index on trakheesiNumber
    await queryRunner.createIndex(
      'permits',
      new TableIndex({
        name: 'IDX_PERMITS_TRAKHEESI_NUMBER',
        columnNames: ['trakheesiNumber'],
        isUnique: true,
      }),
    );

    // Create index on expiryDate for expiry queries
    await queryRunner.createIndex(
      'permits',
      new TableIndex({
        name: 'IDX_PERMITS_EXPIRY_DATE',
        columnNames: ['expiryDate'],
      }),
    );

    // Create composite index on (status, market) for filtering
    await queryRunner.createIndex(
      'permits',
      new TableIndex({
        name: 'IDX_PERMITS_STATUS_MARKET',
        columnNames: ['status', 'market'],
      }),
    );

    // Add check constraint: expiryDate > issueDate
    await queryRunner.createCheckConstraint(
      'permits',
      new TableCheck({
        name: 'CHK_PERMITS_EXPIRY_AFTER_ISSUE',
        expression: '"expiryDate" > "issueDate"',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop check constraint
    await queryRunner.dropCheckConstraint('permits', 'CHK_PERMITS_EXPIRY_AFTER_ISSUE');

    // Drop indexes
    await queryRunner.dropIndex('permits', 'IDX_PERMITS_STATUS_MARKET');
    await queryRunner.dropIndex('permits', 'IDX_PERMITS_EXPIRY_DATE');
    await queryRunner.dropIndex('permits', 'IDX_PERMITS_TRAKHEESI_NUMBER');

    // Drop table
    await queryRunner.dropTable('permits');

    // Drop enum types
    await queryRunner.query(`DROP TYPE "permits_status_enum"`);
    await queryRunner.query(`DROP TYPE "permits_issuer_enum"`);
    await queryRunner.query(`DROP TYPE "permits_market_enum"`);
    await queryRunner.query(`DROP TYPE "permits_permittype_enum"`);
  }
}
