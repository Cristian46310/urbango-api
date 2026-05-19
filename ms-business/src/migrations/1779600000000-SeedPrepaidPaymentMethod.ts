import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPrepaidPaymentMethod1779600000000 implements MigrationInterface {
  name = 'SeedPrepaidPaymentMethod1779600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "payment_methods" ("id", "name", "isRechargeable", "createdAt")
      SELECT uuid_generate_v4(), 'Tarjeta prepagada', true, now()
      WHERE NOT EXISTS (
        SELECT 1 FROM "payment_methods"
        WHERE "isRechargeable" = true
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "payment_methods"
      WHERE "name" = 'Tarjeta prepagada' AND "isRechargeable" = true
    `);
  }
}
