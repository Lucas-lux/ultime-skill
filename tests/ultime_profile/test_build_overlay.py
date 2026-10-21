"""Tests of scripts/build.py's overlay of authored packs (the step that ships ultime-profile and ci-forge).

Run: python -m unittest discover -s tests -p "test_*.py"
"""

import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest import mock

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "build.py"
spec = importlib.util.spec_from_file_location("build", SCRIPT)
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


class OverlayAuthoredTest(unittest.TestCase):
    def test_skips_python_caches(self):
        root = Path(tempfile.mkdtemp(prefix="build-test-"))
        scripts = root / "authored" / "pack" / "skills" / "pack" / "scripts"
        (scripts / "__pycache__").mkdir(parents=True)
        (scripts / "tool.py").write_text("print('x')\n", encoding="utf-8")
        (scripts / "__pycache__" / "tool.cpython-312.pyc").write_bytes(b"\0")
        (scripts / "stray.pyc").write_bytes(b"\0")
        with mock.patch.object(build, "ROOT", root), mock.patch("builtins.print"):
            build.overlay_authored()
        copied = sorted(p.relative_to(root / "plugins").as_posix() for p in (root / "plugins").rglob("*"))
        self.assertEqual(copied, ["pack", "pack/skills", "pack/skills/pack", "pack/skills/pack/scripts",
                                  "pack/skills/pack/scripts/tool.py"])


if __name__ == "__main__":
    unittest.main()
