import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitMassAlerts1749571500000 implements MigrationInterface {
  name = 'InitMassAlerts1749571500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."mass_alerts_scope_enum" AS ENUM('all', 'route', 'zone')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."mass_alerts_status_enum" AS ENUM('scheduled', 'sent', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "mass_alerts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sender_id" character varying(64) NOT NULL,
        "title" character varying(200) NOT NULL,
        "body" character varying(2000) NOT NULL,
        "scope" "public"."mass_alerts_scope_enum" NOT NULL,
        "route_ids" jsonb,
        "zone_names" jsonb,
        "is_urgent" boolean NOT NULL DEFAULT false,
        "scheduled_at" TIMESTAMP WITH TIME ZONE,
        "status" "public"."mass_alerts_status_enum" NOT NULL DEFAULT 'scheduled',
        "recipient_count" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "sent_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_mass_alerts" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "mass_alert_recipients" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mass_alert_id" uuid NOT NULL,
        "user_id" character varying(64) NOT NULL,
        "delivered_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "read_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_mass_alert_recipients" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_mass_alert_recipients_unique" ON "mass_alert_recipients" ("mass_alert_id", "user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_mass_alert_recipients_user" ON "mass_alert_recipients" ("user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "mass_alert_recipients" ADD CONSTRAINT "FK_mass_alert_recipients_alert" FOREIGN KEY ("mass_alert_id") REFERENCES "mass_alerts"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "mass_alert_recipients" DROP CONSTRAINT "FK_mass_alert_recipients_alert"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_mass_alert_recipients_user"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_mass_alert_recipients_unique"`,
    );
    await queryRunner.query(`DROP TABLE "mass_alert_recipients"`);
    await queryRunner.query(`DROP TABLE "mass_alerts"`);
    await queryRunner.query(`DROP TYPE "public"."mass_alerts_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."mass_alerts_scope_enum"`);
  }
}
