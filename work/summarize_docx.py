from __future__ import annotations

import sys
import zipfile
from collections import defaultdict

import extract_docx


KEYWORDS = (
    "module",
    "rôle",
    "permission",
    "exigence",
    "architecture",
    "sécurité",
    "workflow",
    "donnée",
    "erp",
    "mvp",
    "roadmap",
)


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    source = sys.argv[1]
    with zipfile.ZipFile(source) as zf:
        doc = extract_docx.read_xml(zf, "word/document.xml")
        blocks = list(extract_docx.iter_blocks(doc))

    print("COUNTS")
    print(f"blocks={len(blocks)}")
    print(f"paragraphs={sum(1 for b in blocks if b['type'] == 'paragraph')}")
    print(f"tables={sum(1 for b in blocks if b['type'] == 'table')}")
    print()

    print("HEADINGS")
    for b in blocks:
        if b["type"] == "paragraph" and b.get("style") in {"Heading1", "Heading2", "Heading3"}:
            print(f"{b.get('style')}: {b['text']}")
    print()

    print("TABLES")
    for idx, b in enumerate([b for b in blocks if b["type"] == "table"], 1):
        rows = b["rows"]
        header = " | ".join(rows[0]) if rows else ""
        sample = " | ".join(rows[1]) if len(rows) > 1 else ""
        print(f"T{idx}: rows={len(rows)} header={header}")
        if sample:
            print(f"    sample={sample}")
    print()

    print("KEY PARAGRAPHS")
    seen = defaultdict(int)
    for b in blocks:
        if b["type"] != "paragraph":
            continue
        text = b["text"]
        low = text.lower()
        for kw in KEYWORDS:
            if kw in low and seen[kw] < 16:
                print(f"[{kw}] {text[:260]}")
                seen[kw] += 1
                break
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
