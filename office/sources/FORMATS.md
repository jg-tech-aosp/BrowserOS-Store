# Native document contracts

These are data formats, independent of editor DOM and presentation controls.
The shared document controller is the boundary for filesystem reads, version
checks, serialization, save-as naming, and unsaved-change prompts. Future Office
adapters should enter through these boundaries rather than modify app UI state.

## Writer: `browseros-writer`, version 2

`title` is text; `html` is the portable rich text subset. `page` describes the
intended paper size and margin; `metadata.application` identifies the producer.
Version 1 documents containing `html` are migrated on read. HTML is sanitized on
load, paste and save. Only supported text, list, table and raster picture tags,
restricted formatting styles and safe web/email links are kept. Script-bearing
elements, event handlers, remote images and SVG are removed. Raster images are
embedded from files already in the virtual Pictures folder.

A future DOCX adapter can map paragraphs, runs, lists, tables and embedded raster
images into this subset. Rich text HTML remains canonical for this release;
there is no claim of Word layout fidelity or Office file compatibility.

## Stage: `browseros-stage`, version 2

`canvas` defines a 1280 × 720 coordinate space. `slides` is an ordered array of
title/body strings, a supported `layout`, `theme`, `align`, `textSize`, optional
`imagePath`, speaker `notes`, slide `transition` and per-element `animations`.
Layouts render from these declarative fields. Animations are CSS effects selected
from fixed allowlists; imported content cannot supply executable effects.
Version 1 slide arrays are migrated with missing effects set to `none`.

A future PPTX adapter can map supported slide layouts into this model. Arbitrary
positioned objects, charts, audio/video, embedded Office files, and faithful PPTX
transition/timing conversion are deferred. Image paths are virtual filesystem
references, so backups should include the corresponding Pictures files.

## Cells: `browseros-cells`, version 1

`workbook.sheets` contains uniquely named sheets. Each has an ID, row/column
counts and a sparse `cells` object indexed by zero-based `row,column` keys.
Each cell stores a `raw` string and optional declarative `style`. Raw values
starting with `=` are parsed by the bounded `cells-1` grammar. Cached display
values are not authoritative or serialized. Formula errors are displayed as
spreadsheet errors; evaluation cannot access JavaScript, the network or BOS.

This structure provides the boundary for a future XLSX adapter: worksheet names,
raw values, a supported formula subset and styles. CSV/TSV adapters are currently
implemented. CSV export contains calculated values for the current sheet, not
the complete workbook. XLSX, macros, external links, named ranges, array formulas,
charts and arbitrary Excel functions are not implemented.

