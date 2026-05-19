import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBoardingFlowFields1779050000000
  implements MigrationInterface
{
  name = 'AddBoardingFlowFields1779050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."tickets_status_enum" AS ENUM ('active', 'completed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TYPE "public"."tickets_status_enum" ADD VALUE IF NOT EXISTS 'completed'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "appliedRate" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "status" "public"."tickets_status_enum" NOT NULL DEFAULT 'active'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "boardedAt" TIMESTAMP WITH TIME ZONE`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."payment_method_citizens_type_enum" AS ENUM ('prepaid', 'credit', 'debit');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."payment_method_citizens_status_enum" AS ENUM ('active', 'blocked');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "payment_method_citizens" ADD COLUMN IF NOT EXISTS "balance" numeric(12,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method_citizens" ADD COLUMN IF NOT EXISTS "type" "public"."payment_method_citizens_type_enum" NOT NULL DEFAULT 'prepaid'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method_citizens" ADD COLUMN IF NOT EXISTS "status" "public"."payment_method_citizens_status_enum" NOT NULL DEFAULT 'active'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method_citizens" ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method_citizens" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."histories_eventtype_enum" AS ENUM ('boarding', 'alighting');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "histories" ADD COLUMN IF NOT EXISTS "eventType" "public"."histories_eventtype_enum" NOT NULL DEFAULT 'boarding'`,
    );
    await queryRunner.query(
      `ALTER TABLE "histories" ADD COLUMN IF NOT EXISTS "eventTimestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."schedulers_status_enum" AS ENUM ('programado', 'cancelado', 'completado');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "schedulers" ADD COLUMN IF NOT EXISTS "date" date NOT NULL DEFAULT CURRENT_DATE`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedulers" ADD COLUMN IF NOT EXISTS "status" "public"."schedulers_status_enum" NOT NULL DEFAULT 'programado'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "schedulers" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`ALTER TABLE "schedulers" DROP COLUMN IF EXISTS "date"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."schedulers_status_enum"`);

    await queryRunner.query(`ALTER TABLE "histories" DROP COLUMN IF EXISTS "eventTimestamp"`);
    await queryRunner.query(`ALTER TABLE "histories" DROP COLUMN IF EXISTS "eventType"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."histories_eventtype_enum"`);

    await queryRunner.query(
      `ALTER TABLE "payment_method_citizens" DROP COLUMN IF EXISTS "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method_citizens" DROP COLUMN IF EXISTS "lastUsedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method_citizens" DROP COLUMN IF EXISTS "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method_citizens" DROP COLUMN IF EXISTS "type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method_citizens" DROP COLUMN IF EXISTS "balance"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."payment_method_citizens_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."payment_method_citizens_type_enum"`,
    );

    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN IF EXISTS "boardedAt"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN IF EXISTS "appliedRate"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."tickets_status_enum"`);
  }
}
