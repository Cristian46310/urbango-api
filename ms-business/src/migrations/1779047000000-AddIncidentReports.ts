import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIncidentReports1779047000000 implements MigrationInterface {
  name = 'AddIncidentReports1779047000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "enterprises" ADD "supervisorEmail" character varying`,
    );
    await queryRunner.query(
      `CREATE TABLE "gps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "latitude" numeric(10,7) NOT NULL, "longitude" numeric(10,7) NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE, "busId" uuid, CONSTRAINT "REL_88bdd7a7e62f9f607a627fd407" UNIQUE ("busId"), CONSTRAINT "PK_9f6ec4e93a7c796933c4f4dbe06" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "incidents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(32) NOT NULL, "severity" character varying(16) NOT NULL, "description" text NOT NULL, "latitude" numeric(10,7), "longitude" numeric(10,7), "status" character varying(24) NOT NULL DEFAULT 'reported', "reportedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "turnId" uuid, "driverId" uuid, "enterpriseId" uuid, CONSTRAINT "PK_37ec1150b9edc6924f836977667" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "incident_buses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isPrimary" boolean NOT NULL DEFAULT true, "incidentId" uuid, "busId" uuid, CONSTRAINT "PK_a1c877f3e7ad68bfb552489a2e4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "incident_photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "path" character varying NOT NULL, "publicUrl" character varying, "originalName" character varying, "mimeType" character varying, "size" integer, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "incidentBusId" uuid, CONSTRAINT "PK_c149cf6852264f8af2afbe08e4f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "gps" ADD CONSTRAINT "FK_88bdd7a7e62f9f607a627fd407f" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" ADD CONSTRAINT "FK_b7696086c7607ebf108f5f036aa" FOREIGN KEY ("turnId") REFERENCES "turns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" ADD CONSTRAINT "FK_9c5be1ae6fb22f909d7caf66f19" FOREIGN KEY ("driverId") REFERENCES "persons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" ADD CONSTRAINT "FK_3ba8bdaff92d43ba997db8dc614" FOREIGN KEY ("enterpriseId") REFERENCES "enterprises"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_buses" ADD CONSTRAINT "FK_30c7ecfc58ae0b219bdf306590a" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_buses" ADD CONSTRAINT "FK_8f049a2e1bd8f0f050d7080a68d" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_photos" ADD CONSTRAINT "FK_2143d3a0256482198e596929204" FOREIGN KEY ("incidentBusId") REFERENCES "incident_buses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "incident_photos" DROP CONSTRAINT "FK_2143d3a0256482198e596929204"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_buses" DROP CONSTRAINT "FK_8f049a2e1bd8f0f050d7080a68d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_buses" DROP CONSTRAINT "FK_30c7ecfc58ae0b219bdf306590a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" DROP CONSTRAINT "FK_3ba8bdaff92d43ba997db8dc614"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" DROP CONSTRAINT "FK_9c5be1ae6fb22f909d7caf66f19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" DROP CONSTRAINT "FK_b7696086c7607ebf108f5f036aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gps" DROP CONSTRAINT "FK_88bdd7a7e62f9f607a627fd407f"`,
    );
    await queryRunner.query(`DROP TABLE "incident_photos"`);
    await queryRunner.query(`DROP TABLE "incident_buses"`);
    await queryRunner.query(`DROP TABLE "incidents"`);
    await queryRunner.query(`DROP TABLE "gps"`);
    await queryRunner.query(`ALTER TABLE "enterprises" DROP COLUMN "supervisorEmail"`);
  }
}
