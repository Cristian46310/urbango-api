import { MigrationInterface, QueryRunner } from 'typeorm';

export class GroupMembershipAdmin1749571700000 implements MigrationInterface {
  name = 'GroupMembershipAdmin1749571700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."group_membership_action_enum" AS ENUM(
        'joined', 'left', 'added', 'removed', 'promoted', 'demoted', 'blocked'
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "group_blocked_users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "group_id" uuid NOT NULL,
        "user_id" character varying(64) NOT NULL,
        "blocked_by" character varying(64) NOT NULL,
        "reason" character varying(500),
        "blocked_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_group_blocked_users" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_group_blocked_users_unique" ON "group_blocked_users" ("group_id", "user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_blocked_users" ADD CONSTRAINT "FK_group_blocked_users_group" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `CREATE TABLE "group_membership_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "group_id" uuid NOT NULL,
        "action" "public"."group_membership_action_enum" NOT NULL,
        "actor_user_id" character varying(64) NOT NULL,
        "target_user_id" character varying(64),
        "metadata" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_group_membership_logs" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_group_membership_logs_group_created" ON "group_membership_logs" ("group_id", "createdAt" DESC)`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_membership_logs" ADD CONSTRAINT "FK_group_membership_logs_group" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "group_membership_logs" DROP CONSTRAINT "FK_group_membership_logs_group"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_group_membership_logs_group_created"`,
    );
    await queryRunner.query(`DROP TABLE "group_membership_logs"`);
    await queryRunner.query(
      `ALTER TABLE "group_blocked_users" DROP CONSTRAINT "FK_group_blocked_users_group"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_group_blocked_users_unique"`,
    );
    await queryRunner.query(`DROP TABLE "group_blocked_users"`);
    await queryRunner.query(`DROP TYPE "public"."group_membership_action_enum"`);
  }
}
