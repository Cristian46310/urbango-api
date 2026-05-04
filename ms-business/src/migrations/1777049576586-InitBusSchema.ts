import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitBusSchema1777049576586 implements MigrationInterface {
  name = 'InitBusSchema1777049576586';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "stops" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "location" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ed1be877403ad3c921b07f62ca5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "routes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "price" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_76100511cdfa1d013c859f01d8b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "nodes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "stopId" uuid, "routeId" uuid, CONSTRAINT "UQ_2f85b1ccc5d6152477fd99f8177" UNIQUE ("routeId", "order"), CONSTRAINT "PK_682d6427523a0fa43d062ea03ee" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "nodes" ADD CONSTRAINT "FK_879cfa76f2c82f754af571847d7" FOREIGN KEY ("stopId") REFERENCES "stops"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "nodes" ADD CONSTRAINT "FK_e47f73dead5333c053f87d3bfef" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "nodes" DROP CONSTRAINT "FK_e47f73dead5333c053f87d3bfef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nodes" DROP CONSTRAINT "FK_879cfa76f2c82f754af571847d7"`,
    );
    await queryRunner.query(`DROP TABLE "nodes"`);
    await queryRunner.query(`DROP TABLE "routes"`);
    await queryRunner.query(`DROP TABLE "stops"`);
  }
}
