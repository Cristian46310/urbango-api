import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds user_id link to persons (superseded by PersonUserIdDropMappings rename).
 * Do not use migration:generate for broad schema sync — it produced destructive
 * diffs (stops lat/lng type change, dropped FKs, etc.).
 */
export class AddMongoUserIdToPersons1779139255606 implements MigrationInterface {
  name = 'AddMongoUserIdToPersons1779139255606';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "persons" ADD "mongoUserId" character varying`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_persons_mongoUserId" ON "persons" ("mongoUserId") WHERE "mongoUserId" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_persons_mongoUserId"`);
    await queryRunner.query(`ALTER TABLE "persons" DROP COLUMN "mongoUserId"`);
  }
}
