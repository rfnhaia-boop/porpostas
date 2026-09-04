-- price/total: Float (reais) -> Int (centavos), escalando os dados existentes.
ALTER TABLE "Service" ALTER COLUMN "price" DROP DEFAULT;
ALTER TABLE "Service" ALTER COLUMN "price" TYPE INTEGER USING round("price" * 100);
ALTER TABLE "Service" ALTER COLUMN "price" SET DEFAULT 0;

ALTER TABLE "ProposalItem" ALTER COLUMN "price" DROP DEFAULT;
ALTER TABLE "ProposalItem" ALTER COLUMN "price" TYPE INTEGER USING round("price" * 100);
ALTER TABLE "ProposalItem" ALTER COLUMN "price" SET DEFAULT 0;

ALTER TABLE "Proposal" ALTER COLUMN "total" DROP DEFAULT;
ALTER TABLE "Proposal" ALTER COLUMN "total" TYPE INTEGER USING round("total" * 100);
ALTER TABLE "Proposal" ALTER COLUMN "total" SET DEFAULT 0;
