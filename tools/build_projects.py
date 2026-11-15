#!/usr/bin/env python3
"""Regenerate the "Semester projects" list in index.html.

Scans projects/sem-N/ for project pages:
    projects/sem-5/my-project.html        (single file)
    projects/sem-5/my-project/index.html  (folder with its own assets)
and writes one entry per page between the projects:start / projects:end
markers in index.html. Needs only Python 3.8+, no packages.

Each page supplies its own details through its <head>:
    <title>                         -> project title        (required)
    <meta name="description" ...>   -> one-line summary     (recommended)
    <meta name="course" ...>        -> e.g. Digital System Design   (optional)
    <meta name="tags" ...>          -> comma-separated, e.g. Verilog, FPGA (optional)

Files and folders starting with "_" are ignored (use for drafts/templates).
"""
import html
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROJECTS = ROOT / "projects"
INDEX = ROOT / "index.html"
START, END = "<!-- projects:start -->", "<!-- projects:end -->"


class HeadInfo(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title, self.meta, self._in_title = "", {}, False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title":
            self._in_title = True
        elif tag == "meta":
            key = (a.get("name") or a.get("property") or "").lower()
            if key and a.get("content"):
                self.meta.setdefault(key, a["content"])

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data


def read_head(path):
    text = path.read_text(encoding="utf-8", errors="replace")
    head = re.split(r"</head>", text, maxsplit=1, flags=re.I)[0]
    info = HeadInfo()
    info.feed(head)
    return info


def clean(s):
    return re.sub(r"\s+", " ", s or "").strip()


def find_pages(sem_dir):
    pages = [p for p in sem_dir.glob("*.html") if not p.name.startswith("_")]
    pages += [d / "index.html" for d in sem_dir.iterdir()
              if d.is_dir() and not d.name.startswith("_") and (d / "index.html").exists()]
    return sorted(pages, key=lambda p: p.parent.name.lower() if p.name == "index.html" else p.name.lower())


def render_entry(page):
    info = read_head(page)
    is_folder = page.name == "index.html"
    stem = page.parent.name if is_folder else page.stem
    url = page.parent.relative_to(ROOT).as_posix() + "/" if is_folder else page.relative_to(ROOT).as_posix()
    title = clean(info.title) or stem.replace("-", " ").replace("_", " ").title()
    desc = clean(info.meta.get("description") or info.meta.get("og:description"))
    if not desc:
        print(f"  note: {url} has no <meta name=\"description\">", file=sys.stderr)
    tags = [clean(t) for t in (info.meta.get("tags") or "").split(",") if clean(t)]
    meta_line = " · ".join(x for x in [clean(info.meta.get("course")), *tags] if x)

    lines = [f'<li><a class="title" href="{html.escape(url)}">{html.escape(title)}</a>']
    if desc:
        lines.append(f"<p>{html.escape(desc)}</p>")
    if meta_line:
        lines.append(f'<p class="mono">{html.escape(meta_line)}</p>')
    lines.append("</li>")
    return "\n".join(lines)


def build_block():
    sems = []
    if PROJECTS.is_dir():
        for d in PROJECTS.iterdir():
            m = re.fullmatch(r"sem-(\d+)", d.name)
            if d.is_dir() and m:
                sems.append((int(m.group(1)), d))
    out, count = [], 0
    for n, d in sorted(sems, reverse=True):  # newest semester first
        pages = find_pages(d)
        if not pages:
            continue
        count += len(pages)
        out.append(f"<h4>Semester {n}</h4>")
        out.append('<ul class="entries">')
        out.extend(render_entry(p) for p in pages)
        out.append("</ul>")
    if not out:
        out.append('<p class="muted small">Coming soon.</p>')
    return "\n".join(out), count


def main():
    text = INDEX.read_text(encoding="utf-8")
    if START not in text or END not in text:
        sys.exit(f"Markers {START} / {END} not found in index.html")
    block, count = build_block()
    new = re.sub(
        re.escape(START) + r".*?" + re.escape(END),
        lambda _: f"{START}\n{block}\n    {END}",
        text,
        flags=re.S,
    )
    if new != text:
        INDEX.write_text(new, encoding="utf-8")
        print(f"index.html updated ({count} semester project(s)).")
    else:
        print(f"index.html already up to date ({count} semester project(s)).")


if __name__ == "__main__":
    main()
