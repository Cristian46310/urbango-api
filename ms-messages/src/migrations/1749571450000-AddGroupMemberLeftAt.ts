import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupMemberLeftAt1749571450000 implements MigrationInterface {
  name = 'AddGroupMemberLeftAt1749571450000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD COLUMN "left_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "group_members" DROP COLUMN "left_at"`,
    );
  }
}
