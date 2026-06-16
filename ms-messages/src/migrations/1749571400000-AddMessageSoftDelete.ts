import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessageSoftDelete1749571400000 implements MigrationInterface {
  name = 'AddMessageSoftDelete1749571400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "messages" ADD COLUMN "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "deleted_at"`);
  }
}
