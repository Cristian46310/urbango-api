import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitDirectMessages1749571200000 implements MigrationInterface {
  name = 'InitDirectMessages1749571200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."conversations_type_enum" AS ENUM('direct')`,
    );
    await queryRunner.query(
      `CREATE TABLE "conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."conversations_type_enum" NOT NULL DEFAULT 'direct',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversations" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "conversation_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "conversation_id" uuid NOT NULL,
        "user_id" character varying(64) NOT NULL,
        "joinedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversation_members" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_conversation_members_unique" ON "conversation_members" ("conversation_id", "user_id")`,
    );
    await queryRunner.query(
      `CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "conversation_id" uuid NOT NULL,
        "sender_id" character varying(64) NOT NULL,
        "body" character varying(500) NOT NULL,
        "latitude" numeric(10,7),
        "longitude" numeric(10,7),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "message_read_receipts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "message_id" uuid NOT NULL,
        "user_id" character varying(64) NOT NULL,
        "readAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_message_read_receipts" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_message_read_receipts_unique" ON "message_read_receipts" ("message_id", "user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_members" ADD CONSTRAINT "FK_conversation_members_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_read_receipts" ADD CONSTRAINT "FK_message_read_receipts_message" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message_read_receipts" DROP CONSTRAINT "FK_message_read_receipts_message"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_conversation"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_members" DROP CONSTRAINT "FK_conversation_members_conversation"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_message_read_receipts_unique"`);
    await queryRunner.query(`DROP TABLE "message_read_receipts"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_conversation_members_unique"`);
    await queryRunner.query(`DROP TABLE "conversation_members"`);
    await queryRunner.query(`DROP TABLE "conversations"`);
    await queryRunner.query(`DROP TYPE "public"."conversations_type_enum"`);
  }
}
