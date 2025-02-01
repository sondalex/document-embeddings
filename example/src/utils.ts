import { Table, Vector } from "apache-arrow";

import {RowData} from "./types"

const isVector = (value: unknown): boolean => {
  return value instanceof Vector;
};

const vectorToArray = (vector: Vector): Array<unknown> => {
  const newArray = new Array<unknown>(vector.length);
  for (let i = 0; i < vector.length; i++) {
    const value = vector.get(i);
    newArray[i] = value;
  }
  return newArray;
};

const convertArrowDataToJS = (table: Table): RowData[] => {
  const rows: RowData[] = Array.from({ length: table.numRows }, () => ({}));

  for (const field of table.schema.fields) {
    for (const batch of table.batches) {
      const column = batch.getChild(field.name);
      if (column) {
        for (let i = 0; i < batch.numRows; i++) {
          const value = column.get(i);

          let castedValue;
          switch (typeof value) {
            case "number":
              castedValue = value;
              break;
            case "string":
              castedValue = value;
              break;
            case "boolean":
              castedValue = value;
              break;
            case "object":
              if (!isVector(value)) {
                throw Error("Unsupported arrow type, failed to cast object");
              }
              castedValue = vectorToArray(value);
              break;
            default:
              castedValue = value;
              break;
          }

          rows[i][field.name] = castedValue;
        }
      }
    }
  }
  return rows;
};

const formatCell = (
  value: string | number | unknown[] | null | boolean,
  n: number,
  precision?: number,
): string => {
  const formatNumber = (num: number): string => {
    return precision !== undefined ? num.toFixed(precision) : num.toString();
  };
  const formatArray = (array: unknown[]): Array<string> => {
    const newArray = new Array<string>();
    for (let i = 0; i < array.length; i++) {
      const value = array[i];
      if (typeof value === "number") {
        newArray.push(formatNumber(value));
      } else if (typeof value === "string") {
        newArray.push(value);
      } else {
        throw Error(`unsupported type ${typeof value}`);
      }
    }
    return newArray;
  };
  if (!value){
    return "N/A";
  }

  if (Array.isArray(value)) {
    const formattedArray = formatArray(value);

    if (formattedArray.length > n) {
      const half = Math.floor(n / 2);
      const start = formattedArray.slice(0, half);
      const end = formattedArray.slice(formattedArray.length - half);
      return `[${[...start, "...", ...end].join(", ")}]`;
    } else {
      return formattedArray.join(", ");
    }
  } else if (typeof value === "number") {
    return formatNumber(value);
  } else {
    return value.toString();
  }
};

export { convertArrowDataToJS, formatCell };
