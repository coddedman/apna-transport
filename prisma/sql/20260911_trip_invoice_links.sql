-- Additive upgrade for installations managed with prisma db push.
-- Existing invoices remain unlinked; do not infer historical trip allocations.
ALTER TABLE "PartyBill" ADD COLUMN IF NOT EXISTS "tripLinked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "partyBillId" TEXT;
CREATE INDEX IF NOT EXISTS "Trip_partyBillId_idx" ON "Trip"("partyBillId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Trip_partyBillId_fkey') THEN
    ALTER TABLE "Trip" ADD CONSTRAINT "Trip_partyBillId_fkey"
      FOREIGN KEY ("partyBillId") REFERENCES "PartyBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
