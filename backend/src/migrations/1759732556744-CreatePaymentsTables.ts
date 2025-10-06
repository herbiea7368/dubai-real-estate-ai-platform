import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePaymentsTables1759732556744 implements MigrationInterface {
    name = 'CreatePaymentsTables1759732556744'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."escrow_accounts_status_enum" AS ENUM('active', 'funded', 'partial_release', 'completed', 'cancelled', 'disputed')`);
        await queryRunner.query(`CREATE TABLE "escrow_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountNumber" character varying(50) NOT NULL, "propertyId" uuid NOT NULL, "buyerId" uuid NOT NULL, "sellerId" uuid NOT NULL, "agentId" uuid, "totalAmount" numeric(15,2) NOT NULL, "depositedAmount" numeric(15,2) NOT NULL DEFAULT '0', "releasedAmount" numeric(15,2) NOT NULL DEFAULT '0', "status" "public"."escrow_accounts_status_enum" NOT NULL DEFAULT 'active', "conditions" jsonb NOT NULL DEFAULT '[]', "releaseApprovals" jsonb NOT NULL DEFAULT '[]', "bankName" character varying(200) NOT NULL, "bankAccountNumber" character varying(100) NOT NULL, "iban" character varying(50), "openedAt" TIMESTAMP NOT NULL, "closedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_015dea6c530989b9034a93b688b" UNIQUE ("accountNumber"), CONSTRAINT "PK_4d065b88217295bb812ff7b2af2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5fb90845036be42987113ab96d" ON "escrow_accounts" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_2ceff0b10cfb61b3bd01963b93" ON "escrow_accounts" ("sellerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_200eb9ff07ae6cee912a0ad350" ON "escrow_accounts" ("buyerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ca36fca710206f888931842f82" ON "escrow_accounts" ("propertyId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_015dea6c530989b9034a93b688" ON "escrow_accounts" ("accountNumber") `);
        await queryRunner.query(`CREATE TYPE "public"."payments_paymenttype_enum" AS ENUM('booking_deposit', 'down_payment', 'installment', 'agency_fee', 'service_fee', 'earnest_money')`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed')`);
        await queryRunner.query(`CREATE TYPE "public"."payments_paymentmethod_enum" AS ENUM('credit_card', 'debit_card', 'bank_transfer', 'cheque', 'cash')`);
        await queryRunner.query(`CREATE TYPE "public"."payments_gateway_enum" AS ENUM('telr', 'network_international', 'payfort', 'stripe', 'manual')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transactionId" character varying(100) NOT NULL, "paymentType" "public"."payments_paymenttype_enum" NOT NULL, "amount" numeric(15,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'AED', "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "paymentMethod" "public"."payments_paymentmethod_enum" NOT NULL, "gateway" "public"."payments_gateway_enum" NOT NULL, "gatewayTransactionId" character varying(200), "gatewayResponse" jsonb, "propertyId" uuid NOT NULL, "leadId" uuid NOT NULL, "paidBy" uuid NOT NULL, "receivedBy" uuid, "escrowAccountId" uuid, "invoiceNumber" character varying(100), "receiptUrl" character varying(500), "refundAmount" numeric(15,2) NOT NULL DEFAULT '0', "refundedAt" TIMESTAMP, "processingFee" numeric(15,2) NOT NULL DEFAULT '0', "netAmount" numeric(15,2) NOT NULL, "metadata" jsonb, "failureReason" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c39d78e8744809ece8ca95730e2" UNIQUE ("transactionId"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8277a466232344577740a61344" ON "payments" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_3a0122c0354a287d72abf9de7b" ON "payments" ("paidBy") `);
        await queryRunner.query(`CREATE INDEX "IDX_9b660a46eeeb52f6075771fc9b" ON "payments" ("leadId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8ffcbb107170ed65322ac59fd6" ON "payments" ("propertyId") `);
        await queryRunner.query(`CREATE INDEX "IDX_32b41cdb985a296213e9a928b5" ON "payments" ("status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c39d78e8744809ece8ca95730e" ON "payments" ("transactionId") `);
        await queryRunner.query(`CREATE TYPE "public"."installment_plans_frequency_enum" AS ENUM('monthly', 'quarterly', 'semi_annual', 'annual')`);
        await queryRunner.query(`CREATE TYPE "public"."installment_plans_status_enum" AS ENUM('active', 'completed', 'defaulted', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "installment_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "propertyId" uuid NOT NULL, "leadId" uuid NOT NULL, "totalAmount" numeric(15,2) NOT NULL, "downPaymentAmount" numeric(15,2) NOT NULL, "installmentCount" integer NOT NULL, "installmentAmount" numeric(15,2) NOT NULL, "frequency" "public"."installment_plans_frequency_enum" NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "status" "public"."installment_plans_status_enum" NOT NULL DEFAULT 'active', "installments" jsonb NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2bcdae2e05a4584743ee0d991db" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a164cdb3ce431494b75ab52766" ON "installment_plans" ("startDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_7d47046f63c3005efb13b811a0" ON "installment_plans" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_7d0f9f66e16873ea7c2d14fe16" ON "installment_plans" ("leadId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7e39eb17831186ba9296f4ccef" ON "installment_plans" ("propertyId") `);
        await queryRunner.query(`ALTER TABLE "escrow_accounts" ADD CONSTRAINT "FK_ca36fca710206f888931842f825" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "escrow_accounts" ADD CONSTRAINT "FK_200eb9ff07ae6cee912a0ad350d" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "escrow_accounts" ADD CONSTRAINT "FK_2ceff0b10cfb61b3bd01963b93a" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "escrow_accounts" ADD CONSTRAINT "FK_dae0317c934bb8dbce9c9ca8f50" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_8ffcbb107170ed65322ac59fd6e" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_9b660a46eeeb52f6075771fc9bf" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_3a0122c0354a287d72abf9de7bf" FOREIGN KEY ("paidBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_7ce8b5a02f1c0d487a90b3d468c" FOREIGN KEY ("receivedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_134968c77f0c595f7145e110126" FOREIGN KEY ("escrowAccountId") REFERENCES "escrow_accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "installment_plans" ADD CONSTRAINT "FK_7e39eb17831186ba9296f4ccef2" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "installment_plans" ADD CONSTRAINT "FK_7d0f9f66e16873ea7c2d14fe163" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "installment_plans" DROP CONSTRAINT "FK_7d0f9f66e16873ea7c2d14fe163"`);
        await queryRunner.query(`ALTER TABLE "installment_plans" DROP CONSTRAINT "FK_7e39eb17831186ba9296f4ccef2"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_134968c77f0c595f7145e110126"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_7ce8b5a02f1c0d487a90b3d468c"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_3a0122c0354a287d72abf9de7bf"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_9b660a46eeeb52f6075771fc9bf"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_8ffcbb107170ed65322ac59fd6e"`);
        await queryRunner.query(`ALTER TABLE "escrow_accounts" DROP CONSTRAINT "FK_dae0317c934bb8dbce9c9ca8f50"`);
        await queryRunner.query(`ALTER TABLE "escrow_accounts" DROP CONSTRAINT "FK_2ceff0b10cfb61b3bd01963b93a"`);
        await queryRunner.query(`ALTER TABLE "escrow_accounts" DROP CONSTRAINT "FK_200eb9ff07ae6cee912a0ad350d"`);
        await queryRunner.query(`ALTER TABLE "escrow_accounts" DROP CONSTRAINT "FK_ca36fca710206f888931842f825"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7e39eb17831186ba9296f4ccef"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d0f9f66e16873ea7c2d14fe16"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d47046f63c3005efb13b811a0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a164cdb3ce431494b75ab52766"`);
        await queryRunner.query(`DROP TABLE "installment_plans"`);
        await queryRunner.query(`DROP TYPE "public"."installment_plans_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."installment_plans_frequency_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c39d78e8744809ece8ca95730e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_32b41cdb985a296213e9a928b5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8ffcbb107170ed65322ac59fd6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9b660a46eeeb52f6075771fc9b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3a0122c0354a287d72abf9de7b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8277a466232344577740a61344"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_gateway_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_paymentmethod_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_paymenttype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_015dea6c530989b9034a93b688"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ca36fca710206f888931842f82"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_200eb9ff07ae6cee912a0ad350"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2ceff0b10cfb61b3bd01963b93"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5fb90845036be42987113ab96d"`);
        await queryRunner.query(`DROP TABLE "escrow_accounts"`);
        await queryRunner.query(`DROP TYPE "public"."escrow_accounts_status_enum"`);
    }

}
