import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPersonBirthDate1779090000000 implements MigrationInterface {
  name = 'AddPersonBirthDate1779090000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "birth_date" date`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "persons" DROP COLUMN IF EXISTS "birth_date"`,
    );
  }
}
