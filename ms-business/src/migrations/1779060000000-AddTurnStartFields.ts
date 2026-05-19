import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTurnStartFields1779060000000 implements MigrationInterface {
  name = 'AddTurnStartFields1779060000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."turn_status_enum" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(
      `ALTER TABLE "turns" ADD COLUMN IF NOT EXISTS "actual_start_time" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "turns" ADD COLUMN IF NOT EXISTS "bus_status" character varying(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "turns" ADD COLUMN IF NOT EXISTS "bus_observations" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "turns" ADD COLUMN IF NOT EXISTS "gps_activated_at" TIMESTAMP WITH TIME ZONE`,
    );

    await queryRunner.query(
      `ALTER TABLE "turns" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(`
      UPDATE "turns"
      SET "status" = CASE
        WHEN "status" IN ('in_progress', 'completed', 'cancelled', 'scheduled') THEN "status"
        WHEN "status" IN ('active', 'en curso', 'en_curso') THEN 'in_progress'
        WHEN "status" IN ('done', 'finished', 'finalizado') THEN 'completed'
        WHEN "status" IN ('canceled', 'cancelado') THEN 'cancelled'
        ELSE 'scheduled'
      END
      WHERE "status" IS NULL
        OR "status" NOT IN ('scheduled', 'in_progress', 'completed', 'cancelled')
    `);
    await queryRunner.query(
      `ALTER TABLE "turns" ALTER COLUMN "status" SET NOT NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE "turns"
      ALTER COLUMN "status" TYPE "public"."turn_status_enum"
      USING "status"::"public"."turn_status_enum"
    `);
    await queryRunner.query(
      `ALTER TABLE "turns" ALTER COLUMN "status" SET DEFAULT 'scheduled'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "turns" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(`
      ALTER TABLE "turns"
      ALTER COLUMN "status" TYPE character varying(64)
      USING "status"::text
    `);
    await queryRunner.query(
      `ALTER TABLE "turns" ALTER COLUMN "status" DROP NOT NULL`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."turn_status_enum"`);

    await queryRunner.query(
      `ALTER TABLE "turns" DROP COLUMN IF EXISTS "gps_activated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "turns" DROP COLUMN IF EXISTS "bus_observations"`,
    );
    await queryRunner.query(
      `ALTER TABLE "turns" DROP COLUMN IF EXISTS "bus_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "turns" DROP COLUMN IF EXISTS "actual_start_time"`,
    );
  }
}
