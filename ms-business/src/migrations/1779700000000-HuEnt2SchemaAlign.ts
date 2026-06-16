import { MigrationInterface, QueryRunner } from 'typeorm';

export class HuEnt2SchemaAlign1779700000000 implements MigrationInterface {
  name = 'HuEnt2SchemaAlign1779700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."history_event_type_enum" AS ENUM('boarding', 'alighting')`,
    );

    await queryRunner.query(
      `ALTER TABLE "turns" ADD "actualStartTime" TIMESTAMP WITH TIME ZONE`,
    );

    await queryRunner.query(
      `ALTER TABLE "tickets" ADD "boardedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD "completedAt" TIMESTAMP WITH TIME ZONE`,
    );

    await queryRunner.query(
      `ALTER TABLE "histories" ADD "eventType" "public"."history_event_type_enum" NOT NULL DEFAULT 'boarding'`,
    );
    await queryRunner.query(
      `ALTER TABLE "histories" ALTER COLUMN "eventType" DROP DEFAULT`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_862e3797c983b48648079f2bfc"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_862e3797c983b48648079f2bfc" ON "histories" ("ticket_id", "node_id", "eventType")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_862e3797c983b48648079f2bfc"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_862e3797c983b48648079f2bfc" ON "histories" ("ticket_id", "node_id")`,
    );

    await queryRunner.query(`ALTER TABLE "histories" DROP COLUMN "eventType"`);
    await queryRunner.query(`DROP TYPE "public"."history_event_type_enum"`);

    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "completedAt"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "boardedAt"`);

    await queryRunner.query(
      `ALTER TABLE "turns" DROP COLUMN "actualStartTime"`,
    );
  }
}
