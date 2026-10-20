"""Build the BrowserOS Office packages from sources; no external dependencies."""
from pathlib import Path
import base64
import json
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "sources"
OUTPUT = ROOT / "dist"
OUTPUT.mkdir(exist_ok=True)
shared = (SOURCE / "shared/office.js").read_text(encoding="utf-8")
results = []
for app in ("writer", "stage", "cells"):
    manifest = json.loads((SOURCE / app / "manifest.json").read_text(encoding="utf-8"))
    parts = [shared]
    if app == "cells":
        parts.append((SOURCE / app / "formula.js").read_text(encoding="utf-8"))
    parts.append((SOURCE / app / "main.js").read_text(encoding="utf-8"))
    bundle = "\n\n".join(parts)
    # The launcher embeds the script in srcdoc. A literal closing script tag
    # must never end that wrapper when a source string is changed later.
    bundle = bundle.replace("</script", "<\\/script")
    script = OUTPUT / (app + ".js")
    script.write_text(bundle, encoding="utf-8")
    subprocess.run(["node", "--check", str(script)], check=True)
    package = OUTPUT / (app + ".beep")
    with zipfile.ZipFile(package, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for filename, content in (("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"), ("main.js", bundle)):
            item = zipfile.ZipInfo(filename, date_time=(2026, 10, 21, 0, 0, 0))
            item.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(item, content.encode("utf-8"))
    (OUTPUT / (app + ".b64")).write_text(base64.b64encode(package.read_bytes()).decode("ascii"), encoding="ascii")
    results.append({"id": app, "version": manifest["version"], "bytes": package.stat().st_size})
(OUTPUT / "packages.json").write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
print(json.dumps(results))

