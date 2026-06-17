import { MigrationInterface, QueryRunner } from 'typeorm';

export class DashboardRealtimeWebsocket1781539200000
  implements MigrationInterface
{
  name = 'DashboardRealtimeWebsocket1781539200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_subscriptions" ADD COLUMN IF NOT EXISTS "notifiedAt" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_subscriptions" DROP COLUMN IF EXISTS "notifiedAt"`,
    );
  }
}