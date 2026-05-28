import io
import re
import zipfile
import xml.etree.ElementTree as ET
import pdfplumber

def parse_docx(file_bytes: bytes) -> str:
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as docx:
            xml_content = docx.read('word/document.xml')
            root = ET.fromstring(xml_content)
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            # Extract paragraphs and elements
            text_parts = []
            for elem in root.iter():
                if elem.tag.endswith('p'):
                    text_parts.append('\n')
                elif elem.tag.endswith('t'):
                    if elem.text:
                        text_parts.append(elem.text)
            
            # Combine and normalize text
            text = "".join(text_parts)
            text = re.sub(r'\n+', '\n', text).strip()
            return text
    except Exception as e:
        raise Exception(f"Failed to parse DOCX: {str(e)}")

def parse_rtf(file_bytes: bytes) -> str:
    try:
        text = file_bytes.decode('ascii', errors='ignore')
        # RTF control words regex
        pattern = re.compile(r'\\([a-z]{1,32}(-?\d{1,10})?[ ]?|[^a-z])', re.IGNORECASE)
        text_clean = pattern.sub('', text)
        text_clean = re.sub(r'[{}]', '', text_clean)
        # Normalize whitespace and endings
        text_clean = re.sub(r'\r\n|\r|\n', '\n', text_clean)
        text_clean = re.sub(r'[ \t]+', ' ', text_clean)
        text_clean = re.sub(r'\n+', '\n', text_clean).strip()
        return text_clean
    except Exception as e:
        raise Exception(f"Failed to parse RTF: {str(e)}")

def parse_doc(file_bytes: bytes) -> str:
    try:
        # Fallback string extraction for legacy .doc binary files (similar to strings utility)
        text = file_bytes.decode('ascii', errors='ignore')
        blocks = re.findall(r'[\x20-\x7E\s]{4,}', text)
        cleaned_blocks = []
        for b in blocks:
            if not re.search(r'[\x00-\x1F]', b) and len(b.strip()) > 3:
                cleaned_blocks.append(b.strip())
        result = " ".join(cleaned_blocks)
        result = re.sub(r'\s+', ' ', result).strip()
        if len(result) < 50:
            raise Exception("Legacy DOC file text could not be extracted. Please save as PDF or DOCX.")
        return result
    except Exception as e:
        raise Exception(f"Failed to extract text from DOC: {str(e)}")

def parse_resume(file_bytes: bytes, filename: str) -> str:
    """
    Parses resume from bytes, supporting PDF, DOCX, DOC, TXT, RTF.
    """
    ext = filename.split(".")[-1].lower()
    
    if ext == "pdf":
        try:
            text_content = []
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        text_content.append(text)
            parsed_text = "\n".join(text_content)
            if parsed_text.strip():
                # Normalize line endings
                parsed_text = re.sub(r'\r\n|\r', '\n', parsed_text)
                parsed_text = re.sub(r'[ \t]+', ' ', parsed_text)
                parsed_text = re.sub(r'\n\s*\n', '\n', parsed_text).strip()
                return parsed_text
            else:
                raise Exception("PDF appears to contain no text or only scanned images.")
        except Exception as e:
            print(f"pdfplumber failed: {e}")
            raise Exception(f"Failed to parse PDF: {str(e)}")
            
    elif ext == "docx":
        return parse_docx(file_bytes)
        
    elif ext == "rtf":
        return parse_rtf(file_bytes)
        
    elif ext == "doc":
        return parse_doc(file_bytes)
        
    elif ext in ["txt", "text"]:
        try:
            text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                text = file_bytes.decode("latin-1")
            except Exception as e:
                raise Exception(f"Failed to decode text file: {str(e)}")
        # Normalize
        text = re.sub(r'\r\n|\r', '\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\n+', '\n', text).strip()
        return text
                
    else:
        raise Exception("Unsupported file format. Please upload PDF, DOCX, DOC, TXT, or RTF.")
