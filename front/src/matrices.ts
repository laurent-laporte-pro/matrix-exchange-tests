import {makeVector, Table} from "apache-arrow";
import {GridCell, GridCellKind, GridColumn, Item} from "@glideapps/glide-data-grid";

// Copied from antares-web
export interface MatrixType {
    columns: string[];
    index: Array<string | number>;
    data: number[][];
}

// Necessary properties to fill a glide data grid
export interface GlideTableProps {
    numRows: number;
    columns: GridColumn[];
    getter: (cell: Item) => GridCell;
}

export function arrowTableToMatrix(arrowTable: Table): MatrixType {
    const cols = arrowTable.schema.fields.map((f) => {
        return f.name;
    })
    const index = Array.from(Int32Array.from(
        {length: arrowTable.numRows},
        (_, i) => i));
    const data = Array.from({length: arrowTable.numRows},
        (_, row) => {
            return Array.from(Float32Array.from({length: cols.length},
                (_, col) => Number(arrowTable.getChildAt(col)?.get(row) ?? 0)
            ))
        }
    );
    return {
        columns: cols,
        index: index,
        data: data,
    }
}

export function matrixToArrowTable(matrix: MatrixType): Table<any> {
    const columns = Array.from({length: matrix.columns.length}, (_, col) => {
        const data = Float32Array.from(
            {length: matrix.index.length},
            (_, row) => matrix.data[row][col]);
        return makeVector(data);
    });

    const columnsObj = {}
    columns.forEach((c, i) => {
        // @ts-ignore
        columnsObj[i.toString()] = c;
    })

    return new Table(columnsObj);
}


export function arrowTableToGlide(arrowTable: Table): GlideTableProps {
    const cols = arrowTable.schema.fields.map((f) => {
        return {id: f.name, title: f.name};
    })
    return {
        numRows: arrowTable.numRows,
        columns: cols,
        getter: (cell: Item): GridCell => {
            const [col, row] = cell;
            // @ts-ignore
            const val = arrowTable.getChildAt(col).get(row);
            return {
                kind: GridCellKind.Number,
                allowOverlay: false,
                displayData: val.toFixed(1),
                data: val,
            };
        },
    }
}

export function matrixToGlide(matrix: MatrixType): GlideTableProps {
    const cols = matrix.columns.map((c) => {
        return {id: c, title: c};
    })
    return {
        numRows: matrix.index.length,
        columns: cols,
        getter: (cell: Item): GridCell => {
            const [col, row] = cell;
            // @ts-ignore
            const val = matrix.data[row][col];
            return {
                kind: GridCellKind.Number,
                allowOverlay: false,
                displayData: val.toFixed(1),
                data: val,
            };
        },
    }
}

export function createTestTable(): Table {
    const COLS = 10;
    const LENGTH = 500;

    const columns = Array.from({length: COLS}, () => {
        const data = Float32Array.from(
            {length: LENGTH},
            () => Number((Math.random() * 20).toFixed(1)));
        return makeVector(data);
    });

    const columnsObj = {}
    columns.forEach((c, i) => {
        // @ts-ignore
        columnsObj[i.toString()] = c;
    })

    return new Table(columnsObj);
}
