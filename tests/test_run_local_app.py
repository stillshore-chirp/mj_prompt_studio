from __future__ import annotations

import signal
import subprocess
import sys
from collections.abc import Sequence
from types import SimpleNamespace

import pytest
from scripts import run_local_app


class _FakeProcess:
    def __init__(self, return_code: int | None) -> None:
        self.return_code = return_code

    def poll(self) -> int | None:
        return self.return_code

    def terminate(self) -> None:
        self.return_code = 0

    def kill(self) -> None:
        self.return_code = -9


def _run_and_capture_commands(monkeypatch: pytest.MonkeyPatch) -> tuple[int, list[list[str]]]:
    commands: list[list[str]] = []

    def fake_popen(command: Sequence[str], **_kwargs: object) -> _FakeProcess:
        commands.append(list(command))
        return _FakeProcess(0 if len(commands) == 1 else None)

    monkeypatch.setattr(subprocess, "Popen", fake_popen)
    monkeypatch.setattr(
        subprocess,
        "run",
        lambda *_args, **_kwargs: SimpleNamespace(returncode=0),
    )
    monkeypatch.setattr(signal, "signal", lambda *_args: None)
    monkeypatch.setattr(sys, "argv", ["run_local_app.py"])
    return run_local_app.main(), commands


def test_python_command_uses_the_interpreter_running_the_launcher(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("PYTHON", "arch -arm64 .venv/bin/python")

    return_code, commands = _run_and_capture_commands(monkeypatch)

    assert return_code == 0
    assert commands[0] == [
        sys.executable,
        "-m",
        "mj_prompt_studio.server.main",
    ]


def test_python_command_defaults_to_current_interpreter(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("PYTHON", raising=False)

    return_code, commands = _run_and_capture_commands(monkeypatch)

    assert return_code == 0
    assert commands[0] == [
        sys.executable,
        "-m",
        "mj_prompt_studio.server.main",
    ]


def test_node_guard_failure_stops_before_starting_api_or_client(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setattr(
        subprocess,
        "run",
        lambda *_args, **_kwargs: SimpleNamespace(returncode=1),
    )
    monkeypatch.setattr(
        subprocess,
        "Popen",
        lambda *_args, **_kwargs: pytest.fail("app process started after Node guard failure"),
    )
    monkeypatch.setattr(sys, "argv", ["run_local_app.py"])

    assert run_local_app.main() == 1
    assert "Node.js runtime preflight failed" in capsys.readouterr().err
