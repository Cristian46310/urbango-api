import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrepaidCardRecharge1779500000000 implements MigrationInterface {
  name = 'AddPrepaidCardRecharge1779500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_methods" ADD "isRechargeable" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method_citizens" ADD "balance" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method_citizens" ADD "cardNumber" character varying(32)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method_citizens" ADD CONSTRAINT "UQ_payment_method_citizens_cardNumber" UNIQUE ("cardNumber")`,
    );

    await queryRunner.query(`
      CREATE TYPE "card_recharge_transactions_status_enum" AS ENUM(
        'pending', 'approved', 'rejected', 'failed', 'cancelled'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "card_recharge_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reference" character varying(64) NOT NULL,
        "amount" integer NOT NULL,
        "feeAmount" integer NOT NULL DEFAULT 0,
        "totalAmount" integer NOT NULL,
        "status" "card_recharge_transactions_status_enum" NOT NULL DEFAULT 'pending',
        "epaycoRefPayco" character varying(128),
        "epaycoTransactionId" character varying(128),
        "epaycoResponse" character varying(64),
        "description" character varying(256) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "paymentMethodCitizenId" uuid NOT NULL,
        "citizenId" uuid NOT NULL,
        CONSTRAINT "UQ_card_recharge_transactions_reference" UNIQUE ("reference"),
        CONSTRAINT "PK_card_recharge_transactions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "card_recharge_transactions"
      ADD CONSTRAINT "FK_card_recharge_transactions_pmc"
      FOREIGN KEY ("paymentMethodCitizenId")
      REFERENCES "payment_method_citizens"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "card_recharge_transactions"
      ADD CONSTRAINT "FK_card_recharge_transactions_citizen"
      FOREIGN KEY ("citizenId") REFERENCES "persons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_card_recharge_transactions_pmc"
      ON "card_recharge_transactions" ("paymentMethodCitizenId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "card_recharge_transactions" DROP CONSTRAINT "FK_card_recharge_transactions_citizen"`,
    );
    await queryRunner.query(
      `ALTER TABLE "card_recharge_transactions" DROP CONSTRAINT "FK_card_recharge_transactions_pmc"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_card_recharge_transactions_pmc"`);
    await queryRunner.query(`DROP TABLE "card_recharge_transactions"`);
    await queryRunner.query(
      `DROP TYPE "card_recharge_transactions_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method_citizens" DROP CONSTRAINT "UQ_payment_method_citizens_cardNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method_citizens" DROP COLUMN "cardNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method_citizens" DROP COLUMN "balance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_methods" DROP COLUMN "isRechargeable"`,
    );
  }
}
