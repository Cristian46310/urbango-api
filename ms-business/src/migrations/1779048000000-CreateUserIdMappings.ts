import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserIdMappings1779048000000 implements MigrationInterface {
  name = 'CreateUserIdMappings1779048000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla user_id_mappings
    await queryRunner.query(
      `CREATE TABLE "user_id_mappings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mongoObjectId" character varying NOT NULL UNIQUE,
        "postgresUuid" character varying NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_id_mappings_id" PRIMARY KEY ("id")
      )`,
    );

    // Crear índice para búsquedas rápidas por postgresUuid
    await queryRunner.query(
      `CREATE INDEX "IDX_user_id_mappings_postgresUuid" ON "user_id_mappings" ("postgresUuid")`,
    );

    // Crear índice para búsquedas rápidas por mongoObjectId
    await queryRunner.query(
      `CREATE INDEX "IDX_user_id_mappings_mongoObjectId" ON "user_id_mappings" ("mongoObjectId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_user_id_mappings_postgresUuid"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_user_id_mappings_mongoObjectId"`,
    );

    // Eliminar tabla
    await queryRunner.query(`DROP TABLE IF EXISTS "user_id_mappings"`);
  }
}
