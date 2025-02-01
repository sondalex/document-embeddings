import { useEffect, useState } from "react";
import React from "react";

import { DuckDBProvider, useDuckDB } from "./context";
import { CardWithInputFiles } from "./card";
import { Card, CardContent } from "./components/ui/card";

import * as arrow from "apache-arrow";
import { H1 } from "./typography";

import { ColumnMapper } from "./mapper";
import { FileType } from "./file";
import { queryTable, querySimilarity } from "./queries";

import { convertArrowDataToJS, formatCell } from "./utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { CardHeader, CardTitle } from "./components/ui/card";
import { RowData } from "./types";

interface DataTableProps {
  db: AsyncDuckDB;
  query: string;
  onLoad: (names: string[]) => void;
  colorColumn?: string;
}

interface DataTableData {
  rows: RowData[];
  columnNames: string[];
}

const mapSwitchesToColor = (
  array: unknown[],
  color1: string,
  color2: string,
): string[] => {
  const colors: string[] = [];
  if (array.length === 0) {
    return colors;
  }

  colors.push(color1);
  const c = [color1, color2];
  let cswitch = false;

  for (let i = 1; i < array.length; i++) {
    if (array[i] !== array[i - 1]) {
      cswitch = !cswitch;
    }
    colors.push(c[+cswitch]);
  }

  return colors;
};

const DataTable: React.FC<DataTableProps> = ({
  db,
  query,
  onLoad,
  colorColumn,
}) => {
  const [data, setData] = useState<DataTableData>({
    rows: [],
    columnNames: [],
  });

  useEffect(() => {
    async function loadData() {
      if (db) {
        const c = await db.connect();
        const result = await c.query(query);

        if (result instanceof arrow.Table) {
          const columnNames = result.schema.fields.map((field) => field.name);
          const rows = convertArrowDataToJS(result);
          setData({ rows, columnNames });
          onLoad(columnNames);
        } else {
          console.error("The result is not an Arrow Table");
        }
      }
    }
    loadData();
  }, [db, query]);

  const colors = colorColumn
    ? mapSwitchesToColor(
        data.rows.map((row) => {
          return row[colorColumn];
        }),
        "bg-gray-100",
        "",
      )
    : data.rows.map(() => "");

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {/* Dynamically set columns based on table data */}
            {data.columnNames?.map((key) => (
              <TableHead key={key}>{key}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/*Color name*/}
          {data.rows?.map((row, index) => (
            <TableRow key={index} className={colors[index]}>
              {data.columnNames?.map((col, i) => (
                <TableCell key={i}>{formatCell(row[col], 10, 3)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

const TableView: React.FC = () => {
  const { db } = useDuckDB();
  const [isLoaded, setIsLoaded] = useState(false);
  const [queryNames, setQueryNames] = useState<string[]>([]);
  const [corpusNames, setCorpusNames] = useState<string[]>([]);
  const [queryEmbeddingColumn, setQueryEmbeddingColumn] = useState<
    string | null
  >(null);
  const [corpusEmbeddingColumn, setCorpusEmbeddingColumn] = useState<
    string | null
  >(null);
  const [queryColumn, setQueryColumn] = useState<string | null>(null);
  const [corpusColumn, setCorpusColumn] = useState<string | null>(null);

  const handleIsLoadedChange = (loaded: boolean) => {
    setIsLoaded(loaded);
  };

  const handleMapping = (column: string, embedding: string, type: FileType) => {
    if (type === "Query") {
      setQueryColumn(column);
      setQueryEmbeddingColumn(embedding);
    } else if (type === "Corpus") {
      setCorpusColumn(column);
      setCorpusEmbeddingColumn(embedding);
    }
  };
const renderTable = (
    query: string,
    title: string,
    db: AsyncDuckDB,
    onLoad: (names: string[]) => void,
  ) => {
    return (
      <Card className="w-full min-h-[300px] mt-4">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoaded ? (
            <DataTable  db={db} query={query} onLoad={onLoad} />
          ) : null}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Card className="w-full min-h-screen flex flex-col items-center py-10 space-y-10 px-10">
        {db ? (
          <>
            <CardWithInputFiles
              db={db}
              onIsLoadedChange={handleIsLoadedChange}
            />
            {renderTable(
              queryTable("local_query.parquet"),
              "Query",
              db,
              (names: string[]) => setQueryNames(names),
            )}
            {renderTable(
              queryTable("local_corpus.parquet"),
              "Corpus",
              db,
              (names: string[]) => setCorpusNames(names),
            )}

            <Card className="flex flex-col w-full space-y-8 min-h-[300px] h-1/3 ">
              <CardHeader>
                <CardTitle>Queries and Corpus vector similarity</CardTitle>
              </CardHeader>
              <CardContent>
                <h2 className="font-bold italic">
                  For each dataset, specify the embedding column and the column
                  from which the embedding were created
                </h2>

                <div className="flex flex-row">
                  <ColumnMapper
                    label="Query"
                    value1={undefined}
                    value2={undefined}
                    options={queryNames}
                    onChange={(value1, value2) => handleMapping(value1, value2, "Query")}
                  />
                  <ColumnMapper
                    label="Corpus"
                    value1={undefined}
                    value2={undefined}
                    options={corpusNames}
                    onChange={(value1, value2) => handleMapping(value1, value2, "Corpus")}
                  />
                </div>

                {queryEmbeddingColumn !== null &&
                corpusEmbeddingColumn !== null &&
                corpusColumn !== null &&
                queryColumn !== null ? (
                  <DataTable
                    db={db}
                    onLoad={() => null}
                    query={querySimilarity(
                      "local_query.parquet",
                      "local_corpus.parquet",
                      queryEmbeddingColumn,
                      corpusEmbeddingColumn,
                      queryColumn,
                      corpusColumn,
                    )}
                    colorColumn={queryColumn}
                  ></DataTable>
                ) : null}
              </CardContent>
            </Card>
          </>
        ) : null}
      </Card>
    </>
  );
};

const App: React.FC = () => {
  return (
    <div className="flex w-auto flex-col h-auto container mx-auto items-center">
      <H1>Document Embeddings and Similarity</H1>
      <DuckDBProvider>
        <TableView />
      </DuckDBProvider>
    </div>
  );
};

export default App;
