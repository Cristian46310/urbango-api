import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Schema hardening: DM pair uniqueness, performance indexes.
 * Also ensures uuid-ossp exists for DBs that already ran InitDirectMessages
 * before the extension was added to that migration.
 */
export class SchemaHardening1749571800000 implements MigrationInterface {
  name = 'SchemaHardening1749571800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "direct_pair_key" character varying(130)`,
    );

    // Backfill existing direct conversations (ordered pair of the two members)
    await queryRunner.query(`
      UPDATE "conversations" c
      SET "direct_pair_key" = sub.pair_key
      FROM (
        SELECT
          cm.conversation_id,
          LEAST(MIN(cm.user_id), MAX(cm.user_id)) || ':' || GREATEST(MIN(cm.user_id), MAX(cm.user_id)) AS pair_key
        FROM "conversation_members" cm
        INNER JOIN "conversations" conv ON conv.id = cm.conversation_id
        WHERE conv.type = 'direct'
        GROUP BY cm.conversation_id
        HAVING COUNT(*) = 2
      ) sub
      WHERE c.id = sub.conversation_id
        AND c."direct_pair_key" IS NULL
    `);

    // Drop duplicate direct conversations keeping the oldest per pair
    await queryRunner.query(`
      DELETE FROM "conversations" c
      USING "conversations" c2
      WHERE c.type = 'direct'
        AND c2.type = 'direct'
        AND c."direct_pair_key" IS NOT NULL
        AND c."direct_pair_key" = c2."direct_pair_key"
        AND c."createdAt" > c2."createdAt"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_conversations_direct_pair_key"
      ON "conversations" ("direct_pair_key")
      WHERE "direct_pair_key" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_messages_conversation_created"
      ON "messages" ("conversation_id", "createdAt" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_messages_deleted_at"
      ON "messages" ("deleted_at")
      WHERE "deleted_at" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_group_members_left_at"
      ON "group_members" ("group_id")
      WHERE "left_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_mass_alerts_status_scheduled"
      ON "mass_alerts" ("status", "scheduled_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_mass_alerts_status_scheduled"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_group_members_left_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_messages_deleted_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_messages_conversation_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_conversations_direct_pair_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP COLUMN IF EXISTS "direct_pair_key"`,
    );
  }
}
