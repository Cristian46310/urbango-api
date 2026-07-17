import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `delivered_at` is now set explicitly by the application at send time
 * (immediate or scheduled), not at row-insertion time, since scheduled
 * alerts defer recipient insertion until they are actually sent.
 */
export class MassAlertRecipientDeliveredAtNullable1749571900000
  implements MigrationInterface
{
  name = 'MassAlertRecipientDeliveredAtNullable1749571900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "mass_alert_recipients" ALTER COLUMN "delivered_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "mass_alert_recipients" ALTER COLUMN "delivered_at" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "mass_alert_recipients" ALTER COLUMN "delivered_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `UPDATE "mass_alert_recipients" SET "delivered_at" = now() WHERE "delivered_at" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "mass_alert_recipients" ALTER COLUMN "delivered_at" SET NOT NULL`,
    );
  }
}
