-- Proposal: status pós-aprovação + contrato anexado
ALTER TABLE "Proposal" ADD COLUMN "startedAt" TIMESTAMP(3);
ALTER TABLE "Proposal" ADD COLUMN "deliveredAt" TIMESTAMP(3);
ALTER TABLE "Proposal" ADD COLUMN "contractFileName" TEXT;
ALTER TABLE "Proposal" ADD COLUMN "contractMimeType" TEXT;
ALTER TABLE "Proposal" ADD COLUMN "contractSize" INTEGER;
ALTER TABLE "Proposal" ADD COLUMN "contractData" BYTEA;
ALTER TABLE "Proposal" ADD COLUMN "contractUploadedAt" TIMESTAMP(3);

-- Payment: parcelas de cobrança (à vista / parceladas / recorrentes)
CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "dueDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'pending',
  "paidAt" TIMESTAMP(3),
  "receiptFileName" TEXT,
  "receiptMimeType" TEXT,
  "receiptSize" INTEGER,
  "receiptData" BYTEA,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Payment_proposalId_idx" ON "Payment"("proposalId");
CREATE INDEX "Payment_companyId_idx" ON "Payment"("companyId");

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
