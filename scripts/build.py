"""Rebuild the whole library deterministically.

Order: regenerate vendor.json, wipe plugins/, import the pinned upstream skills, overlay the hand-written packs from authored/,
write every manifest and the marketplace, then run the checks.

    python scripts/build.py
    python scripts/build.py --cache DIR   # reuse upstream clones kept in DIR
"""

import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PY = sys.executable


def run(*args: str) -> None:
    result = subprocess.run([PY, "-I", str(ROOT / "scripts" / args[0]), *args[1:]])
    if result.returncode:
        sys.exit(result.returncode)


def overlay_authored() -> None:
    """Copy each hand-written pack from authored/ into plugins/, preserving imported siblings."""
    authored = ROOT / "authored"
    if not authored.exists():
        return
    for pack in sorted(authored.iterdir()):
        if pack.is_dir():
            shutil.copytree(pack, ROOT / "plugins" / pack.name, dirs_exist_ok=True,
                            ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
            print(f"{'authored':>24}  {pack.name}")


def remove_tree(path: Path, attempts: int = 10) -> None:
    """Delete a tree, retrying while Windows keeps a folder busy (editor file watcher, indexer)."""
    for attempt in range(attempts):
        try:
            shutil.rmtree(path)
            return
        except PermissionError as error:
            if attempt == attempts - 1:
                sys.exit(f"cannot delete {path}: {error}. Close what holds it (a shell or editor inside plugins/) and rerun.")
            time.sleep(0.5 * (attempt + 1))


def main() -> None:
    cache = sys.argv[1:] if len(sys.argv) > 1 else []
    run("gen_vendor.py")
    plugins = ROOT / "plugins"
    if plugins.exists():
        remove_tree(plugins)
    run("vendor.py", *cache)
    overlay_authored()
    run("gen_manifests.py")
    run("check.py")


if __name__ == "__main__":
    main()
