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
    matrix = pd.DataFrame(np.random.random(size=(rows, cols)) * 1000, columns=[str(i) for i in range(0, cols)], dtype=np.float32)
    with io.BytesIO() as buffer:
        matrix.to_feather(buffer, compression="uncompressed")
        return Response(content=buffer.getvalue(), media_type="application/octet-stream")


@app.get("/matrix/arrow")
async def get_matrix_arrow(name: str, storage_format: str = "hdf5") -> Response:
    try:
        df = read_dataframe(name, storage_format)
    except FileNotFoundError as e:
        return Response(status_code=404)
    with io.BytesIO() as buffer:
        df.to_feather(buffer, compression="uncompressed")
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
async def get_matrix_json(name: str, storage_format: str = "hdf5"):
    try:
        df = read_dataframe(name, storage_format)
    except FileNotFoundError as e:
        raise starlette.exceptions.HTTPException(status_code=404)
    return df.to_dict(orient="split")


@app.post("/matrix/json")
async def post_matrix_json(matrix: MatrixContent, name: str, storage_format: str = "hdf5"):
    df = pd.DataFrame.from_records(matrix.data, columns=matrix.columns)
    try:
        write_dataframe(df, name, storage_format)
    except FileNotFoundError as e:
        raise starlette.exceptions.HTTPException(status_code=404)


def write_hdf5(df: pd.DataFrame, name: str):
    target_file = matrix_dir / f"{name}.hdf"
    if target_file.is_file():
        target_file.unlink()
    df.to_hdf(target_file, "data")


def write_tsv(df: pd.DataFrame, name: str):
    target_file = matrix_dir / f"{name}.tsv"
    if target_file.is_file():
        target_file.unlink()
    df.to_csv(target_file, sep="\t", float_format="%.18f")


WRITERS = {
    "hdf5": write_hdf5,
    "tsv": write_tsv
}

def write_dataframe(df: pd.DataFrame, name: str, format: str):
    WRITERS[format](df, name)


def read_hdf5(name: str) -> pd.DataFrame:
    file = matrix_dir / f"{name}.hdf"
    return pd.read_hdf(file)


def read_tsv(name: str) -> pd.DataFrame:
    target_file = matrix_dir / f"{name}.tsv"
    return pd.read_csv(target_file, sep="\t")


READERS = {
    "hdf5": read_hdf5,
    "tsv": read_tsv
}


def read_dataframe(name: str, format: str) -> pd.DataFrame:
    return READERS[format](name)


@app.post("/matrix/arrow")
async def post_matrix_file(content: Annotated[bytes, Body(media_type="application/octet-stream")], name: str, storage_format: str = "hdf5"):
    with io.BytesIO(content) as buffer:
        matrix = pd.read_feather(buffer)
    try:
        write_dataframe(matrix, name, storage_format)
    except FileNotFoundError as e:
        raise starlette.exceptions.HTTPException(status_code=404)

