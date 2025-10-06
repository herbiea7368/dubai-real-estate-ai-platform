import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateValuationsAndMarketData1759665275238 implements MigrationInterface {
    name = 'CreateValuationsAndMarketData1759665275238'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."valuations_confidencelevel_enum" AS ENUM('high', 'medium', 'low')`);
        await queryRunner.query(`CREATE TYPE "public"."valuations_valuationmethod_enum" AS ENUM('comparative', 'hedonic', 'hybrid')`);
        await queryRunner.query(`CREATE TABLE "valuations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "propertyId" uuid NOT NULL, "estimatedValueAed" numeric(12,2) NOT NULL, "confidenceLowAed" numeric(12,2) NOT NULL, "confidenceHighAed" numeric(12,2) NOT NULL, "confidenceLevel" "public"."valuations_confidencelevel_enum" NOT NULL, "valuationMethod" "public"."valuations_valuationmethod_enum" NOT NULL DEFAULT 'comparative', "comparableProperties" jsonb, "features" jsonb NOT NULL, "marketFactors" jsonb, "pricePerSqft" numeric(10,2) NOT NULL, "estimatedRentAed" numeric(12,2), "grossYieldPct" numeric(5,2), "mae" numeric(5,2) NOT NULL, "requestedBy" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f7d29c688fe21ae296643cf8c3b" PRIMARY KEY ("id")); COMMENT ON COLUMN "valuations"."mae" IS 'Mean Absolute Error percentage'`);
        await queryRunner.query(`CREATE INDEX "IDX_b84585b69b1ac20f5ed6115838" ON "valuations" ("requestedBy") `);
        await queryRunner.query(`CREATE INDEX "IDX_43d87481b699458bc6241af851" ON "valuations" ("propertyId", "createdAt") `);
        await queryRunner.query(`CREATE TYPE "public"."market_data_propertytype_enum" AS ENUM('apartment', 'villa', 'townhouse', 'penthouse', 'land', 'commercial')`);
        await queryRunner.query(`CREATE TABLE "market_data" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "community" character varying(100) NOT NULL, "propertyType" "public"."market_data_propertytype_enum" NOT NULL, "avgPriceSqft" numeric(10,2) NOT NULL, "avgRentSqft" numeric(10,2), "transactionCount" integer NOT NULL DEFAULT '0', "priceChangeYoY" numeric(5,2), "dataDate" date NOT NULL, "source" character varying(50) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f66c35bec52b05f6eae861225e6" PRIMARY KEY ("id")); COMMENT ON COLUMN "market_data"."avgPriceSqft" IS 'Average price per square foot in AED'; COMMENT ON COLUMN "market_data"."avgRentSqft" IS 'Average rent per square foot in AED'; COMMENT ON COLUMN "market_data"."priceChangeYoY" IS 'Year-over-year price change percentage'; COMMENT ON COLUMN "market_data"."source" IS 'Data source: DLD, internal, market_index, etc.'`);
        await queryRunner.query(`CREATE INDEX "IDX_7fd14982e1675ca1345730a711" ON "market_data" ("community") `);
        await queryRunner.query(`CREATE INDEX "IDX_8cf05095705f596b45cba5e47a" ON "market_data" ("propertyType") `);
        await queryRunner.query(`CREATE INDEX "IDX_03c2e1cc6ddc75f78eca4cf586" ON "market_data" ("dataDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_eac6b6387f079fa0d0fc6d3cf8" ON "market_data" ("community", "propertyType", "dataDate") `);
        await queryRunner.query(`ALTER TABLE "valuations" ADD CONSTRAINT "FK_a039e578c3b269cdd42ce00ac99" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "valuations" ADD CONSTRAINT "FK_b84585b69b1ac20f5ed6115838d" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "valuations" DROP CONSTRAINT "FK_b84585b69b1ac20f5ed6115838d"`);
        await queryRunner.query(`ALTER TABLE "valuations" DROP CONSTRAINT "FK_a039e578c3b269cdd42ce00ac99"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eac6b6387f079fa0d0fc6d3cf8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_03c2e1cc6ddc75f78eca4cf586"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8cf05095705f596b45cba5e47a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7fd14982e1675ca1345730a711"`);
        await queryRunner.query(`DROP TABLE "market_data"`);
        await queryRunner.query(`DROP TYPE "public"."market_data_propertytype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_43d87481b699458bc6241af851"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b84585b69b1ac20f5ed6115838"`);
        await queryRunner.query(`DROP TABLE "valuations"`);
        await queryRunner.query(`DROP TYPE "public"."valuations_valuationmethod_enum"`);
        await queryRunner.query(`DROP TYPE "public"."valuations_confidencelevel_enum"`);
    }

}
