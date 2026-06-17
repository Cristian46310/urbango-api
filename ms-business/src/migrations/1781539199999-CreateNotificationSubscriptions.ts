import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationSubscriptions1781539199999 implements MigrationInterface {
  name = 'CreateNotificationSubscriptions1781539199999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "notification_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "routeId" character varying, "busId" character varying, "stopId" character varying, "anticipationMinutes" integer NOT NULL DEFAULT '10', "message" text, "notifiedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4c82f6ddf4a49a86a7f9f54a1a8" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notification_subscriptions"`);
  }
}
