import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRouteCreationFields1779070000000
  implements MigrationInterface
{
  name = 'AddRouteCreationFields1779070000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "routes" ADD COLUMN IF NOT EXISTS "code" character varying`,
    );
    await queryRunner.query(`
      WITH numbered_routes AS (
        SELECT
          "id",
          ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS route_number
        FROM "routes"
        WHERE "code" IS NULL
      )
      UPDATE "routes" route
      SET "code" = 'RUT-' || LPAD(numbered_routes.route_number::text, 3, '0')
      FROM numbered_routes
      WHERE route."id" = numbered_routes."id"
    `);
    await queryRunner.query(
      `ALTER TABLE "routes" ALTER COLUMN "code" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_routes_code" ON "routes" ("code")`,
    );

    await queryRunner.query(
      `ALTER TABLE "nodes" ADD COLUMN IF NOT EXISTS "distance_from_previous" numeric(8,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "nodes" ADD COLUMN IF NOT EXISTS "estimated_time_minutes" integer NOT NULL DEFAULT 0`,
    );

    await queryRunner.query(
      `ALTER TABLE "stops" ADD COLUMN IF NOT EXISTS "latitude" numeric(10,7)`,
    );
    await queryRunner.query(
      `ALTER TABLE "stops" ADD COLUMN IF NOT EXISTS "longitude" numeric(10,7)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stops" DROP COLUMN IF EXISTS "longitude"`);
    await queryRunner.query(`ALTER TABLE "stops" DROP COLUMN IF EXISTS "latitude"`);

    await queryRunner.query(
      `ALTER TABLE "nodes" DROP COLUMN IF EXISTS "estimated_time_minutes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nodes" DROP COLUMN IF EXISTS "distance_from_previous"`,
    );

    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_routes_code"`);
    await queryRunner.query(`ALTER TABLE "routes" DROP COLUMN IF EXISTS "code"`);
  }
}
