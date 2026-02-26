import logging
import tempfile
import os
from pathlib import Path
from typing import Optional

# LangChain Community Loaders
from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    TextLoader,
    UnstructuredMarkdownLoader
)

logger = logging.getLogger(__name__)

class DocumentParser:
    """
    Parses various document formats into Markdown text.
    Strategies:
    - PDF: PyPDFLoader (Text extraction) -> Clean -> Markdown wrapper
    - Docx: Docx2txtLoader -> Text
    - Txt/Md: Direct read
    """
    
    @staticmethod
    def parse(file_path: str, mime_type: str) -> str:
        """
        Parse document from local path and return Markdown content.
        """
        ext = Path(file_path).suffix.lower()
        content = ""
        
        try:
            if ext == ".pdf":
                loader = PyPDFLoader(file_path)
                pages = loader.load()
                # Merge pages with page number indicators
                content = "\n\n".join([f"## Page {p.metadata.get('page', i+1)}\n{p.page_content}" for i, p in enumerate(pages)])
                
            elif ext in [".docx", ".doc"]:
                loader = Docx2txtLoader(file_path)
                docs = loader.load()
                content = "\n\n".join([d.page_content for d in docs])
                
            elif ext == ".txt":
                loader = TextLoader(file_path, encoding="utf-8")
                docs = loader.load()
                content = docs[0].page_content
                
            elif ext == ".md":
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
            
            else:
                # Fallback or error
                logger.warning(f"Unsupported extension {ext}, trying text load")
                loader = TextLoader(file_path, autodetect_encoding=True)
                docs = loader.load()
                content = docs[0].page_content

            return DocumentParser._clean_text(content)
            
        except Exception as e:
            logger.error(f"Failed to parse document {file_path}: {e}")
            raise ValueError(f"Document parsing failed: {str(e)}")

    @staticmethod
    def _clean_text(text: str) -> str:
        """
        Basic cleaning: remove excessive newlines, null bytes.
        """
        # Remove null bytes
        text = text.replace("\x00", "")
        # Normalize newlines
        # text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()
