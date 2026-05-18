import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLatitudeLongitudeToStops1778000001000 implements MigrationInterface {
  name = 'AddLatitudeLongitudeToStops1778000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stops" ADD "latitude" numeric`);
    await queryRunner.query(`ALTER TABLE "stops" ADD "longitude" numeric`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stops" DROP COLUMN "longitude"`);
    await queryRunner.query(`ALTER TABLE "stops" DROP COLUMN "latitude"`);
  }
}
