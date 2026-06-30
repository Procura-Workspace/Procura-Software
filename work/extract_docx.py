from __future__ import annotations

import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "cp": "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
    "dc": "http://purl.org/dc/elements/1.1/",
    "dcterms": "http://purl.org/dc/terms/",
}


def text_from(node: ET.Element) -> str:
    parts: list[str] = []
    for elem in node.iter():
        tag = elem.tag.rsplit("}", 1)[-1]
        if tag == "t" and elem.text:
            parts.append(elem.text)
        elif tag == "tab":
            parts.append("\t")
        elif tag == "br":
            parts.append("\n")
    return "".join(parts)


def paragraph_style(p: ET.Element) -> str | None:
    p_style = p.find("./w:pPr/w:pStyle", NS)
    if p_style is None:
        return None
    return p_style.attrib.get(f"{{{NS['w']}}}val")


def iter_blocks(parent: ET.Element):
    body = parent.find(".//w:body", NS)
    if body is None:
        return
    for child in body:
        tag = child.tag.rsplit("}", 1)[-1]
        if tag == "p":
            txt = text_from(child).strip()
            if txt:
                yield {"type": "paragraph", "style": paragraph_style(child), "text": txt}
        elif tag == "tbl":
            rows = []
            for tr in child.findall("./w:tr", NS):
                row = []
                for tc in tr.findall("./w:tc", NS):
                    cell_text = re.sub(r"\s+", " ", text_from(tc)).strip()
                    row.append(cell_text)
                rows.append(row)
            if rows:
                yield {"type": "table", "rows": rows}


def read_xml(zf: zipfile.ZipFile, name: str) -> ET.Element | None:
    try:
        return ET.fromstring(zf.read(name))
    except KeyError:
        return None


def core_props(zf: zipfile.ZipFile) -> dict[str, str]:
    root = read_xml(zf, "docProps/core.xml")
    if root is None:
        return {}
    props = {}
    for key, path in {
        "title": "dc:title",
        "subject": "dc:subject",
        "creator": "dc:creator",
        "keywords": "cp:keywords",
        "description": "dc:description",
        "last_modified_by": "cp:lastModifiedBy",
        "created": "dcterms:created",
        "modified": "dcterms:modified",
    }.items():
        elem = root.find(path, NS)
        if elem is not None and elem.text:
            props[key] = elem.text
    return props


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    if len(sys.argv) not in {2, 3}:
        print("usage: extract_docx.py input.docx [output.json|-]", file=sys.stderr)
        return 2

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2]) if len(sys.argv) == 3 and sys.argv[2] != "-" else None

    with zipfile.ZipFile(input_path) as zf:
        document = read_xml(zf, "word/document.xml")
        if document is None:
            raise RuntimeError("word/document.xml missing")
        blocks = list(iter_blocks(document))
        result = {
            "source": str(input_path),
            "properties": core_props(zf),
            "counts": {
                "paragraphs": sum(1 for b in blocks if b["type"] == "paragraph"),
                "tables": sum(1 for b in blocks if b["type"] == "table"),
                "blocks": len(blocks),
            },
            "blocks": blocks,
        }

    payload = json.dumps(result, ensure_ascii=False, indent=2)
    if output_path is None:
        print(payload)
    else:
        output_path.write_text(payload, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
