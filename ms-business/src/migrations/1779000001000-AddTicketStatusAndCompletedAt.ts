import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTicketStatusAndCompletedAt1779000001000 implements MigrationInterface {
  name = 'AddTicketStatusAndCompletedAt1779000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tickets_status_enum" AS ENUM('active', 'completed', 'canceled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD "status" "public"."tickets_status_enum" NOT NULL DEFAULT 'active'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD "completedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tickets_status" ON "tickets" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_tickets_status"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "completedAt"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."tickets_status_enum"`);
  }
}
