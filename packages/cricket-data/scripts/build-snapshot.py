"""Build the current career-only snapshot (supersedes season-form generation)."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name("build-careers.py")),run_name="__main__")
