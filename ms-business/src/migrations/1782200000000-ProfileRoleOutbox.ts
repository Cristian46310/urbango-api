import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProfileRoleOutbox1782200000000 implements MigrationInterface {
  name = 'ProfileRoleOutbox1782200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "profile_role_outbox" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "profileId" uuid NOT NULL,
        "profileType" character varying(32) NOT NULL,
        "roleName" character varying(32) NOT NULL,
        "status" character varying(16) NOT NULL DEFAULT 'pending',
        "attempts" integer NOT NULL DEFAULT 0,
        "lastError" text,
        "nextRetryAt" TIMESTAMP WITH TIME ZONE,
        "processedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_profile_role_outbox" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_profile_role_outbox_status_retry"
      ON "profile_role_outbox" ("status", "nextRetryAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_profile_role_outbox_status_retry"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "profile_role_outbox"`);
  }
}
