"""Battery Health Platform algorithm package."""

from importlib import import_module
import sys


def _alias_module(legacy_name: str, target_module: str) -> None:
    """Expose package modules under legacy top-level import paths."""
    module = import_module(target_module)
    sys.modules.setdefault(legacy_name, module)


# Keep both execution styles working:
# - `uvicorn app:app` from the `algorithm/` directory
# - `import algorithm.app` from the repository root
_alias_module("config", "algorithm.config")
for _legacy_pkg in ("core", "advanced", "bridge", "models", "scheduler", "training", "utils"):
    _alias_module(_legacy_pkg, f"algorithm.{_legacy_pkg}")
