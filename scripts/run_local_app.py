from __future__ import annotations

import argparse
import os
import signal
import subprocess
import sys
import time
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--client-command", choices=["dev", "preview"], default="dev")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    try:
        runtime_check = subprocess.run(
            ["node", "scripts/check_node_runtime.cjs"],
            cwd=repo_root,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    except OSError:
        runtime_check = None
    if runtime_check is None or runtime_check.returncode != 0:
        print(
            "Node.js runtime preflight failed; install the version in .nvmrc "
            "(with nvm: run nvm install, then nvm use), then run make check-node-runtime.",
            file=sys.stderr,
        )
        return 1

    api_env = os.environ.copy()
    api_env.setdefault("MJPS_SERVER_PORT", "8765")
    api = subprocess.Popen(
        [sys.executable, "-m", "mj_prompt_studio.server.main"],
        cwd=repo_root,
        env=api_env,
    )
    client_command = ["npm", "run", args.client_command, "--", "--host", "127.0.0.1"]
    if args.client_command == "dev":
        client_command.extend(["--port", "5173"])
    else:
        client_command.extend(["--port", "4173"])
    client = subprocess.Popen(client_command, cwd=repo_root / "client", env=os.environ.copy())
    processes = [api, client]

    def stop(_signum: int, _frame: object) -> None:
        for process in processes:
            if process.poll() is None:
                process.terminate()

    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)
    try:
        while True:
            for process in processes:
                code = process.poll()
                if code is not None:
                    stop(signal.SIGTERM, None)
                    return int(code)
            time.sleep(0.5)
    finally:
        for process in processes:
            if process.poll() is None:
                process.kill()


if __name__ == "__main__":
    raise SystemExit(main())
