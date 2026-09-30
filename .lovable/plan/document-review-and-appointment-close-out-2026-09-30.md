# Document review and appointment close-out

## What Claire and clients will get
1. **Upload checks (client page):** PDF/JPG/PNG/HEIC only, 15 MB max, no empty files, no password-protected PDFs, images at least 1000px on the short side. Friendly error for each case.
2. **AI check after upload:** confirms it is the right form, the right tax year (the year before the appointment) and the client's name. A warning shows on the item with "Replace file" and "Keep this file". It never blocks the client.
3. **Claire's review (appointment window):** each file shows the AI result, plus "Accept" and "Needs a fix". "Needs a fix" offers reason chips and an optional note, then emails the client right away. The client page shows "Needs a fix" with a Replace button, and a new upload puts the file back in review. Files marked "Needs a fix" do not count toward the Ready score.
4. **Needs you:** a "N documents to review" row opens the first appointment with files waiting.
5. **Video link:** a new field in Settings > Integrations. The client page's "Join call" button and the 24-hour reminder both use it. If it's empty, the client page says "Claire will send the link by email".
6. **Finish appointment** replaces "Mark complete". It asks for the final fee (prefilled with the service price) and an optional note, then emails the client "Review, sign and pay".
7. **Client page "Review, sign and pay" step:** shows the fee, Claire's note, the Form 8879 signature, then payment. Also shows "Your return is filed as soon as it's signed and paid."
8. **Payment:** Stripe isn't turned on for this project yet, so a clearly labeled "Test payment" button marks it paid. The code switches to Stripe Checkout once payments are enabled. The appointment window gets a Paid/Unpaid tag with the amount, and "Paid in office" with a confirm step.
9. **Ready to file (Today):** "Mark filed" asks for confirmation, then emails "Your return has been e-filed". It stays disabled, with a one-line reason, until the return is signed and paid.
10. **Payment reminders** go out 1, 3 and 5 days after finishing, each sent only once. After 5 days the appointment appears in Needs you with "Send reminder".
11. **Report** adds "Collected this month" and "Waiting for payment".
12. **Full owner and client test** at 390px and 1440px, then reset the demo data and report.

## Assumptions
- AI reads PDF/JPG/PNG directly. HEIC files are accepted but marked "unreadable" for the AI check, so Claire reviews them herself.
- The password and image-size checks run in the browser before upload. The server also re-checks size and type.
- Stripe Checkout itself is not built yet (not enabled). The test payment covers the flow end to end.

## Technical details
- Migration: `checklist_items` gets `ai_check`, `ai_note`, `review_status` (pending/accepted/needs_fix), `fix_reason`, `fix_note`. `appointments` gets `fee_cents`, `client_note`, `paid_at`, `paid_method`, `filed_at`. `settings` gets `video_link`. New enum values: `payment_reminder`, `doc_fix_request`, `review_sign_pay`, `return_filed`. Update `compute_ready_score` to exclude needs_fix. Snapshot functions already copy whole rows, so they keep working. Re-take the snapshot at the end.
- AI check runs in `portal.functions.ts` after `confirmUpload`. It downloads the file with the admin client and sends it to the Lovable AI gateway (Gemini, structured output).
- New owner server functions: `reviewDocument`, `finishAppointment` (replaces markComplete in the UI), `markPaidInOffice`, `markFiled`, `sendPaymentReminder`, `saveVideoLink`. Portal: `testPay`.
- Automations: payment reminders with dedupe keys `pay:{id}:{1|3|5}`. The 24h reminder includes the video link.
