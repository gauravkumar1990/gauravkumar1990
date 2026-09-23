# MediCare One — hospital workflow demo

Patient-centred static web application. Fictional sample data only.

## Run

Serve this directory with `python3 -m http.server 8080`, then open http://localhost:8080. On GitHub Pages, use the HTTPS demo URL. No build step or API key is needed.

## Implemented

- Hospital overview plus 27 department workspaces. Dashboard cards open filtered worklists/reports.
- Global patient search, patient identity confirmation, persistent patient context, QR cards for seeded patients and Code 128 cards for newly registered demo patients.
- Camera and image scanning with native BarcodeDetector. Browsers without it attempt the pinned html5-qrcode 2.3.8 compatibility library bundled locally under vendor/. If the library or permission is unavailable, hardware scanner/manual entry remains available. No image is uploaded by the native decoder.
- Patient registration, procedure/task records, consultation notes, provisional diagnosis, prescription drafts and investigation records.
- Rule-based clinical suggestions for three example scenarios. Medicine candidates can be deleted; directions and clinician review are required before addition. No live AI model is connected, and no medicine dose is auto-generated.
- Department batch inventory: receive, patient-linked utilisation, count adjustment, immediate demo transfer with destination stock entry, expiry and insufficient-stock checks, controlled-stock witness, ledger and printable transaction document.
- Department report menus, date filters, CSV export with spreadsheet formula neutralization and print/save PDF.
- Browser localStorage persistence, data export and reset.

## Demo walkthrough

1. Find MC-1001 and confirm identity. Open Doctor / OPD > Clinical assistant.
2. Generate suggestions, select a test and order it. Candidate medicines remain outside the prescription until fully reviewed. Enter demonstration directions before adding them.
3. Switch patient to MC-1002: prescriptions and notes must remain separate.
4. Open Nursing & wards > Worklist, open a task, record findings and save.
5. Open Pharmacy > Inventory, manage a non-expired batch, record utilisation for a patient, review and submit.
6. Open Reports > Patient-wise utilisation and export or print. Try to issue expired or excessive stock: both should be blocked.
7. Open Patient code, display/print the code and scan it from another device. Use MC-1001 in the code field if camera access is unavailable.

## Scope boundaries

This is not a production hospital system and must not store real health information. There is no server authentication, access control, multi-user synchronization, tamper-proof audit, live AI, device/PACS integration or real payment processing. Department dashboards use a shared configurable task engine; specialist EMR fields, sterilization cycle controls, blood compatibility controls, statutory registers and full clinical workflows are not implemented. Inventory transfers post an immediate demo receipt; production needs independent recipient acknowledgement and approval controls.

Clinical outputs are unvalidated demonstration templates, not diagnostic or prescribing advice. Review must cover patient identity, allergies, interactions, age, organ function, pregnancy and appropriateness. Prescriptions remain reviewed drafts; no digital signature or clinical authorization exists.

Report names support audit planning but do not establish NABH or legal compliance. Some specialty reports are task registers with generic fields. Validate every applicable standard/edition, statutory register field, retention rule and workflow with qualified hospital teams. References: https://nabh.co/ and https://www.nice.org.uk/guidance/ng120 . Reference links do not validate the engine.

Camera decoding has to be validated on the target phone, browser, printed code size and lighting. Offline core app does not need a network after loading, and the compatibility scanner is bundled with the app. localStorage is device/browser-specific and can be cleared by the browser.

## GitHub Pages

The prepared workflow deploys the repository's `hospital-demo` directory. Place the workflow at repository root `.github/workflows/medicare-pages.yml`. In repository Settings > Pages choose Source: GitHub Actions, then run the workflow. No secrets or API keys are needed. If this folder is used as an independent repository root, change artifact `path` from `hospital-demo` to `.` and update the workflow path filters.

## Verification performed

Node syntax check and isolated execution tests: 28 workspaces / 168 views, all report renderers, clinical review gating, patient prescription isolation, stock deduction and transfer, expired/insufficient-stock rejection, report filtering, barcode generation and output escaping. Physical camera scanning and browser visual QA are separate checks; do not infer they passed from these tests.
