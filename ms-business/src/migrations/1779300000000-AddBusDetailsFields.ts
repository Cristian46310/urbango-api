import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBusDetailsFields1779300000000 implements MigrationInterface {
  name = 'AddBusDetailsFields1779300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "buses" ADD COLUMN "year" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "buses" ADD COLUMN "seatedCapacity" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "buses" ADD COLUMN "standingCapacity" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "buses" ADD COLUMN "status" varchar DEFAULT 'operativo'`,
    );
    await queryRunner.query(
      `ALTER TABLE "buses" ADD COLUMN "photoUrl" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "buses" ADD COLUMN "qrCode" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "buses" DROP COLUMN "year"`,
    );
    await queryRunner.query(
      `ALTER TABLE "buses" DROP COLUMN "seatedCapacity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "buses" DROP COLUMN "standingCapacity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "buses" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "buses" DROP COLUMN "photoUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "buses" DROP COLUMN "qrCode"`,
    );
  }
}
