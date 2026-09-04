from pathlib import Path

PATH = Path("index.html")

REPLACEMENTS = [
    (
        "    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Outfit:wght@400;500;600;700;800;900&display=swap');\n\n",
        "",
    ),
    (
        "      --font:'Outfit',system-ui,sans-serif; --mono:'JetBrains Mono',ui-monospace,monospace;",
        '      --font:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;',
    ),
    (
        ".stat-label{font-size:12px;opacity:.5;font-weight:600}",
        ".stat-label{font-size:12px;opacity:.58;font-weight:600}",
    ),
    (
        ".o-40{opacity:.4}.o-50{opacity:.5}.o-60{opacity:.6}.o-70{opacity:.7}.o-85{opacity:.85}",
        ".o-40{opacity:.4}.o-50{opacity:.58}.o-60{opacity:.6}.o-70{opacity:.7}.o-85{opacity:.85}",
    ),
    (
        '<div class="version-badge" aria-hidden="true">v4.0.0</div>',
        '<div class="version-badge" aria-hidden="true">v4.1.0</div>',
    ),
    (
        '      h("div",{className:"wk-bar",style:{height:Math.max(4,(d.mins/max)*60),background:d.mins>0?"linear-gradient(to top,#3b82f6,#60a5fa)":"var(--surface-2)"},"aria-label":d.label+": "+d.mins+" minutes"}),',
        '      h("div",{className:"wk-bar",style:{height:Math.max(4,(d.mins/max)*60),background:d.mins>0?"linear-gradient(to top,#3b82f6,#60a5fa)":"var(--surface-2)"},"aria-hidden":"true"}),',
    ),
    (
        'className:"card cert-card",style:{borderLeftColor:c.color},role:"button",tabIndex:0,"aria-label":"Open "+c.title,onKeyDown',
        'className:"card cert-card",style:{borderLeftColor:c.color},role:"button",tabIndex:0,onKeyDown',
    ),
    (
        'className:cn("nav-btn",activePage===n.id&&"active"),"aria-current":activePage===n.id?"page":undefined},',
        'className:cn("nav-btn",activePage===n.id&&"active"),"aria-label":n.label,"aria-current":activePage===n.id?"page":undefined},',
    ),
]


def main() -> None:
    text = PATH.read_text(encoding="utf-8")
    changed = False

    for old, new in REPLACEMENTS:
        old_count = text.count(old)
        new_count = text.count(new)
        if old_count == 1 and new_count == 0:
            text = text.replace(old, new, 1)
            changed = True
            continue
        if old_count == 0 and new_count == 1:
            continue
        raise SystemExit(
            f"Homepage hardening assertion failed: old={old_count}, new={new_count}, fragment={old[:80]!r}"
        )

    if changed:
        PATH.write_text(text, encoding="utf-8")
        print("Applied asserted StudyHub homepage hardening patch.")
    else:
        print("StudyHub homepage hardening patch is already applied.")


if __name__ == "__main__":
    main()
