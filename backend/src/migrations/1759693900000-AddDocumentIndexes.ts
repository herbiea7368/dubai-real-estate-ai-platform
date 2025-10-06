import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocumentIndexes1759693900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add indexes for documents table
    await queryRunner.query(`
      CREATE INDEX "IDX_documents_documentType" ON "documents" ("documentType")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_documents_processingStatus" ON "documents" ("processingStatus")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_documents_uploadedBy" ON "documents" ("uploadedBy")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_documents_relatedToPropertyId" ON "documents" ("relatedToPropertyId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_documents_relatedToLeadId" ON "documents" ("relatedToLeadId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_documents_createdAt" ON "documents" ("createdAt")
    `);

    // Add indexes for extracted_fields table
    await queryRunner.query(`
      CREATE INDEX "IDX_extracted_fields_documentId" ON "extracted_fields" ("documentId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_extracted_fields_fieldName" ON "extracted_fields" ("fieldName")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes for extracted_fields table
    await queryRunner.query(`DROP INDEX "IDX_extracted_fields_fieldName"`);
    await queryRunner.query(`DROP INDEX "IDX_extracted_fields_documentId"`);

    // Drop indexes for documents table
    await queryRunner.query(`DROP INDEX "IDX_documents_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_documents_relatedToLeadId"`);
    await queryRunner.query(`DROP INDEX "IDX_documents_relatedToPropertyId"`);
    await queryRunner.query(`DROP INDEX "IDX_documents_uploadedBy"`);
    await queryRunner.query(`DROP INDEX "IDX_documents_processingStatus"`);
    await queryRunner.query(`DROP INDEX "IDX_documents_documentType"`);
  }
}
