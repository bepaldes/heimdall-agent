---
name: document-organizer
description: A pipeline for analyzing, deduplicating, and renaming large collections of files into a well-categorized structure using parallel subagents and robust scripts.
---

# Document Organizer Skill

This skill automates the process of investigating massive unorganized directories, parsing their contents across all file types, generating descriptive filenames, performing deep deduplication, and restructuring them into tailored, hierarchical categories.

## Pipeline Steps

When requested to organize a folder using this skill, strictly follow these steps sequentially:

### 0. Context Gathering
Always start by asking the user to provide a brief explanation or context about the contents of the target folder. This helps guide the categorization and rules (e.g., separating by client, trip, or preserving backups). Do not proceed until you have this context.

### 1. Data Assessment & Extraction
Write a python script `extract.py` in your scratch workspace that walks the target directory and processes ALL file types. 
- For PDFs/Docs, extract text (e.g., using `fitz`, `docx`).
- For Images, extract metadata or use OCR (e.g., `pytesseract`).
- For other file types, extract relevant metadata (size, extension, modification date).
- Save the results into a JSON file for analysis.

### 2. Folder Structure Proposal
Before moving files, analyze the extracted data and propose a suitable folder structure to the user (e.g., hierarchical folders like `Trips/Disney` or `Consultancy/ClientA`).
- Present the proposed structure for explicit user approval.
- Adjust based on user feedback (e.g., flat vs. hierarchical).

### 3. File Renaming (Parallel Processing)
Write scripts to divide the files into chunks and spawn parallel subagents (`invoke_subagent`) to propose intelligent, descriptive names based on content.
- Format: `Category/YYYYMM_Descriptive_Name.ext` (or similar standard conventions).
- Have them return a JSON mapping of `{ "old/path": "Category/YYYYMM_Descriptive_Name.ext" }`.

### 4. Deep Deduplication
Write a robust script `dedupe.py` that performs:
1. **Exact Binary Deduplication**: Compute SHA-256 hashes of all files to find and eliminate exact duplicates.
2. **Fuzzy & Content-Aware Deduplication**: Use techniques like perceptual image hashing (e.g., `imagehash`) for images, or fuzzy string matching (`difflib`) on filenames to catch resized or slightly modified duplicates. Keep the highest quality/largest version.
3. Validate significant fuzzy deletions with the user if unsure.

### 5. Review & Execution
1. Output a Markdown plan (`plan.md`) combining the renaming and deduplication plan.
2. Once the user reviews and approves, write `execute.py` that safely moves (`shutil.move()`) the files into the approved structure.
3. Clean up and delete any leftover empty directories.

## Tips
- Always seek user approval before destructive actions or massive restructurings.
- If a folder represents a backup (e.g., "Wordpress Backup"), confirm with the user if its internal structure should be preserved exactly as-is.
- Keep filenames clean, avoiding special characters and standardizing spaces.

## Prerequisites
If not already available, ensure the following Python packages are installed (using `pip install`) to execute these steps:
- `PyMuPDF` for PDF text extraction.
- `pytesseract` for image OCR (note: requires the Tesseract OCR engine installed on the OS).
- `Pillow` and `imagehash` for perceptual image deduplication.
- `python-docx` for Word documents.
