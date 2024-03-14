import {Table, tableFromIPC, tableToIPC} from "apache-arrow";
import {MatrixType} from "./matrices";


export type MatrixStorageFormat = 'hdf5' | 'tsv';

export function postArrowTable(name: string, format: MatrixStorageFormat, table: Table): Promise<Response> {
    const ints = tableToIPC(table, "file");
    const blob = new Blob([ints], {type: "application/octet-stream"});
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: blob,
    };
    return fetch(`http://localhost:8000/matrix/arrow?name=${name}&storage_format=${format}`, requestOptions);
}

export function postJsonMatrix(name: string, format: MatrixStorageFormat, matrix: MatrixType): Promise<Response> {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matrix),
    };
    return fetch(`http://localhost:8000/matrix/json?name=${name}&storage_format=${format}`, requestOptions);
}


export function getArrowTable(name: string, format: MatrixStorageFormat): Promise<Table> {
    return tableFromIPC(
        fetch(`http://localhost:8000/matrix/arrow?name=${name}&storage_format=${format}`));
}

export function getJsonMatrix(name: string, format: MatrixStorageFormat): Promise<MatrixType> {
    return fetch(`http://localhost:8000/matrix/json?name=${name}&storage_format=${format}`)
        .then((r) => {
            return r.json() as Promise<MatrixType>
        });
}

export function generateTable(numCols: number, numRows: number): Promise<Table> {
    return tableFromIPC(
        fetch(`http://localhost:8000/matrix/generate?cols=${numCols}&rows=${numRows}`)
    );
}