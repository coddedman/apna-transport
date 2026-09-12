# Trip-to-invoice linking

Client Billing → Unbilled Work → Build invoice → Load unbilled trips → select trips → Save invoice.

New freight invoices require explicit trip selection. The server recomputes freight and weight from trip records, compares the preview, and claims trips in a serializable transaction. A trip belongs to at most one client invoice. Toll invoices remain separate reimbursements.

Linked trip amounts and invoice periods are locked. Invoice number, incentive, due date, submission date and remarks remain editable. Deleting an unpaid invoice releases its trips. An invoice with payment records cannot be deleted until its payments are removed or reversed.

Existing freight invoices have no reliable trip allocation. The additive upgrade leaves them unlinked. Trips in their project/billing periods are excluded from the new unbilled queue and a reconciliation notice is shown. Historical linking needs a separate review flow; do not automatically infer links from trip reference numbers. Dates use inclusive UTC calendar days, matching stored invoice date fields.

## Database rollout

Apply `prisma/sql/20260911_trip_invoice_links.sql` before serving the updated app. It adds only the invoice linkage flag, nullable trip foreign key and supporting index. No records are deleted or allocated. This project uses schema push rather than a baseline migration history; the targeted SQL avoids unrelated schema drift changes.

`node scripts/apply-trip-invoice-links.cjs` loads the application's development environment and uses DIRECT_URL (or DATABASE_URL). Verify the intended database before running: local and production environment files may point to the same hosted database. The script uses a transaction and short lock timeout.

## Validation

`node --import tsx --test tests/tripBilling.test.ts`

`npx tsc --noEmit`

`npm run build`

Before release, verify on test records: claim two trips, reload the same period (claimed trips excluded), try a stale second selection (rejected), edit/delete a linked trip (rejected), delete the unpaid invoice (trips available again), and attempt deleting a paid invoice (rejected). Unit tests do not replace database concurrency testing.

Vercel now runs database preparation before building. Production applies the targeted additive SQL using deployment environment credentials; preview builds only check for the required columns. A failed preparation stops the build, preventing publication against an incompatible schema. `npm run build` remains available for compilation without database changes.
