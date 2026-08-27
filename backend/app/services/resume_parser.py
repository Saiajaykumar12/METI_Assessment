from io import BytesIO

from pypdf import PdfReader


def extract_resume_text(
    file_bytes: bytes,
    file_name: str,
) -> str:

    if not file_name.lower().endswith(".pdf"):
        raise ValueError(
            "Only PDF files are supported"
        )

    reader = PdfReader(
        BytesIO(file_bytes)
    )

    text = []

    for page in reader.pages:

        page_text = page.extract_text()

        if page_text:
            text.append(page_text)

    return "\n".join(text).strip()