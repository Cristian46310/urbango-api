import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReviewSchemaHardening1782000000000 implements MigrationInterface {
  name = 'ReviewSchemaHardening1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Bus↔GPS: keep ownership on gps.busId; drop redundant buses.gps_id
    await queryRunner.query(
      `ALTER TABLE "buses" DROP CONSTRAINT IF EXISTS "FK_82ab7d96ba98fcc0520d96f9e73"`,
    );
    await queryRunner.query(
      `ALTER TABLE "buses" DROP CONSTRAINT IF EXISTS "REL_82ab7d96ba98fcc0520d96f9e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "buses" DROP COLUMN IF EXISTS "gps_id"`,
    );

    // One photo per bus
    await queryRunner.query(`
      DELETE FROM "bus_photos" bp
      WHERE bp.id NOT IN (
        SELECT DISTINCT ON (bus_id) id FROM "bus_photos"
        WHERE bus_id IS NOT NULL
        ORDER BY bus_id, id
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_bus_photos_bus_id_unique" ON "bus_photos" ("bus_id")`,
    );

    // Profile uniqueness per security user + discriminator
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_persons_user_id_type" ON "persons" ("user_id", "type")`,
    );

    // Operational FK indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tickets_citizen_id" ON "tickets" ("citizen_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tickets_scheduler_id" ON "tickets" ("scheduler_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_histories_ticket_id" ON "histories" ("ticket_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_schedulers_bus_id" ON "schedulers" ("bus_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_turns_bus_id" ON "turns" ("busId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_turns_driver_id" ON "turns" ("driverId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pmc_citizen_id" ON "payment_method_citizens" ("citizen_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_incident_buses_bus_id" ON "incident_buses" ("bus_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_incident_buses_incident_id" ON "incident_buses" ("incident_id")`,
    );

    // Nearby stop bounding-box helper indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stops_latitude" ON "stops" ("latitude")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stops_longitude" ON "stops" ("longitude")`,
    );

    // Arrival notification queue
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notification_subscriptions_pending"
       ON "notification_subscriptions" ("createdAt")
       WHERE "notifiedAt" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notification_subscriptions_pending"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stops_longitude"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stops_latitude"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_incident_buses_incident_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_incident_buses_bus_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pmc_citizen_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_turns_driver_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_turns_bus_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_schedulers_bus_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_histories_ticket_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tickets_scheduler_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tickets_citizen_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_persons_user_id_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bus_photos_bus_id_unique"`);

    await queryRunner.query(`ALTER TABLE "buses" ADD COLUMN IF NOT EXISTS "gps_id" uuid`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "REL_82ab7d96ba98fcc0520d96f9e7" ON "buses" ("gps_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "buses" ADD CONSTRAINT "FK_82ab7d96ba98fcc0520d96f9e73"
       FOREIGN KEY ("gps_id") REFERENCES "gps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
