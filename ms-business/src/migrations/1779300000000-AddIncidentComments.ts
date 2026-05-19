import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIncidentComments1779300000000 implements MigrationInterface {
  name = 'AddIncidentComments1779300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "incident_comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "text" text NOT NULL,
        "authorUserId" character varying NOT NULL,
        "authorName" character varying NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "incidentId" uuid,
        CONSTRAINT "PK_incident_comments" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_comments" ADD CONSTRAINT "FK_incident_comments_incident" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "incident_comments" DROP CONSTRAINT "FK_incident_comments_incident"`,
    );
    await queryRunner.query(`DROP TABLE "incident_comments"`);
  }
}
