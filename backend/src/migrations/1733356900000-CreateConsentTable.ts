import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateConsentTable1733356900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'consents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'personId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'consentType',
            type: 'enum',
            enum: ['whatsapp', 'sms', 'email', 'phone'],
            isNullable: false,
          },
          {
            name: 'granted',
            type: 'boolean',
            isNullable: false,
          },
          {
            name: 'timestamp',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'varchar',
            length: '50',
            default: "'1.0'",
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'termsUrl',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create foreign key to users table
    await queryRunner.createForeignKey(
      'consents',
      new TableForeignKey({
        columnNames: ['personId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'FK_consents_personId',
      }),
    );

    // Create composite index on personId and consentType
    await queryRunner.createIndex(
      'consents',
      new TableIndex({
        name: 'IDX_consents_personId_consentType',
        columnNames: ['personId', 'consentType'],
      }),
    );

    // Create index on timestamp for audit queries
    await queryRunner.createIndex(
      'consents',
      new TableIndex({
        name: 'IDX_consents_timestamp',
        columnNames: ['timestamp'],
      }),
    );

    // Create immutability trigger function
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION prevent_consent_update()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'Consent records are immutable and cannot be updated';
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger to prevent updates on consents table
    await queryRunner.query(`
      CREATE TRIGGER trigger_prevent_consent_update
      BEFORE UPDATE ON consents
      FOR EACH ROW
      EXECUTE FUNCTION prevent_consent_update();
    `);

    // Create trigger to prevent timestamp updates specifically
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION prevent_timestamp_update()
      RETURNS TRIGGER AS $$
      BEGIN
        IF OLD.timestamp IS DISTINCT FROM NEW.timestamp THEN
          RAISE EXCEPTION 'Consent timestamp is immutable and cannot be modified';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query('DROP TRIGGER IF EXISTS trigger_prevent_consent_update ON consents;');
    await queryRunner.query('DROP FUNCTION IF EXISTS prevent_consent_update();');
    await queryRunner.query('DROP FUNCTION IF EXISTS prevent_timestamp_update();');

    // Drop indexes
    await queryRunner.dropIndex('consents', 'IDX_consents_timestamp');
    await queryRunner.dropIndex('consents', 'IDX_consents_personId_consentType');

    // Drop foreign key
    await queryRunner.dropForeignKey('consents', 'FK_consents_personId');

    // Drop table
    await queryRunner.dropTable('consents');
  }
}
