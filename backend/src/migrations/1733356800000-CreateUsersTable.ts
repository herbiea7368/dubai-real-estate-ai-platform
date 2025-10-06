import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUsersTable1733356800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'locale',
            type: 'enum',
            enum: ['en', 'ar'],
            default: "'en'",
            isNullable: false,
          },
          {
            name: 'roles',
            type: 'text',
            isArray: true,
            default: "'{buyer}'",
            isNullable: false,
          },
          {
            name: 'passwordHash',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'emailVerified',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'phoneVerified',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'lastLoginAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create index on email
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_email',
        columnNames: ['email'],
        isUnique: true,
      }),
    );

    // Create index on phone
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_phone',
        columnNames: ['phone'],
        isUnique: true,
      }),
    );

    // Create index on roles for query performance
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_roles',
        columnNames: ['roles'],
      }),
    );

    // Enable UUID extension if not already enabled
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'IDX_users_roles');
    await queryRunner.dropIndex('users', 'IDX_users_phone');
    await queryRunner.dropIndex('users', 'IDX_users_email');
    await queryRunner.dropTable('users');
  }
}
