import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReportTables1730000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create report category enum
    await queryRunner.query(`
      CREATE TYPE report_category_enum AS ENUM (
        'sales',
        'marketing',
        'leads',
        'finance',
        'operations',
        'compliance'
      )
    `);

    // Create report type enum
    await queryRunner.query(`
      CREATE TYPE report_type_enum AS ENUM (
        'summary',
        'detail',
        'trend',
        'comparison',
        'forecast'
      )
    `);

    // Create report execution status enum
    await queryRunner.query(`
      CREATE TYPE report_execution_status_enum AS ENUM (
        'running',
        'completed',
        'failed'
      )
    `);

    // Create report_definitions table
    await queryRunner.query(`
      CREATE TABLE report_definitions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "reportKey" VARCHAR NOT NULL UNIQUE,
        name VARCHAR NOT NULL,
        description TEXT NOT NULL,
        category report_category_enum NOT NULL,
        "reportType" report_type_enum NOT NULL,
        "dataSource" VARCHAR NOT NULL,
        parameters JSONB,
        columns JSONB NOT NULL,
        aggregations JSONB,
        filters JSONB,
        sorting JSONB,
        visualizations JSONB,
        "accessRoles" TEXT[] NOT NULL,
        "createdBy" UUID NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_report_definition_creator FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for report_definitions
    await queryRunner.query(`
      CREATE INDEX idx_report_definitions_reportkey ON report_definitions("reportKey")
    `);
    await queryRunner.query(`
      CREATE INDEX idx_report_definitions_category ON report_definitions(category)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_report_definitions_isactive ON report_definitions("isActive")
    `);

    // Create report_executions table
    await queryRunner.query(`
      CREATE TABLE report_executions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "reportDefinitionId" UUID NOT NULL,
        "executedBy" UUID NOT NULL,
        parameters JSONB NOT NULL,
        status report_execution_status_enum NOT NULL,
        "resultData" JSONB,
        "resultUrl" VARCHAR,
        "executionTimeMs" INTEGER DEFAULT 0,
        "rowCount" INTEGER DEFAULT 0,
        "errorMessage" TEXT,
        "expiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_report_execution_definition FOREIGN KEY ("reportDefinitionId") REFERENCES report_definitions(id) ON DELETE CASCADE,
        CONSTRAINT fk_report_execution_executor FOREIGN KEY ("executedBy") REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for report_executions
    await queryRunner.query(`
      CREATE INDEX idx_report_executions_definition ON report_executions("reportDefinitionId")
    `);
    await queryRunner.query(`
      CREATE INDEX idx_report_executions_executor ON report_executions("executedBy")
    `);
    await queryRunner.query(`
      CREATE INDEX idx_report_executions_status ON report_executions(status)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_report_executions_createdat ON report_executions("createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX idx_report_executions_expiresat ON report_executions("expiresAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS report_executions`);
    await queryRunner.query(`DROP TABLE IF EXISTS report_definitions`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS report_execution_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS report_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS report_category_enum`);
  }
}
