# Document Embeddings 

Repository dedicated to illustrating the usage of vector embeddings for document search.

## Setup

Install the required Python packages:

```bash
pip install einops transformers torch
```

Download necessary models from Hugging Face:

```python
from huggingface_hub import snapshot_download

# Download models
snapshot_download("jinaai/xlm-roberta-flash-implementation")
snapshot_download("jinaai/jina-embeddings-v3")  # This might take a while, grab a coffee!
```

## Generate Embeddings

Run the following script to generate embeddings:

```bash
python scripts/embeddings.py -cc Review -qc Name tests/fixtures/query.parquet tests/fixtures/corpus.parquet embeddings/ --model-path jinaai/jina-embeddings-v3
```

- `-cc` and `-qc` are column selectors for the corpus and query respectively.

## Vector Search

Set up and execute vector search using DuckDB and the VSS extension:

```bash
duckdb
```

Install and load the VSS extension:

```sql
INSTALL vss;
LOAD vss;
```

Create tables for your corpus and query:

```sql
CREATE TABLE Corpus(
    Review VARCHAR,
    Review_embedding FLOAT[1024]
);

CREATE TABLE Query (
    Name VARCHAR,
    Name_embedding FLOAT[1024] 
);
```

Insert data from the parquet files:

```sql
INSERT INTO Corpus (Review, Review_embedding)
  SELECT Review, 
    CAST(Review_embedding AS FLOAT[1024])
  FROM read_parquet('embeddings/corpus.parquet');

INSERT INTO Query (Name, Name_embedding)
  SELECT Name, 
    CAST(Name_embedding AS FLOAT[1024])
  FROM read_parquet('embeddings/query.parquet');
```

Create HNSW indices for efficient vector search:

```sql
CREATE INDEX my_hnsw_index ON Corpus USING HNSW (Review_embedding);
CREATE INDEX my_hnsw_index2 ON Query USING HNSW (Name_embedding);
```

Execute the search query to find distances:

```sql
SELECT 
    q.Name AS Query_Name,
    c.Review AS Corpus_Review,
    array_distance(q.Name_embedding, c.Review_embedding) AS distance
FROM 
    Query q
CROSS JOIN 
    Corpus c
ORDER BY 
    Query_Name, distance;
```

Get the top results for each query:

```sql
SELECT 
    Query_Name,
    Corpus_Review,
    distance
FROM (
    SELECT 
        q.Name AS Query_Name,
        c.Review AS Corpus_Review,
        array_distance(q.Name_embedding, c.Review_embedding) AS distance,
        ROW_NUMBER() OVER (PARTITION BY q.Name ORDER BY array_distance(q.Name_embedding, c.Review_embedding) ASC) AS rank
    FROM 
        Query q
    CROSS JOIN 
        Corpus c
) ranked
WHERE rank <= 2
ORDER BY Query_Name, rank;
```

## Example Application

An example application is accessible [here](https://sondalex.github.io/document-embeddings/) 

Run the example application:

```bash
cd example && bun run dev
```

