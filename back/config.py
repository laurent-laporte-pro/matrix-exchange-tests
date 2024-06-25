from pathlib import Path

HERE = Path(__file__).parent
PROJECT_DIR = next(iter(p for p in HERE.parents if (p / ".git").exists()))
TARGET_DIR = PROJECT_DIR / "target"
MATRIX_DIR = TARGET_DIR / "matrices"
