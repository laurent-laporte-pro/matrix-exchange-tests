import React, {useCallback, useState} from 'react';
import './App.css';

import {makeVector, Table, tableFromIPC} from "apache-arrow";
import {DataEditor, GridCell, GridCellKind, GridColumn, Item} from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";
import {Box, Button, Container, Divider, Stack, TextField} from "@mui/material";
import {Unstable_NumberInput as NumberInput} from "@mui/base/Unstable_NumberInput";

function createTable(): Table {
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

interface TableProps {
  numRows: number;
  columns: GridColumn[];
  getter: (cell: Item) => GridCell;
}

export interface MatrixType {
  columns: string[];
  index: Array<string | number>;
  data: number[][];
}

function arrowTableToProps(arrowTable: Table): TableProps {
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
        displayData: val.toString(),
        data: val,
      };
    },
  }
}

function matrixToProps(matrix: MatrixType): TableProps {
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
        displayData: val.toString(),
        data: val,
      };
    },
  }
}

interface TableGetterProps {
  onRefresh: (table: TableProps) => void;
}

function RandomTableGetter(props: TableGetterProps): React.JSX.Element {
  const [numRows, setNumRows] = useState<number | null>(10);
  const [numCols, setNumCols] = useState<number | null>(10);
  const fetchData = useCallback(() => {
    tableFromIPC(
        fetch(`http://localhost:8000/matrix?cols=${numCols}&rows=${numRows}`))
        .then((t) => {
          props.onRefresh(arrowTableToProps(t));
        })
  }, [numRows, numCols]);

  return <Stack direction="row" spacing={2}>
    <Stack spacing={2}>
      <TextField
          label="Rows"
          type="number"
          size="small"
          value={numRows}
          onChange={(event) => setNumRows(+event.target.value)}
      />
      <TextField
          label="Columns"
          type="number"
          size="small"
          value={numCols}
          onChange={(event) => setNumCols(+event.target.value)}
      />
    </Stack>
    <Button onClick={fetchData}>
      Fetch Arrow random generated
    </Button>
  </Stack>
}

function FileTableGetter(props: TableGetterProps) {

  const [matrixName, setMatrixName] = useState<string>("");
  const fetchFromFile = useCallback(() => {
    tableFromIPC(
        fetch(`http://localhost:8000/matrixfile?name=${matrixName}`))
        .then((t) => {
          props.onRefresh(arrowTableToProps(t));
        })
  }, [matrixName]);

  return <Stack direction="row" spacing={2}>
    <TextField
        size="small"
        value={matrixName}
        label="Matrix name"
        onChange={(e) => setMatrixName(e.target.value)}
    />
    <Button onClick={fetchFromFile}>
      Fetch Arrow from HDF5 file
    </Button>
  </Stack>
}

function JsonGetter(props: TableGetterProps) {

  const [matrixName, setMatrixName] = useState<string>("");
  const fetchFromFile = useCallback(() => {
    fetch(`http://localhost:8000/matrixfilejson?name=${matrixName}`)
        .then((r) => {
          return r.json() as Promise<MatrixType>
        })
        .then((m) => {
          props.onRefresh(matrixToProps(m));
        })
  }, [matrixName]);

  return <Stack direction="row" spacing={2}>
    <TextField
        size="small"
        value={matrixName}
        label="Matrix name"
        onChange={(e) => setMatrixName(e.target.value)}
    />
    <Button onClick={fetchFromFile}>
      Fetch JSON from HDF5 file
    </Button>
  </Stack>
}

function FullApp() {
  const [table, setTable] = useState<TableProps>(
      {
        numRows: 0,
        columns: [{id: "c", title: "c"}],
        getter: (cell) => {
          throw new Error("Should not be called")
        },
      }
  )

  return (
      <div className="App">
        <Container>
          <Stack spacing={3} mt={3} divider={<Divider orientation="horizontal" flexItem />}>
            <RandomTableGetter onRefresh={setTable}/>
            <FileTableGetter onRefresh={setTable}/>
            <JsonGetter onRefresh={setTable}/>
          </Stack>
          <Box
              m={2}
              width="100%"
              height="800px"
              display="flex"
              flexDirection="column"
              alignItems="center"
              boxSizing="border-box"
              overflow="auto">
            <DataEditor
                smoothScrollX={true}
                smoothScrollY={true}
                getCellsForSelection={true}
                width="100%"
                getCellContent={table.getter}
                columns={table.columns}
                rows={table.numRows}
                rowMarkers="number"
            />
          </Box>
        </Container>
      </div>
  );
}

function App() {
  return <FullApp/>;
}

export default App;
