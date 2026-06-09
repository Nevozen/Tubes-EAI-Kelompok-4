from __future__ import annotations

from typing import Any
from xml.dom import minidom

from dicttoxml import dicttoxml


def build_invoice_xml(document: dict[str, Any]) -> str:
    xml_bytes = dicttoxml(document, custom_root="invoice", attr_type=False)
    pretty_xml = minidom.parseString(xml_bytes).toprettyxml(indent="  ")
    return "\n".join(line for line in pretty_xml.splitlines() if line.strip())
