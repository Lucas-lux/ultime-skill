"""Tests of ci-forge's pin_actions.py, with the remote tags and branches mocked (no network).

Run: python -m unittest discover -s tests -p "test_*.py"
"""

import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest import mock

SCRIPT = Path(__file__).resolve().parents[2] / "authored" / "ci-forge" / "skills" / "ci-forge" / "scripts" / "pin_actions.py"
spec = importlib.util.spec_from_file_location("pin_actions", SCRIPT)
pin_actions = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pin_actions)

SHA_A, SHA_B, SHA_C, SHA_D = ("a" * 40, "b" * 40, "c" * 40, "d" * 40)
TAGS = {
    "actions/checkout": {"v4": SHA_A, "v4.2.0": SHA_B, "v4.3.0": SHA_A, "v5": SHA_C, "v5.0.0": SHA_C},
    "astral-sh/setup-uv": {"v6.0.0": SHA_D, "v6.1.0": SHA_B},
    "acme/nightly": {"v1": SHA_A},
}
BRANCHES = {"actions/checkout": {"main": SHA_D}, "astral-sh/setup-uv": {}, "acme/nightly": {"stable": SHA_B}}


def workflow(content: bytes) -> Path:
    """Write a workflow file byte for byte and return its path."""
    path = Path(tempfile.mkdtemp(prefix="pin-test-")) / "ci.yml"
    path.write_bytes(content)
    return path


class PinActionsTest(unittest.TestCase):
    def setUp(self):
        patches = [mock.patch.object(pin_actions, "remote_tags", side_effect=lambda action: TAGS[action]),
                   mock.patch.object(pin_actions, "remote_branches", side_effect=lambda action: BRANCHES[action])]
        for patch in patches:
            patch.start()
            self.addCleanup(patch.stop)

    def test_keeps_crlf_line_endings(self):
        path = workflow(b"steps:\r\n  - uses: actions/checkout@v4\r\n  - run: make ci\r\n")
        changes, errors, warnings = pin_actions.pin_file(path, latest=False, dry_run=False)
        self.assertEqual((len(changes), errors, warnings), (1, [], []))
        self.assertEqual(path.read_bytes(), f"steps:\r\n  - uses: actions/checkout@{SHA_A} # v4.3.0\r\n  - run: make ci\r\n".encode())

    def test_short_sha_is_an_error(self):
        path = workflow(b"  - uses: actions/checkout@11bd719\n")
        for latest in (False, True):
            changes, errors, _ = pin_actions.pin_file(path, latest=latest, dry_run=True)
            self.assertEqual(changes, [])
            self.assertIn("short SHA", errors[0])

    def test_major_without_release_is_an_error(self):
        path = workflow(b"  - uses: astral-sh/setup-uv@v7\n")
        changes, errors, _ = pin_actions.pin_file(path, latest=False, dry_run=True)
        self.assertEqual(changes, [])
        self.assertIn("no x.y.z release of major 7", errors[0])

    def test_major_tag_alone_and_branch(self):
        path = workflow(b"  - uses: acme/nightly@v1\n  - uses: acme/nightly@stable\n")
        pin_actions.pin_file(path, latest=False, dry_run=False)
        self.assertEqual(path.read_text(encoding="utf-8"),
                         f"  - uses: acme/nightly@{SHA_A} # v1\n  - uses: acme/nightly@{SHA_B} # stable\n")

    def test_quoted_values_comments_and_warnings(self):
        path = workflow(b"  - uses: \"actions/checkout@v4\"\n"
                        b"  - uses: astral-sh/setup-uv@" + SHA_D.encode() + b" # v6.0.0 keep in sync with uv\n"
                        b"  - uses: actions/checkout@v5 # needed for sparse checkout\n"
                        b"  - uses: ./.github/actions/setup\n"
                        b"  - uses: docker://alpine:3.22\n"
                        b"  - uses: ${{ matrix.action }}\n")
        changes, errors, warnings = pin_actions.pin_file(path, latest=False, dry_run=False)
        self.assertEqual((len(changes), errors), (3, []))
        self.assertEqual(len(warnings), 1)
        self.assertIn(":6", warnings[0])
        lines = path.read_text(encoding="utf-8").splitlines()
        self.assertEqual(lines[0], f"  - uses: \"actions/checkout@{SHA_A}\" # v4.3.0")
        self.assertEqual(lines[1], f"  - uses: astral-sh/setup-uv@{SHA_B} # v6.1.0 keep in sync with uv")
        self.assertEqual(lines[2], f"  - uses: actions/checkout@{SHA_C} # v5.0.0 needed for sparse checkout")

    def test_second_run_changes_nothing(self):
        path = workflow(b"  - uses: actions/checkout@v4\n")
        pin_actions.pin_file(path, latest=False, dry_run=False)
        self.assertEqual(pin_actions.pin_file(path, latest=False, dry_run=False), ([], [], []))

    def test_git_never_prompts(self):
        self.assertEqual((pin_actions.GIT_ENV["GIT_TERMINAL_PROMPT"], pin_actions.GIT_ENV["GCM_INTERACTIVE"]), ("0", "never"))
        completed = mock.Mock(returncode=0, stdout=f"{SHA_A}\trefs/tags/v1\n", stderr="")
        with mock.patch.object(pin_actions.subprocess, "run", return_value=completed) as run:
            self.assertEqual(pin_actions.ls_remote("acme/x", "tags"), [(SHA_A, "refs/tags/v1")])
        self.assertEqual(run.call_args.kwargs["env"]["GIT_TERMINAL_PROMPT"], "0")


if __name__ == "__main__":
    unittest.main()
