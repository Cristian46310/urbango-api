import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitGroups1749571300000 implements MigrationInterface {
  name = 'InitGroups1749571300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."conversations_type_enum" ADD VALUE IF NOT EXISTS 'group'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."groups_visibility_enum" AS ENUM('public', 'private')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."group_members_role_enum" AS ENUM('admin', 'member')`,
    );
    await queryRunner.query(
      `CREATE TABLE "groups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" character varying(500),
        "visibility" "public"."groups_visibility_enum" NOT NULL DEFAULT 'public',
        "icon_url" character varying(2048),
        "created_by" character varying(64) NOT NULL,
        "conversation_id" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_groups" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_groups_conversation" UNIQUE ("conversation_id")
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "group_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "group_id" uuid NOT NULL,
        "user_id" character varying(64) NOT NULL,
        "role" "public"."group_members_role_enum" NOT NULL DEFAULT 'member',
        "joinedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_group_members" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_group_members_unique" ON "group_members" ("group_id", "user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" ADD CONSTRAINT "FK_groups_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD CONSTRAINT "FK_group_members_group" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "group_members" DROP CONSTRAINT "FK_group_members_group"`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" DROP CONSTRAINT "FK_groups_conversation"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_group_members_unique"`);
    await queryRunner.query(`DROP TABLE "group_members"`);
    await queryRunner.query(`DROP TABLE "groups"`);
    await queryRunner.query(`DROP TYPE "public"."group_members_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."groups_visibility_enum"`);
  }
}
