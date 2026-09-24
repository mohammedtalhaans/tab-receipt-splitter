---
name: local-ocr
description: Implement and audit entirely local receipt recognition.
---
# Local OCR
Use for capture, preprocessing, scanning, and parser changes.
No receipt network requests, analytics, logs, or persistent application storage.
Lazy-load Tesseract. Self-host worker, WASM, and language assets. Report real progress only.
Request text and blocks explicitly. Do not draw text boxes before OCR returns them.
Bound file size and pixel dimensions. Revoke object URLs and terminate workers on cancellation.
Keep deterministic synthetic fixtures. Treat OCR as untrusted input.
Always provide manual entry. Do not hide missing totals or repair money without flagging review.
