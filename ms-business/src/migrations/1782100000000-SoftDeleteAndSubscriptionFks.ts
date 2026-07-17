import { MigrationInterface, QueryRunner } from 'typeorm';

export class SoftDeleteAndSubscriptionFks1782100000000
  implements MigrationInterface
{
  name = 'SoftDeleteAndSubscriptionFks1782100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Soft-delete columns for catalog / operational aggregates
    for (const table of [
      'enterprises',
      'buses',
      'routes',
      'stops',
      'schedulers',
      'turns',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_${table}_deletedAt" ON "${table}" ("deletedAt")`,
      );
    }

    // Clean orphan notification references before adding FKs
    await queryRunner.query(`
      UPDATE "notification_subscriptions" ns
      SET "routeId" = NULL
      WHERE "routeId" IS NOT NULL
        AND "routeId" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    `);
    await queryRunner.query(`
      UPDATE "notification_subscriptions" ns
      SET "busId" = NULL
      WHERE "busId" IS NOT NULL
        AND "busId" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    `);
    await queryRunner.query(`
      UPDATE "notification_subscriptions" ns
      SET "stopId" = NULL
      WHERE "stopId" IS NOT NULL
        AND "stopId" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    `);

    await queryRunner.query(`
      UPDATE "notification_subscriptions" ns
      SET "routeId" = NULL
      WHERE "routeId" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM "routes" r WHERE r.id::text = ns."routeId")
    `);
    await queryRunner.query(`
      UPDATE "notification_subscriptions" ns
      SET "busId" = NULL
      WHERE "busId" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM "buses" b WHERE b.id::text = ns."busId")
    `);
    await queryRunner.query(`
      UPDATE "notification_subscriptions" ns
      SET "stopId" = NULL
      WHERE "stopId" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM "stops" s WHERE s.id::text = ns."stopId")
    `);

    await queryRunner.query(
      `ALTER TABLE "notification_subscriptions" ALTER COLUMN "routeId" TYPE uuid USING NULLIF("routeId", '')::uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_subscriptions" ALTER COLUMN "busId" TYPE uuid USING NULLIF("busId", '')::uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_subscriptions" ALTER COLUMN "stopId" TYPE uuid USING NULLIF("stopId", '')::uuid`,
    );

    await queryRunner.query(`
      ALTER TABLE "notification_subscriptions"
      ADD CONSTRAINT "FK_notification_subscriptions_route"
      FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "notification_subscriptions"
      ADD CONSTRAINT "FK_notification_subscriptions_bus"
      FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "notification_subscriptions"
      ADD CONSTRAINT "FK_notification_subscriptions_stop"
      FOREIGN KEY ("stopId") REFERENCES "stops"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_subscriptions" DROP CONSTRAINT IF EXISTS "FK_notification_subscriptions_stop"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_subscriptions" DROP CONSTRAINT IF EXISTS "FK_notification_subscriptions_bus"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_subscriptions" DROP CONSTRAINT IF EXISTS "FK_notification_subscriptions_route"`,
    );

    await queryRunner.query(
      `ALTER TABLE "notification_subscriptions" ALTER COLUMN "routeId" TYPE character varying USING "routeId"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_subscriptions" ALTER COLUMN "busId" TYPE character varying USING "busId"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_subscriptions" ALTER COLUMN "stopId" TYPE character varying USING "stopId"::text`,
    );

    for (const table of [
      'turns',
      'schedulers',
      'stops',
      'routes',
      'buses',
      'enterprises',
    ]) {
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_${table}_deletedAt"`);
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "deletedAt"`,
      );
    }
  }
}
