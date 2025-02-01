import React, {
    createContext,
    useEffect,
    useState,
    ReactNode,
    useContext,
} from "react";
import { setupDuckDB } from "./db";
import * as duckdb from "@duckdb/duckdb-wasm";

interface DuckDBContextType {
    db: duckdb.AsyncDuckDB | null;
}

const DuckDBContext = createContext<DuckDBContextType>({ db: null });

interface DuckDBProviderProps {
    children: ReactNode;
}

export const DuckDBProvider: React.FC<DuckDBProviderProps> = ({ children }) => {
    const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);

    useEffect(() => {
        async function initializeDatabase() {
            const dbInstance = await setupDuckDB();
            setDb(dbInstance);
        }
        initializeDatabase();
    }, []);

    return (
        <DuckDBContext.Provider value={{ db }}>
            {db ? children : <div>Loading database...</div>}
        </DuckDBContext.Provider>
    );
};

export const useDuckDB = (): DuckDBContextType => useContext(DuckDBContext);
