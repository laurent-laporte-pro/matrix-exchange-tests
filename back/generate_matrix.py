import numpy as np
import pandas as pd

from config import MATRIX_DIR


def main():
    MATRIX_DIR.mkdir(parents=True, exist_ok=True)
    file = MATRIX_DIR / "classic.hdf"
    cols = 200
    rows = 8760
    matrix = pd.DataFrame(np.random.random(size=(rows, cols)) * 1000, columns=[str(i) for i in range(0, cols)], dtype=np.float32)
    matrix = matrix.round(decimals=1)
    matrix.to_hdf(file, 'data')


if __name__ == "__main__":
    main()
