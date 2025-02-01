"""
Compute embeddings
"""

from argparse import ArgumentParser
import os
from itertools import islice
from pathlib import Path
from typing import List, Literal
from warnings import warn

import numpy as np
import pandas as pd
from torch import no_grad
from transformers import AutoModel, AutoTokenizer, XLMRobertaModel, XLMRobertaTokenizer


def cli() -> ArgumentParser:
    parser = ArgumentParser("Compute embeddings from text")
    parser.add_argument("query_dataset", type=Path, action="store")
    parser.add_argument("corpus_dataset", type=Path, action="store")
    parser.add_argument(
        "output", type=Path, help="Filepath where the embeddings table should be saved"
    )
    parser.add_argument(
        "-cc", "--corpus-column", type=str, required=True, action="store"
    )
    parser.add_argument(
        "-qc", "--query-column", required=True, type=str, action="store"
    )
    parser.add_argument(
        "--model-path",
        required=False,
        default=Path("./models/jina-embeddings-v3"),
        # default=Path("./models/jina-embeddings-v2-base-en"),
        type=Path,
        action="store",
    )
    return parser


def read_parquet(path: Path) -> pd.DataFrame:
    assert path.is_file(), f"{path.as_posix()} is expected to be a file"
    df = pd.read_parquet(path)
    return df


def batch_generator(iterable, batch_size):
    """Helper function to create batches from a list."""
    it = iter(iterable)
    while batch := list(islice(it, batch_size)):
        yield batch


class JinaEmbeddings3Model:
    _return_tensors = "pt"

    def __init__(self, model: XLMRobertaModel, tokenizer: XLMRobertaTokenizer):
        self.model = model
        self.tokenizer = tokenizer

    def _encode(self, docs: List[str] | str, padding: bool, truncation: bool):
        if isinstance(docs, list) and padding is False:
            warn("It is recommended to set padding=True when docs is of type List[str]")
        encoded_input = self.tokenizer(
            docs,
            padding=padding,
            truncation=truncation,
            return_tensors=self._return_tensors,
        )

        return encoded_input

    def _infer(
        self,
        # encoded_input,
        docs,
        model_task: Literal[
            "retrieval.query",
            "retrieval.passage",
            "separation",
            "classification",
            "text-matching",
        ] = "retrieval.query",
    ):
        with no_grad():
            # return self.model.encode(**encoded_input)
            return self.model.encode(docs, task=model_task)

    def embed(
        self,
        docs: List[str],
        padding: bool = True,
        truncation: bool = True,
        batch_size: int = -1,
        model_task: Literal[
            "retrieval.query",
            "retrieval.passage",
            "separation",
            "classification",
            "text-matching",
        ] = "retrieval.query",
    ) -> np.ndarray:
        if batch_size <= 0:
            batch_size = len(docs)

        embeddings = []
        for batch in batch_generator(docs, batch_size):
            # encoded_input = self._encode(batch, padding, truncation)
            # output = self._infer(encoded_input, model_task)
            output = self._infer(docs, model_task)

            embeddings.append(output)

        return np.vstack(embeddings)


def init_model(model_path: Path) -> JinaEmbeddings3Model:
    """
    Returns
    -------
    An HuggingFace model
    """
    model = AutoModel.from_pretrained(
        pretrained_model_name_or_path=model_path, trust_remote_code=True
    )
    tokenizer = AutoTokenizer.from_pretrained(pretrained_model_name_or_path=model_path)
    model_name = model_path.name
    if model_name == "jina-embeddings-v3":
        return JinaEmbeddings3Model(model, tokenizer)
    raise ValueError(f"Model {model_name} not supported")


def embeddings(text: pd.Series, model) -> np.ndarray:
    docs = text.tolist()
    output = model.embed(docs)
    return output


def twod_array_to_list_array(x: np.ndarray):
    assert len(x.shape) == 2
    nrow = x.shape[0]
    return pd.Series([x[i, :] for i in range(nrow)])


def join(text: pd.Series, embeddings: np.ndarray) -> pd.DataFrame:
    embeddings = twod_array_to_list_array(embeddings)
    df = pd.concat([text, embeddings], axis=1, ignore_index=True)
    df.columns = [text.name, text.name + "_embedding"]
    return df


def save(queries: pd.DataFrame, corpus: pd.DataFrame, output: Path):
    assert output.is_dir(), "Expected output to be an existing directory"
    queries.to_parquet(os.path.join(output, "query.parquet"))
    corpus.to_parquet(os.path.join(output, "corpus.parquet"))


def _main():
    parser = cli()
    args = parser.parse_args()

    query_frame: pd.DataFrame = read_parquet(args.query_dataset)
    corpus_frame: pd.DataFrame = read_parquet(args.corpus_dataset)

    model = init_model(args.model_path)
    query = query_frame[args.query_column]
    corpus = corpus_frame[args.corpus_column]
    query_embeddings = embeddings(query, model)
    corpus_embeddings = embeddings(corpus, model)

    query = join(query, query_embeddings)
    corpus = join(corpus, corpus_embeddings)

    save(query, corpus, args.output)


def main() -> int:
    import sys

    try:
        _main()
    except Exception as e:
        print(e, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    import sys

    sys.exit(main())
