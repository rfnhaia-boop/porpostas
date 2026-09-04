-- Service vira item de catálogo (serviço ou produto)
ALTER TABLE "Service" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'service';
ALTER TABLE "Service" ADD COLUMN "unitLabel" TEXT NOT NULL DEFAULT 'projeto';
ALTER TABLE "Service" ADD COLUMN "details" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Service" ADD COLUMN "defaultTimeline" TEXT NOT NULL DEFAULT '';

-- ProposalItem ganha quantidade e unidade
ALTER TABLE "ProposalItem" ADD COLUMN "details" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ProposalItem" ADD COLUMN "unitLabel" TEXT NOT NULL DEFAULT 'un';
ALTER TABLE "ProposalItem" ADD COLUMN "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1;
ALTER TABLE "ProposalItem" ADD COLUMN "unitPrice" INTEGER NOT NULL DEFAULT 0;
UPDATE "ProposalItem" SET "unitPrice" = "price";
