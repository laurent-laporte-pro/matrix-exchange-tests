import numpy as np
import pandas as pd
import pyarrow as pa

from antares.main import to_dto
from config import MATRIX_DIR


def test():
    matrix = pd.DataFrame(
        np.random.randint(0, 100, size=(10, 5)), columns=[str(i) for i in range(0, 5)], dtype=np.int32
        )
    print(to_dto(matrix))


def test_read_file():
    test_file = MATRIX_DIR / "test.arrow"

    with pa.ipc.open_file(test_file) as reader:

       num_record_batches = reader.num_record_batches
       print(num_record_batches)
