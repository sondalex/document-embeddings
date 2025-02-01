const querySimilarity = (
    queryFile: string,
    corpusFile: string,
    queryEmbeddingColumn: string,
    corpusEmbeddingColumn: string,
    queryColumn: string,
    corpusColumn: string

): string => {
    const query: string = `
    INSTALL vss;
    LOAD vss;

    -- Load all columns from the Parquet files
    CREATE TABLE Corpus AS
      SELECT *, 
        CAST(${corpusEmbeddingColumn} AS FLOAT[1024]) AS corpus_embedding
      FROM read_parquet('${corpusFile}');

    CREATE TABLE Query AS
      SELECT *, 
        CAST(${queryEmbeddingColumn} AS FLOAT[1024]) AS query_embedding
      FROM read_parquet('${queryFile}');

    -- Create the HNSW indexes on the embedding columns
    CREATE INDEX my_hnsw_index ON Corpus USING HNSW (corpus_embedding);
    CREATE INDEX my_hnsw_index2 ON Query USING HNSW (query_embedding);

    -- Perform the similarity search
    SELECT 
        q.${queryColumn},
        c.${corpusColumn},
        array_distance(q.query_embedding, c.corpus_embedding) AS distance
    FROM 
        Query q
    CROSS JOIN 
        Corpus c
    ORDER BY 
        ${queryColumn}, distance;
      `;

    return query;
};

const queryTable = (table: string) => {
    return `SELECT * FROM read_parquet('${table}')`;
};



export {querySimilarity, queryTable};
