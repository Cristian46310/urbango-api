import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSchedulerRecurrenceFields1779080000000
  implements MigrationInterface
{
  name = 'AddSchedulerRecurrenceFields1779080000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."scheduler_recurrence_enum" AS ENUM ('none', 'weekdays', 'weekends', 'daily');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "schedulers" ADD COLUMN IF NOT EXISTS "tolerance_minutes" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedulers" ADD COLUMN IF NOT EXISTS "recurrence_type" "public"."scheduler_recurrence_enum" NOT NULL DEFAULT 'none'`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_schedulers_bus_date_time" ON "schedulers" ("bus_id", "date", "startTime", "endTime")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_schedulers_bus_date_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedulers" DROP COLUMN IF EXISTS "recurrence_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedulers" DROP COLUMN IF EXISTS "tolerance_minutes"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."scheduler_recurrence_enum"`,
    );
  }
}
