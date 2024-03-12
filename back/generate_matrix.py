from pathlib import Path
import pandas as pd
import numpy as np


def main():
    matrix_dir = Path("/home/leclercsyl/feature_tests/antares/apache-arrow/matrices")
    file = matrix_dir / "classic"
    cols = 200
    rows = 8760
    matrix = pd.DataFrame(np.random.randint(0, 100, size=(rows, cols)), columns=[str(i) for i in range(0, cols)], dtype=np.int32)
    matrix.to_hdf(file, 'data')


if __name__ == "__main__":
    main()
