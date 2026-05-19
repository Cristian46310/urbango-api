import { MigrationInterface, QueryRunner } from 'typeorm';

export class PersonUserIdDropMappings1779200000000 implements MigrationInterface {
  name = 'PersonUserIdDropMappings1779200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_id_mappings"`);

    const hasMongoUserId = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'persons' AND column_name = 'mongoUserId'
    `);

    if (hasMongoUserId.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "persons" RENAME COLUMN "mongoUserId" TO "user_id"`,
      );
      await queryRunner.query(
        `ALTER INDEX IF EXISTS "IDX_persons_mongoUserId" RENAME TO "IDX_persons_user_id"`,
      );
    } else {
      const hasUserId = await queryRunner.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'persons' AND column_name = 'user_id'
      `);

      if (hasUserId.length === 0) {
        await queryRunner.query(
          `ALTER TABLE "persons" ADD "user_id" character varying`,
        );
        await queryRunner.query(
          `CREATE UNIQUE INDEX "IDX_persons_user_id" ON "persons" ("user_id") WHERE "user_id" IS NOT NULL`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_persons_user_id"`,
    );
    await queryRunner.query(`ALTER TABLE "persons" DROP COLUMN IF EXISTS "user_id"`);

    await queryRunner.query(
      `CREATE TABLE "user_id_mappings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mongoObjectId" character varying NOT NULL,
        "postgresUuid" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_id_mappings_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_id_mappings_postgresUuid" ON "user_id_mappings" ("postgresUuid")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_id_mappings_mongoObjectId" ON "user_id_mappings" ("mongoObjectId")`,
    );
  }
}
