# BrowserOS Office sources

Writer 2.0.1, Stage 2.0.1 and Cells 1.0.1 are sandboxed `.beep` apps. The shared
`office.js` supplies coordinated Clear Ice colors, inset surfaces, rounded
controls, accessible dialogs and virtual filesystem document operations.
It follows live theme changes and reduced motion. It uses the theme payload and
BOS APIs only; it never reads the parent desktop DOM.

With the current BrowserOS build, all three apps offer Save / Discard / Cancel
before their window closes. Canceling Save As or a failed save keeps the window
open. Pending Cells edits are committed before the close decision. Dirty state
also enables the host's standard browser unload warning. Reload BrowserOS before
updating the apps to load the new BOS close-guard APIs.

## Build

Run `python office/build.py` from this repository. Python's standard library
creates each archive with `manifest.json` and `main.js` at its root. Node checks
the combined entry script's syntax. No package installation is needed.
The script concatenates shared chrome, the Cells parser where applicable, and
the app entry. Generated packages are placed in `dist/` for publication in
`apps/`. Keep catalog and package manifest versions identical.

## Features

- **Writer 2.0.1:** font and size controls, colors, highlights, alignment, headings,
  lists, links, tables, embedded pictures from Pictures, find/replace, word and
  character counts, text export, and existing `.writer` documents.
- **Stage 2.0.1:** four layouts, slide duplication/reordering, undo/redo, speaker
  notes, four color presets, pictures, slide transitions, independent title,
  text and picture animations, and keyboard presentation controls. Speaker notes
  are hidden unless explicitly shown in the presentation view. Previous `.stage`
  documents remain readable.
- **Cells 1.0.1:** multiple worksheets, formulas and ranges, cross-sheet references,
  number/currency/percent formats, alignment, bold/italic/fill, rectangular
  selection, copy/paste, undo/redo, CSV/TSV import and calculated CSV export.
  Limits are 200 rows × 52 columns per sheet, 12 sheets and 2,000 characters per
  cell. Formulas copy exactly; relative reference rewriting is not implemented.

The store Clock listing is retired because BrowserOS 3 includes a native Clock.
Existing Clock installations and the historical package are not removed.

## Document architecture and future Office support

See [FORMATS.md](FORMATS.md). Native parsing and serialization are separate from
UI rendering. File associations declare only implemented native/text formats.
DOCX, PPTX and XLSX are **not supported yet**. Future import/export adapters must
translate into the native models and be explicit about unsupported features.
Do not accept macro execution, imported scripts, or remote asset retrieval.

## Suggested manual checks

Install/update all three packages from the store, switch OS light/dark themes
while they are open, save and reopen documents from File Manager, and reopen a
document created with the previous Writer/Stage releases. In Writer, check that
formatting survives save/reopen. In Stage, present all transition and animation
choices and try reduced motion. In Cells, try `=SUM(A1:A3)`, `=IF(A1=0,0,10/A1)`,
a cross-sheet reference and a circular reference, then save/reopen the workbook.
Import quoted CSV with embedded commas/newlines and export the current sheet.

