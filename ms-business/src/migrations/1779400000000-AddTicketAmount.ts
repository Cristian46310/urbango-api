import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTicketAmount1779400000000 implements MigrationInterface {
  name = 'AddTicketAmount1779400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD "amount" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `UPDATE tickets t
       SET amount = r.price
       FROM schedulers s
       JOIN routes r ON r.id = s.route_id
       WHERE t."schedulerId" = s.id AND t.amount = 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ALTER COLUMN "amount" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "amount"`);
  }
}
