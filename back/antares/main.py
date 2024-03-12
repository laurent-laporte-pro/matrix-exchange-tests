import io
from pathlib import Path
from typing import List, Union, cast

import starlette.exceptions
from fastapi import FastAPI
from pydantic import BaseModel
from starlette.responses import Response
import numpy as np
import pandas as pd

app = FastAPI()

matrix_dir = Path("/home/leclercsyl/feature_tests/antares/apache-arrow/matrices")

@app.get("/matrix")
async def get_matrix(rows: int = 8760, cols: int = 200) -> Response:
    matrix = pd.DataFrame(np.random.randint(0, 100, size=(rows, cols)), columns=[str(i) for i in range(0, cols)], dtype=np.int32)
    with io.BytesIO() as buffer:
        matrix.to_feather(buffer, compression="uncompressed")
        return Response(content=buffer.getvalue(), media_type="application/octet-stream", headers={
            "Access-Control-Allow-Origin": "*"
        })


@app.get("/matrixfile")
async def get_matrix_file(name: str) -> Response:
    file = matrix_dir / name
    try:
        matrix = pd.read_hdf(file)
    except FileNotFoundError as e:
        return Response(status_code=404)
    with io.BytesIO() as buffer:
        matrix.to_feather(buffer, compression="uncompressed")
        return Response(content=buffer.getvalue(), media_type="application/octet-stream", headers={
            "Access-Control-Allow-Origin": "*"
        })


MatrixData = float


class MatrixDTO(BaseModel):
    width: int
    height: int
    index: List[str]
    columns: List[str]
    data: List[List[MatrixData]]
    created_at: int = 0
    id: str = ""


class MatrixContent(BaseModel):
    """
    Matrix content (Data Frame array)

    Attributes:
        data: A 2D-array matrix of floating point values.
        index: A list of row indexes or names.
        columns: A list of columns indexes or names.
    """

    data: List[List[MatrixData]]
    index: List[Union[int, str]]
    columns: List[Union[int, str]]


def to_dto(matrix: pd.DataFrame) -> MatrixContent:
    np_matrix = matrix.to_numpy()
    np_matrix = np_matrix.reshape((1, 0)) if matrix.size == 0 else np_matrix
    data = np_matrix.tolist()
    index = list(range(np_matrix.shape[0]))
    columns = list(range(np_matrix.shape[1]))
    return MatrixContent.construct(data=data, columns=columns, index=index)


@app.get("/matrixfilejson")
async def get_matrix_file_json(name: str, response: Response):
    file = matrix_dir / name
    try:
        matrix = pd.read_hdf(file)
    except FileNotFoundError as e:
        raise starlette.exceptions.HTTPException(status_code=404)
    response.headers["Access-Control-Allow-Origin"] = "*"

    return matrix.to_dict(orient="split")
