# tab. — episode kit

Ready-to-record writing and a repeatable demo for **Paid Apps, Rebuilt**, using your existing face-led, everyday-problem format. This pack contains a script and production instructions; it is not filmed footage or a published release. Read `docs/RELEASE-VERIFICATION.md` for the app's current verification record.

## The point of this project

**One sentence:** tab turns a restaurant receipt into individual shares based on what each person ordered, including shared dishes and extras.

**The viewer's reason to care:** someone ordered a main, someone ordered something small, and the table shared a few things. An equal split misses that. The satisfying moment is tapping several names on one dish and seeing the individual amounts resolve into one exact total.

**Who it serves:** a group settling one meal together, on one person's phone. People do not need accounts or invitations. The app calculates and prepares a summary; it does not transfer money, sync a group session, or track ongoing debts.

**Why this episode fits the series:** it makes a familiar utility tangible, demonstrates a useful implementation, and supplies MIT-licensed source for people to run and remix. Frame it as your original take on a useful app feature. No particular paid app, current price, complete replacement claim, or invented build-time claim is needed.

**Product personality:** warm thermal paper, graphite, orange, small bursts of colour when people claim items. Match the filming to that: casual delivery, real receipt prop, clean screen captures, little visual clutter. Keep the product large enough to read.

## Main episode: approximately 50–60 seconds

Delivery target: natural and lightly amused, around 140–150 words per minute. Record in short paragraphs. The times are edit targets, not a claim about how long the app takes. Use `TELEPROMPTER.txt` for the spoken words.

| Time | Say | Show / on-screen words |
| --- | --- | --- |
| 0–4s | “Your salad shouldn't cost the same as my steak.” | Face, holding a receipt. Quick cut to the **$46 ribeye** and **$10 green salad** in the app. Cover-sized words: **WHO ORDERED WHAT?** |
| 4–9s | “So I built tab: split a receipt by who ordered what.” | Brief home hero, then you at the desk. Small series marker: **PAID APPS, REBUILT · tab.** Keep any episode number unset until you choose its place in the series. |
| 9–14s | “This is a sample bill. Ten items, five people.” | Start the built-in **Try demo** flow. Retain its sample-playback label. Overlay **SAMPLE RECEIPT** on any crop that hides the label. Then the five names. |
| 14–25s | “Ribeye: me. Pasta: Maya. We shared the fries, so I tap three names. Water: everyone.” | Ribeye → You. Rigatoni → Maya. Truffle fries → You, Maya, Nina, with a beat to see **$4.00 each**. Sparkling water → Everyone. Cut over the other assignments; they are listed below. |
| 25–33s | “The important bit? Service follows what you ordered. Included tax doesn't get added twice.” | Finishing touches, service line, included-GST note. Keep **None** selected for the tip and proportional extras. This is the design decision beat; no invented debugging story is needed. |
| 33–40s | “And everyone's share adds up to exactly two hundred and twenty-five dollars fifty.” | Tap **Calculate everyone's share**. Hold the **$225.50 sorted.** result, then the names and amounts. Overlay **AUD · EVERY CENT ACCOUNTED FOR**. |
| 40–45s | “Save the card. Send it to the group. Dinner, dealt with.” | Open **Share results** and show the real generated card. Capture its download if useful. A share preview is enough; don't imply a message was sent when it wasn't. |
| 45–51s | “Real photos use an on-device reader. You check what it read before splitting.” | Face plus capture/review screen. Only show actual scanning footage if you recorded a real OCR take. Overlay **SCAN → CHECK → SPLIT**. |
| 51–58s | “This is my series rebuilding useful app features with AI. What should I build next?” | Face. One clean next-build question. Use the published-link ending below when both links are working. |

**After the app and repository are public**, replace the last line with: “I'm rebuilding useful app features with AI. Try this one and get the source from my profile. What should I build next?” Give this ending a few extra seconds; cut a pause earlier if needed.

Do not say “link in my profile” until the actual working app and source are linked there. If posting before release, use the original ending and the pre-release caption below.

### Alternate openings — record these in the same setup

1. **Everyday tension:** “You ordered a salad. Your mate ordered a steak. Then someone says, ‘Let's split it evenly.’” Follow with “So I built tab.”
2. **Action first:** “Watch these fries split three ways.” Start on the three name taps and **$4.00 each**, then introduce the receipt splitter. Keep the sample label visible.
3. **Series first:** “I'm rebuilding useful app features with AI. Today's problem: dinner maths.” Cut immediately to claiming a dish.

Use one opening per edit. The everyday-tension version is the main recommendation because a new viewer understands the problem before hearing about the series.

## Exact demonstration recipe

**Updated interface:** scan/demo buttons now sit above the receipt illustration on phones. Assignment includes search and a “To claim” queue; leave **All items** selected for the scripted take. The receipt breakdown on Results is a disclosure, and the sharing sheet puts its actions above a scrollable preview. The five sample names, assignment recipe and amounts below are unchanged.

This is the synthetic **NORTH & EMBER** receipt in `src/test-data/demo.ts` and `public/demo/receipt.png`. The restaurant and participants are sample data. The fast sample-scan animation does not establish real OCR performance; the built-in fast demo uses saved recognition output.

Start fresh, choose **Try demo → Check 10 items → Looks good. Who's in? → That's everyone**. Leave the sample names in their original order. Make these assignments:

| Item | Line total, AUD | Select |
| --- | ---: | --- |
| Burrata | $18.00 | Everyone |
| Sourdough | $9.00 | Everyone |
| Ribeye | $46.00 | You |
| Rigatoni | $28.00 | Maya |
| Market fish | $34.00 | Leo |
| Truffle fries | $12.00 | You, Maya, Nina |
| Green salad | $10.00 | Nina, Theo |
| 2 × House red | $24.00 | Nina, Theo |
| Sparkling water | $8.00 | Everyone |
| Tiramisu | $16.00 | You, Leo |

The house red is **$24 for the whole line**, not $24 multiplied by its quantity again.

Continue to finishing touches. Keep the tip at **None** and leave extras proportional. The item subtotal is **$205.00**, the service charge is **$20.50**, and the displayed **$20.50 included GST** is not added again. The full table total is **AUD $225.50**.

| Person | Items | Service | Final share |
| --- | ---: | ---: | ---: |
| You | $65.00 | $6.50 | **$71.50** |
| Maya | $39.00 | $3.90 | **$42.90** |
| Leo | $49.00 | $4.90 | **$53.90** |
| Nina | $28.00 | $2.80 | **$30.80** |
| Theo | $24.00 | $2.40 | **$26.40** |
| **Total** | **$205.00** | **$20.50** | **$225.50** |

These amounts were recalculated with the project's actual parser and splitting engine on **12 September 2026**. That calculation verifies this script's figures; browser, OCR, device, and deployment verification are recorded separately in `docs/RELEASE-VERIFICATION.md`.

**Optional extra shot:** select a **15%** tip to show totals updating. It adds **$30.75**, calculated on the $205 item subtotal. The total becomes **$256.25** and the shares become **$81.25 / $48.75 / $61.25 / $35.00 / $30.00** in the same name order. This matches the existing e2e example. Call it an optional extra tip, and return to **None** before the main result take so the script and picture agree.

## What can honestly be said

| Say | Scope to preserve |
| --- | --- |
| “It reads receipt photos on your device.” | The app has a real local Tesseract OCR pipeline. Demonstrate the actual pipeline before using a scan as visual proof. English is the initial language; recognition may need corrections. |
| “This is the sample demo.” | **Try demo** uses saved OCR and sample people. Do not trim away its label and present that fast animation as live scanning. |
| “You check the scan before splitting.” | Show editable names/prices and the checked total. Do not promise perfect or universal receipt recognition. |
| “Receipt photos aren't uploaded by the app.” | It downloads static site/reader assets. A deliberately shared summary can leave the device through the chosen share destination. Avoid “zero network traffic” or “works completely offline” claims. |
| “No sign-up.” | One local session on one device. Refreshing clears the split, so save or copy results before closing. |
| “Every cent accounted for.” | Assigned item shares and extras reconcile to the confirmed total. This does not prove the photographed receipt was read correctly; the review step still matters. |
| “Save or share the result.” | Browser support controls native sharing. PNG download and copied text provide alternatives. The app does not collect money or confirm payment. |
| “MIT-licensed source.” | The license is in the supplied project. Say “get the source” publicly only once its actual public repository is available. |

## Capture runbook — one focused session

1. **Prepare the real build.** Follow the README's local preview or use the verified Pages URL. Use a normal browser, hide personal tabs/notifications, and choose a narrow phone-sized viewport for the app footage. A 390px-wide layout is a useful composition starting point; record a short test and check readability before doing all takes.
2. **Capture a ten-second test.** Real face and voice, camera near eye level, soft light, quiet room. Check focus, sound, and that the receipt prop does not obscure your face. Use the equipment and editor you already have.
3. **Record A-roll in chunks.** Record the main hook plus two alternatives, the short middle paragraphs, and both endings. Leave a small pause either side of each paragraph. Keep the delivery conversational.
4. **Record one complete sample flow.** Use the assignment recipe above without refreshing. Save this continuous take as the reference for all cutaways. Pause after the three-way fries split, after the final total, and on the generated share card. Film a close-up of your finger tapping the phone only if the text remains legible.
5. **Record real OCR separately.** From a fresh session choose **Scan receipt → Just exploring? → Scan sample with real OCR**. It reads the PNG with the actual worker; it does not populate the five demo people. Retain the full take from trigger to result. Label it **REAL OCR · SYNTHETIC RECEIPT** if used. Review the result rather than assuming it matches the fast demo. For a camera claim, capture a separate photo of a printed synthetic receipt on your actual phone and check it. A desktop sample scan does not prove phone-camera reliability.
6. **Capture one useful process shot.** A real current editor view of the allocation or review logic, with no secrets visible. At most one or two seconds in the main edit. It can support “service follows what you ordered”; do not stage a fake bug or imply an invented elapsed build time.
7. **Keep the short edit readable.** Face-led opening and close, app-led proof in the middle. Use phrase captions, at most two short lines, with emphasis on a few words. Keep captions off participant totals and away from the bottom/right platform controls. Preserve or add the sample disclosure on every sample crop.
8. **Review the exported file on a phone.** Check spoken totals against the screen, caption timing, tiny UI text, pacing, and the ending's actual links. A 9:16, 1080 × 1920 master is the intended composition; use your editor's normal export settings. Keep a clean master without platform watermarks. Add music only if you have appropriate rights; the voice and app can carry this episode without it.

Suggested files: `01-face-main`, `02-hook-options`, `03-sample-full-flow`, `04-real-ocr-full-take`, `05-share-card`, `06-process`, `07-cover-frame`. Preserve originals. These are capture labels, not claims that recordings have been created.

## Covers and publishing copy

**Cover A — preferred:** **WHO ORDERED WHAT?** Face holding receipt on one side, readable tab result on the other. Small `tab.` and series marker. Use your own frame from the recorded video.

**Cover B:** **DINNER. DEALT WITH.** Make the $225.50 receipt result the main visual. No competitor logo or invented price comparison.

**Main title:** I built a receipt splitter for who ordered what

**Alternate title:** One receipt. Five people. Every cent accounted for.

### Reels / TikTok caption — once public

> The fries were shared. The steak wasn't.
>
> I built tab to split a receipt by who ordered what, including shared dishes and service. This video uses the labelled sample demo; real photos use a local reader and need a quick review.
>
> Try the app and get the MIT-licensed source from my profile. What useful app feature should I rebuild next?
>
> #VibeCoding #BuildInPublic #ReceiptSplitter

### Caption — if posted before release

> The fries were shared. The steak wasn't.
>
> This is tab, my receipt-splitting build. The video uses the labelled sample demo. Real receipt scanning runs locally and includes a review step.
>
> The public app and source links aren't live yet. What useful app feature should I rebuild next?

### YouTube Shorts description — once public

> I built tab: choose who ordered each item, split shared dishes, and get individual totals that add up.
>
> The video uses synthetic sample data. Real photos use local OCR; check the extracted items before splitting. No account required. This calculates shares; it doesn't send payments.
>
> Try tab: [INSERT VERIFIED PAGES URL]
> Source: [INSERT PUBLIC GITHUB REPOSITORY URL]
>
> What should I build next?

Replace both bracketed fields before posting. In the video, direct people to the actual profile/link destination you have set up; do not depend on a typed description URL being clickable everywhere.

### X post — once public

> Built tab: a receipt splitter for who ordered what.
>
> Tap a few names for shared dishes. Split extras proportionally. Save everyone's totals.
>
> Local receipt OCR, editable review, no sign-up. Demo clip uses labelled sample data.
>
> Try: [VERIFIED PAGES URL]
> MIT source: [PUBLIC REPO URL]

### Pinned comment — once public

> The quick demo uses a sample receipt with saved OCR. “Scan receipt” uses the real local reader, and you can correct anything it misreads. App + source are in my profile. What's the most annoying part of splitting a bill?

If links are not yet public, replace the third sentence with **“The public app and source links aren't live yet.”** Do not promise automatic DMs or a comment-to-link system that has not been set up.

## Finish before recording and posting

- [ ] Read the final `docs/RELEASE-VERIFICATION.md`; any material remaining limitation is reflected in the claims and footage.
- [ ] Follow the exact main demo with **None** tip and check all five expected amounts.
- [ ] Save the result image and open it; check the names, total, and legibility.
- [ ] Perform and retain an actual OCR take if scanning will be shown as proof.
- [ ] Test the intended camera/library and share path on the phone used for recording; otherwise use the tested desktop path and avoid a phone-support claim.
- [ ] Verify the GitHub Actions deployment and visit the actual Pages URL at its repository subpath. Load the app and its real OCR assets there.
- [ ] Make the repo public with its license/notices and connect the actual app/source links. Choose the matching ending and caption.
- [ ] Check the complete final video on a phone: sample labels, amounts, captions, voice, app readability, and no visible private information.
- [ ] Select a cover from original footage and publish a clean export when you can respond to useful questions.

**Small follow-up worth saving:** a 15–20 second uninterrupted three-way sharing demonstration, or a reply showing a misread price being corrected. The main episode can ship on its own; neither needs to delay it.

## Grounding

- Series direction: `creator-launch-guide/guide.md` in the parent workspace, especially its face-led paid-feature format, original presenter brief, and honest source-release promise.
- Product/data: `README.md`, `src/test-data/demo.ts`, `src/app/screens/`, `src/features/ocr/use-scanner.ts`.
- Demo assignments: `tests/e2e/helpers.ts`; optional 15% totals: `tests/e2e/workflow.spec.ts`.
- Main no-tip amounts: actual `parseReceipt` + `calculateSplit` computation, 12 September 2026.
- Release evidence: `docs/RELEASE-VERIFICATION.md`, which takes precedence over this script for current verification status.

No competitor pricing, performance benchmark, platform growth guarantee, or invented personal anecdote is used in this pack.
