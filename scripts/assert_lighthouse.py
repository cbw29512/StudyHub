#!/usr/bin/env python3
"""Require perfect Lighthouse category scores for StudyHub release checks."""

from __future__ import annotations

import json
import sys
from pathlib import Path

CATEGORIES = ("performance", "accessibility", "best-practices", "seo")


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: assert_lighthouse.py <report.json> [<report.json> ...]")
        return 2

    failed = False
    for filename in sys.argv[1:]:
        path = Path(filename)
        report = json.loads(path.read_text(encoding="utf-8"))
        print(path.name)
        for name in CATEGORIES:
            score = report["categories"][name]["score"]
            numeric = int(round(float(score) * 100))
            print(f"  {name}: {numeric}")
            if numeric != 100:
                failed = True

    if failed:
        print("Lighthouse release gate requires 100/100/100/100 on every report.")
        return 1
    print("Lighthouse release gate passed at 100/100/100/100.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
