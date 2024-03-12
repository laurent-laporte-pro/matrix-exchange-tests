import pytest
import pandas as pd
import numpy as np

from antares.main import to_dto


def test():
    matrix = pd.DataFrame(
        np.random.randint(0, 100, size=(10, 5)), columns=[str(i) for i in range(0, 5)], dtype=np.int32
        )
    print(to_dto(matrix))

