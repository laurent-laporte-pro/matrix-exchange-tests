import React, {useState} from 'react';
import './App.css';

import {DataEditor} from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";
import {
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel, Radio,
  RadioGroup,
  Stack,
  TextField
} from "@mui/material";
import {generateTable, getArrowTable, getJsonMatrix, MatrixStorageFormat, postArrowTable, postJsonMatrix} from "./api";
import {arrowTableToMatrix, matrixToArrowTable, matrixToGlide, MatrixType} from "./matrices";

interface TableGetterProps {
  onRefresh: (matrix: MatrixType) => void;
}

function RandomTableGetter(props: TableGetterProps): React.JSX.Element {
  const [numRows, setNumRows] = useState<number>(10);
  const [numCols, setNumCols] = useState<number>(10);
  const fetchData = () => {
    generateTable(numCols, numRows)
        .then((t) => {
          props.onRefresh(arrowTableToMatrix(t));
        })
  };

  return <Stack direction="row" spacing={2}>
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
    <Button variant="outlined" onClick={fetchData}>
      Generate
    </Button>
  </Stack>
}

type MatrixTransferFormat = 'json' | 'arrow';

interface TransferFormatChoiceProps {
    format: MatrixTransferFormat;
    onChange: (format: MatrixTransferFormat) => void;
}

function TransferFormatChoice(props: TransferFormatChoiceProps) {
  return (
    <FormControl variant="outlined">
      <FormLabel id="demo-row-radio-buttons-group-label">Transfer format</FormLabel>
      <RadioGroup
          row
          aria-labelledby="demo-row-radio-buttons-group-label"
          name="row-radio-buttons-group"
          value={props.format}
          onChange={(ev) => props.onChange(ev.target.value as MatrixTransferFormat)}
      >
        <FormControlLabel value="arrow" control={<Radio />} label="Arrow" />
        <FormControlLabel value="json" control={<Radio />} label="JSON" />
      </RadioGroup>
    </FormControl>
  )
}

interface StorageFormatChoiceProps {
    format: MatrixStorageFormat;
    onChange: (format: MatrixStorageFormat) => void;
}

function StorageFormatChoice(props: StorageFormatChoiceProps) {
    return (
        <FormControl variant="outlined">
            <FormLabel id="demo-row-radio-buttons-group-label">Storage format</FormLabel>
            <RadioGroup
                row
                aria-labelledby="demo-row-radio-buttons-group-label"
                name="row-radio-buttons-group"
                value={props.format}
                onChange={(ev) => props.onChange(ev.target.value as MatrixStorageFormat)}
            >
                <FormControlLabel value="hdf5" control={<Radio />} label="HDF5" />
                <FormControlLabel value="tsv" control={<Radio />} label="TSV" />
            </RadioGroup>
        </FormControl>
    )
}


interface MatrixManagerProps {
  onMatrixChange: (matrix: MatrixType) => void;
  matrix: MatrixType;
}

function MatrixManager(props: MatrixManagerProps) {

    const [format, setFormat] = useState<MatrixTransferFormat>("json");
    const [storageFormat, setStorageFormat] = useState<MatrixStorageFormat>("hdf5");
    const [matrixName, setMatrixName] = useState("");

    function fetchMatrix() {
        let matrix: Promise<MatrixType> | null = null;
        switch (format) {
            case "json":
                matrix = getJsonMatrix(matrixName, storageFormat);
                break;
            case "arrow":
                matrix = getArrowTable(matrixName, storageFormat).then(t => arrowTableToMatrix(t));
                break;
        }
        matrix?.then(m => props.onMatrixChange(m));
    }

    function post() {
        switch (format) {
            case "json":
                return postJsonMatrix(matrixName, storageFormat, props.matrix);
            case "arrow":
                const table = matrixToArrowTable(props.matrix);
                return postArrowTable(matrixName, storageFormat, table)
        }
    }

    return (
        <Stack direction="row" spacing={2}>
            <TextField
                size="small"
                value={matrixName}
                label="Matrix name"
                onChange={(e) => setMatrixName(e.target.value)}
            />
            <TransferFormatChoice format={format} onChange={setFormat}/>
            <StorageFormatChoice format={storageFormat} onChange={setStorageFormat}/>
            <Button variant="outlined" onClick={fetchMatrix} disabled={matrixName.length === 0}>Get</Button>
            <Button variant="outlined" onClick={post} disabled={matrixName.length === 0}>Post</Button>
        </Stack>
    );
}

function FullApp() {

  const [matrix, setMatrix] = useState<MatrixType>(
      {
        columns: ["column"],
        index: [],
        data: [],
      }
  );

  const glideTableProps = matrixToGlide(matrix);
  return (
      <div className="App">
        <Container>
          <Stack spacing={3} mt={3} divider={<Divider orientation="horizontal" flexItem />}>
            <RandomTableGetter onRefresh={setMatrix}/>
            <MatrixManager matrix={matrix} onMatrixChange={setMatrix}/>
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
                getCellContent={glideTableProps.getter}
                columns={glideTableProps.columns}
                rows={glideTableProps.numRows}
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
