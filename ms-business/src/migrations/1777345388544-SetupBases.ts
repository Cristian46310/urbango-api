import { MigrationInterface, QueryRunner } from "typeorm";

export class SetupBases1777345388544 implements MigrationInterface {
    name = 'SetupBases1777345388544'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "address" character varying(512) NOT NULL, "city" character varying(128) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "enterprises" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "nit" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_700c1b4abe98de93b7c5a7ce135" UNIQUE ("nit"), CONSTRAINT "PK_a019e9afe6517b4f2a4588f2cce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "persons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "document" character varying NOT NULL, "email" character varying, "phone" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "licenseNumber" character varying, "licenseExpiry" date, "extraInfo" character varying, "type" character varying NOT NULL, "addressId" uuid, CONSTRAINT "UQ_b791f0a870dff271a6a78392b4f" UNIQUE ("document"), CONSTRAINT "UQ_928155276ca8852f3c440cc2b2c" UNIQUE ("email"), CONSTRAINT "PK_74278d8812a049233ce41440ac7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5ea861ffbae6a10496304bff37" ON "persons" ("type") `);
        await queryRunner.query(`CREATE TABLE "turns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "startTime" TIMESTAMP WITH TIME ZONE NOT NULL, "endTime" TIMESTAMP WITH TIME ZONE, "status" character varying(64), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "busId" uuid, "driverId" uuid, CONSTRAINT "PK_66edaea493f45e3c39d7c3553ed" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "schedulers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "startTime" TIMESTAMP WITH TIME ZONE NOT NULL, "endTime" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "bus_id" uuid NOT NULL, "route_id" uuid NOT NULL, CONSTRAINT "PK_3e70c13153c58b629cd91dda7b2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "buses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "color" character varying, "model" character varying, "plate" character varying NOT NULL, "capacity" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "enterpriseId" uuid, CONSTRAINT "UQ_1da765de924476580123f727ae3" UNIQUE ("plate"), CONSTRAINT "PK_ddebc0eeba64a019ae072975947" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payment_methods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(128) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_34f9b8c6dfb4ac3559f7e2820d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payment_method_citizens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "citizen_id" uuid NOT NULL, "payment_method_id" uuid NOT NULL, CONSTRAINT "PK_e505c46036f39dc1c64cade7280" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "histories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" integer NOT NULL, "latitude" numeric, "longitude" numeric, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "nodeId" uuid, "ticketId" uuid, CONSTRAINT "PK_36b0e707452a8b674f9d95da743" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_384effccbd5b0f88bc5f9943ba" ON "histories" ("ticketId", "order") `);
        await queryRunner.query(`CREATE TABLE "tickets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "buyedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "citizenId" uuid, "paymentMethodCitizenId" uuid, "schedulerId" uuid, CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "persons" ADD CONSTRAINT "FK_beed5a6d7f1827d0564e49285aa" FOREIGN KEY ("addressId") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "turns" ADD CONSTRAINT "FK_81073ae4f8411ca3d978eff0b6a" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "turns" ADD CONSTRAINT "FK_ff57fc62c4e3dad9445581dc5d0" FOREIGN KEY ("driverId") REFERENCES "persons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "schedulers" ADD CONSTRAINT "FK_d6ddf863200804d5b2441224cf8" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "schedulers" ADD CONSTRAINT "FK_882ce6dbec070883b49c26e9daf" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "buses" ADD CONSTRAINT "FK_8af911618ea2fabc2cef2366829" FOREIGN KEY ("enterpriseId") REFERENCES "enterprises"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_method_citizens" ADD CONSTRAINT "FK_e65bdb7b3b6e8e07389c63275b3" FOREIGN KEY ("citizen_id") REFERENCES "persons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_method_citizens" ADD CONSTRAINT "FK_e82e9cb9f7e4807625da1502f05" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "histories" ADD CONSTRAINT "FK_7713b9f383f299baa5c78618076" FOREIGN KEY ("nodeId") REFERENCES "nodes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "histories" ADD CONSTRAINT "FK_0a02148994e800301d0141eb1a1" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_84f73183b448dc14893f2a5b496" FOREIGN KEY ("citizenId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_e245f9f6ec715e1f80fde04b9c4" FOREIGN KEY ("paymentMethodCitizenId") REFERENCES "payment_method_citizens"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_a27a84450edc358d002c2c160a5" FOREIGN KEY ("schedulerId") REFERENCES "schedulers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "FK_a27a84450edc358d002c2c160a5"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "FK_e245f9f6ec715e1f80fde04b9c4"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "FK_84f73183b448dc14893f2a5b496"`);
        await queryRunner.query(`ALTER TABLE "histories" DROP CONSTRAINT "FK_0a02148994e800301d0141eb1a1"`);
        await queryRunner.query(`ALTER TABLE "histories" DROP CONSTRAINT "FK_7713b9f383f299baa5c78618076"`);
        await queryRunner.query(`ALTER TABLE "payment_method_citizens" DROP CONSTRAINT "FK_e82e9cb9f7e4807625da1502f05"`);
        await queryRunner.query(`ALTER TABLE "payment_method_citizens" DROP CONSTRAINT "FK_e65bdb7b3b6e8e07389c63275b3"`);
        await queryRunner.query(`ALTER TABLE "buses" DROP CONSTRAINT "FK_8af911618ea2fabc2cef2366829"`);
        await queryRunner.query(`ALTER TABLE "schedulers" DROP CONSTRAINT "FK_882ce6dbec070883b49c26e9daf"`);
        await queryRunner.query(`ALTER TABLE "schedulers" DROP CONSTRAINT "FK_d6ddf863200804d5b2441224cf8"`);
        await queryRunner.query(`ALTER TABLE "turns" DROP CONSTRAINT "FK_ff57fc62c4e3dad9445581dc5d0"`);
        await queryRunner.query(`ALTER TABLE "turns" DROP CONSTRAINT "FK_81073ae4f8411ca3d978eff0b6a"`);
        await queryRunner.query(`ALTER TABLE "persons" DROP CONSTRAINT "FK_beed5a6d7f1827d0564e49285aa"`);
        await queryRunner.query(`DROP TABLE "tickets"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_384effccbd5b0f88bc5f9943ba"`);
        await queryRunner.query(`DROP TABLE "histories"`);
        await queryRunner.query(`DROP TABLE "payment_method_citizens"`);
        await queryRunner.query(`DROP TABLE "payment_methods"`);
        await queryRunner.query(`DROP TABLE "buses"`);
        await queryRunner.query(`DROP TABLE "schedulers"`);
        await queryRunner.query(`DROP TABLE "turns"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5ea861ffbae6a10496304bff37"`);
        await queryRunner.query(`DROP TABLE "persons"`);
        await queryRunner.query(`DROP TABLE "enterprises"`);
        await queryRunner.query(`DROP TABLE "addresses"`);
    }

}
