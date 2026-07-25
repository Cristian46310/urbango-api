import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Catálogo fijo de métodos de pago (sin QR por ahora):
 * - CASH: efectivo
 * - SYSTEM_CARD: tarjeta prepago del sistema (recargable)
 * - EXTERNAL_CARD: tarjeta crédito/débito externa (no saldo en sistema)
 */
export class SeedPaymentMethods1782400000000 implements MigrationInterface {
  name = 'SeedPaymentMethods1782400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payment_methods"
      ADD COLUMN IF NOT EXISTS "code" character varying(32)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_payment_methods_code"
      ON "payment_methods" ("code")
    `);

    await queryRunner.query(`
      INSERT INTO "payment_methods" ("id", "name", "isRechargeable", "code", "createdAt")
      SELECT uuid_generate_v4(), 'Efectivo', false, 'CASH', now()
      WHERE NOT EXISTS (
        SELECT 1 FROM "payment_methods" WHERE "code" = 'CASH'
      )
    `);

    await queryRunner.query(`
      INSERT INTO "payment_methods" ("id", "name", "isRechargeable", "code", "createdAt")
      SELECT uuid_generate_v4(), 'Tarjeta del sistema', true, 'SYSTEM_CARD', now()
      WHERE NOT EXISTS (
        SELECT 1 FROM "payment_methods" WHERE "code" = 'SYSTEM_CARD'
      )
    `);

    await queryRunner.query(`
      INSERT INTO "payment_methods" ("id", "name", "isRechargeable", "code", "createdAt")
      SELECT uuid_generate_v4(), 'Tarjeta crédito/débito', false, 'EXTERNAL_CARD', now()
      WHERE NOT EXISTS (
        SELECT 1 FROM "payment_methods" WHERE "code" = 'EXTERNAL_CARD'
      )
    `);

    // Si ya había un método recargable sin code, alinearlo al catálogo.
    await queryRunner.query(`
      UPDATE "payment_methods"
      SET "code" = 'SYSTEM_CARD',
          "name" = COALESCE(NULLIF(TRIM("name"), ''), 'Tarjeta del sistema'),
          "isRechargeable" = true
      WHERE "isRechargeable" = true
        AND "code" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM "payment_methods" pm2 WHERE pm2."code" = 'SYSTEM_CARD'
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "payment_methods"
      WHERE "code" IN ('CASH', 'SYSTEM_CARD', 'EXTERNAL_CARD')
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_payment_methods_code"
    `);

    await queryRunner.query(`
      ALTER TABLE "payment_methods" DROP COLUMN IF EXISTS "code"
    `);
  }
}
