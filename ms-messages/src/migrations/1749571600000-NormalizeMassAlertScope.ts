import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeMassAlertScope1749571600000 implements MigrationInterface {
  name = 'NormalizeMassAlertScope1749571600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "mass_alert_routes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mass_alert_id" uuid NOT NULL,
        "route_id" uuid NOT NULL,
        CONSTRAINT "PK_mass_alert_routes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_mass_alert_routes_alert_route" UNIQUE ("mass_alert_id", "route_id")
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "mass_alert_zones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mass_alert_id" uuid NOT NULL,
        "zone_name" character varying(128) NOT NULL,
        CONSTRAINT "PK_mass_alert_zones" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_mass_alert_zones_alert_zone" UNIQUE ("mass_alert_id", "zone_name")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "mass_alert_routes" ADD CONSTRAINT "FK_mass_alert_routes_alert" FOREIGN KEY ("mass_alert_id") REFERENCES "mass_alerts"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "mass_alert_zones" ADD CONSTRAINT "FK_mass_alert_zones_alert" FOREIGN KEY ("mass_alert_id") REFERENCES "mass_alerts"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_mass_alert_routes_route" ON "mass_alert_routes" ("route_id")`,
    );

    const routesTable = await queryRunner.query(`
      SELECT to_regclass('public.routes') IS NOT NULL AS exists
    `);
    if (routesTable[0]?.exists) {
      await queryRunner.query(
        `ALTER TABLE "mass_alert_routes" ADD CONSTRAINT "FK_mass_alert_routes_route" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE`,
      );
    }

    await queryRunner.query(`
      INSERT INTO "mass_alert_routes" ("mass_alert_id", "route_id")
      SELECT alert.id, route_id::uuid
      FROM "mass_alerts" alert
      CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(alert.route_ids, '[]'::jsonb)) AS route_id
      WHERE alert.scope = 'route'
    `);

    await queryRunner.query(`
      INSERT INTO "mass_alert_zones" ("mass_alert_id", "zone_name")
      SELECT alert.id, zone_name
      FROM "mass_alerts" alert
      CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(alert.zone_names, '[]'::jsonb)) AS zone_name
      WHERE alert.scope = 'zone'
    `);

    await queryRunner.query(`ALTER TABLE "mass_alerts" DROP COLUMN "route_ids"`);
    await queryRunner.query(`ALTER TABLE "mass_alerts" DROP COLUMN "zone_names"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "mass_alerts" ADD COLUMN "route_ids" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "mass_alerts" ADD COLUMN "zone_names" jsonb`,
    );

    await queryRunner.query(`
      UPDATE "mass_alerts" alert
      SET "route_ids" = COALESCE(
        (
          SELECT jsonb_agg(route.route_id::text)
          FROM "mass_alert_routes" route
          WHERE route.mass_alert_id = alert.id
        ),
        '[]'::jsonb
      )
      WHERE alert.scope = 'route'
    `);

    await queryRunner.query(`
      UPDATE "mass_alerts" alert
      SET "zone_names" = COALESCE(
        (
          SELECT jsonb_agg(zone.zone_name)
          FROM "mass_alert_zones" zone
          WHERE zone.mass_alert_id = alert.id
        ),
        '[]'::jsonb
      )
      WHERE alert.scope = 'zone'
    `);

    await queryRunner.query(
      `ALTER TABLE "mass_alert_zones" DROP CONSTRAINT "FK_mass_alert_zones_alert"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mass_alert_routes" DROP CONSTRAINT IF EXISTS "FK_mass_alert_routes_route"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mass_alert_routes" DROP CONSTRAINT "FK_mass_alert_routes_alert"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_mass_alert_routes_route"`);
    await queryRunner.query(`DROP TABLE "mass_alert_zones"`);
    await queryRunner.query(`DROP TABLE "mass_alert_routes"`);
  }
}
