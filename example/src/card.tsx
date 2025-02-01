import * as React from "react";
import { useState } from "react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { AsyncDuckDB, DuckDBDataProtocol } from "@duckdb/duckdb-wasm";
import { FileSelector, FileType } from "./fileselect";
import { DEFAULT_QUERY_FILES, DEFAULT_CORPUS_FILES } from "./const";

function areSetsEqual(set1: Set<string>, set2: Set<string>): boolean {
  if (set1.size !== set2.size) return false;
  for (const item of set1) {
    if (!set2.has(item)) return false;
  }
  return true;
}

interface CardWithInputFilesProps {
  db: AsyncDuckDB;
  onIsLoadedChange: (isLoaded: boolean) => void;
}
const CardWithInputFiles = ({
  db,
  onIsLoadedChange,
}: CardWithInputFilesProps) => {
  const [loadedFiles, setLoadedFiles] = useState<Set<string>>(new Set());

  const expectedState = new Set(["Query", "Corpus"]);
  const isLoaded = areSetsEqual(loadedFiles, expectedState);

    const handleUpload = async (file: File | string, fileType: FileType, type: "Query" | "Corpus") => {
    const fileName = `local_${type.toLowerCase()}.parquet`;

    if (fileType === FileType.FILE) {
      await db.registerFileHandle(fileName, file, DuckDBDataProtocol.BROWSER_FILEREADER, true);
    } else if (fileType === FileType.DEFAULT) {
      await db.registerFileURL(fileName, file as string, DuckDBDataProtocol.HTTP, true);
    } else {
      throw new Error("Not supported");
    }

    setLoadedFiles((prevFiles) => new Set([...prevFiles, type]));
  };
  React.useEffect(() => {
    onIsLoadedChange(isLoaded);
  }, [isLoaded, onIsLoadedChange]);

  return (
    <Card className="w-full justify-center">
      <CardHeader>
        <CardTitle>Import Query and Corpus Embeddings dataset</CardTitle>
      </CardHeader>
      <CardContent>
        <form>
          <Card className="p-5 rounded-none w-1/2 shadow-none">
            <CardContent className="space-y-3">
              <div className="flex flex-col space-y-1.5">
                <FileSelector
                  defaultFiles={DEFAULT_QUERY_FILES}
                  label="Query"
                  onFileSelect={(file, fileType) => handleUpload(file, fileType, "Query")}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <FileSelector
                  defaultFiles={DEFAULT_CORPUS_FILES}
                  label="Corpus"
                  onFileSelect={(file, fileType) => handleUpload(file, fileType, "Corpus")}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between"></CardFooter>
    </Card>
  );
};
export { CardWithInputFiles };
