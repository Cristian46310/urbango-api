import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPersonPhotoUrl1782300000000 implements MigrationInterface {
  name = 'AddPersonPhotoUrl1782300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "photo_url" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "persons" DROP COLUMN IF EXISTS "photo_url"`,
    );
  }
}
