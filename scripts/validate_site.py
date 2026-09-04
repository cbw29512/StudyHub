#!/usr/bin/env python3
"""Validate StudyHub's static site without requiring a build system."""

from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = sorted(ROOT.glob("*.html"))
IGNORED_SCHEMES = {"http", "https", "mailto", "tel", "data", "javascript"}


class ReferenceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.refs: list[tuple[str, str]] = []
        self.has_lang = False
        self.has_title = False
        self.has_viewport = False
        self.h1_count = 0
        self.images_without_alt: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        if tag == "html" and data.get("lang"):
            self.has_lang = True
        elif tag == "title":
            self.has_title = True
        elif tag == "meta" and data.get("name", "").lower() == "viewport":
            self.has_viewport = True
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "img" and "alt" not in data:
            self.images_without_alt.append(data.get("src", "<unknown>"))

        for attr in ("href", "src"):
            value = data.get(attr)
            if value:
                self.refs.append((attr, value))


ERRORS: list[str] = []


def error(message: str) -> None:
    ERRORS.append(message)


def validate_html(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    parser = ReferenceParser()
    parser.feed(text)

    rel = path.relative_to(ROOT)
    if not parser.has_lang:
        error(f"{rel}: missing html[lang]")
    if not parser.has_title:
        error(f"{rel}: missing <title>")
    if not parser.has_viewport:
        error(f"{rel}: missing viewport meta tag")
    if parser.h1_count > 1:
        error(f"{rel}: more than one <h1> ({parser.h1_count})")
    for src in parser.images_without_alt:
        error(f"{rel}: image missing alt attribute: {src}")

    for attr, raw in parser.refs:
        raw = raw.strip()
        parsed = urlparse(raw)
        if parsed.scheme.lower() in IGNORED_SCHEMES or raw.startswith("//"):
            continue
        if raw.startswith("#"):
            continue

        clean = unquote(parsed.path)
        if not clean:
            continue
        if clean.startswith("/"):
            target = ROOT / clean.lstrip("/")
        else:
            target = path.parent / clean

        if clean.endswith("/"):
            target = target / "index.html"

        if not target.exists():
            error(f"{rel}: broken local {attr}={raw!r}")

    # Catch common accidental placeholders that are invisible to file checks.
    if re.search(r'(?:href|src)=["\'](?:TODO|TBD|PLACEHOLDER)["\']', text, re.I):
        error(f"{rel}: contains TODO/TBD/PLACEHOLDER link target")


def main() -> int:
    if not HTML_FILES:
        error("No root HTML pages found")
    for html_file in HTML_FILES:
        validate_html(html_file)

    if ERRORS:
        print("Static-site validation failed:")
        for item in ERRORS:
            print(f"- {item}")
        return 1

    print(f"Static-site validation passed for {len(HTML_FILES)} HTML pages.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
