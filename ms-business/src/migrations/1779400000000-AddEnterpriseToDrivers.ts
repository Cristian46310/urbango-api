import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnterpriseToDrivers1779400000000 implements MigrationInterface {
  name = 'AddEnterpriseToDrivers1779400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "persons" ADD COLUMN "enterpriseId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "persons" ADD CONSTRAINT "FK_persons_enterprise" FOREIGN KEY ("enterpriseId") REFERENCES "enterprises"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "persons" DROP CONSTRAINT "FK_persons_enterprise"`,
    );
    await queryRunner.query(
      `ALTER TABLE "persons" DROP COLUMN "enterpriseId"`,
    );
  }
}
