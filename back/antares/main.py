import io
from pathlib import Path
from typing import List, Union, cast, Annotated

import starlette.exceptions
from fastapi import FastAPI, Body
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import Response
import numpy as np
import pandas as pd

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


matrix_dir = Path("/home/leclercsyl/feature_tests/antares/apache-arrow/matrices")

@app.get("/matrix/generate")
async def generate_matrix(rows: int = 8760, cols: int = 200) -> Response:
    matrix = pd.DataFrame(np.random.randint(0, 100, size=(rows, cols)), columns=[str(i) for i in range(0, cols)], dtype=np.int32)
    with io.BytesIO() as buffer:
        matrix.to_feather(buffer, compression="uncompressed")
        return Response(content=buffer.getvalue(), media_type="application/octet-stream")


@app.get("/matrix/arrow")
async def get_matrix_arrow(name: str) -> Response:
    file = matrix_dir / name
    try:
        matrix = pd.read_hdf(file)
    except FileNotFoundError as e:
        return Response(status_code=404)
    with io.BytesIO() as buffer:
        matrix.to_feather(buffer, compression="uncompressed")
        return Response(content=buffer.getvalue(), media_type="application/octet-stream")


MatrixData = float

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


@app.get("/matrix/json")
async def get_matrix_json(name: str):
    file = matrix_dir / name
    try:
        matrix = pd.read_hdf(file)
    except FileNotFoundError as e:
        raise starlette.exceptions.HTTPException(status_code=404)
    return matrix.to_dict(orient="split")


@app.post("/matrix/json")
async def post_matrix_json(matrix: MatrixContent, name: str):
    df = pd.DataFrame.from_records(matrix.data, columns=matrix.columns)
    target_file = matrix_dir / name
    try:
        if target_file.is_file():
            target_file.unlink()
        df.to_hdf(target_file, "data")
    except FileNotFoundError as e:
        raise starlette.exceptions.HTTPException(status_code=404)


@app.post("/matrix/arrow")
async def post_matrix_file(content: Annotated[bytes, Body(media_type="application/octet-stream")], name: str):
    with io.BytesIO(content) as buffer:
        matrix = pd.read_feather(buffer)
    target_file = matrix_dir / name
    try:
        if target_file.is_file():
            target_file.unlink()
        matrix.to_hdf(target_file, "data")
    except FileNotFoundError as e:
        raise starlette.exceptions.HTTPException(status_code=404)

