/**
 * Premium Ingestion & Client-Side Text Extraction System
 * REZIQ — AI-Assisted Document Ingestion Pipeline
 */

// Helper to dynamically load external scripts in Next.js browser context safely
function loadScript(src: string, globalName: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Cannot load scripts outside browser context'));
      return;
    }

    // If script already exists or global is populated
    if ((window as any)[globalName]) {
      resolve((window as any)[globalName]);
      return;
    }

    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve((window as any)[globalName]));
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => {
      resolve((window as any)[globalName]);
    });
    script.addEventListener('error', (err) => {
      reject(new Error(`Failed to load dependency: ${src}`));
    });

    document.head.appendChild(script);
  });
}

// Pre-load dependencies gracefully (PDF.js and Mammoth.js)
export async function loadParsers(onProgress?: (status: string) => void): Promise<{ pdfjsLib: any; mammoth: any }> {
  if (onProgress) onProgress('Initializing parser dependencies...');

  try {
    // Load Mammoth first
    if (onProgress) onProgress('Calibrating DOCX processing engine...');
    const mammoth = await loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js',
      'mammoth'
    );

    // Load PDF.js Core
    if (onProgress) onProgress('Calibrating ATS PDF rendering framework...');
    const pdfjsLib = await loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
      'pdfjsLib'
    );

    // Configure PDF.js Worker Src
    if (pdfjsLib && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    return { pdfjsLib, mammoth };
  } catch (err: any) {
    console.error('Failed to load dynamic parsers:', err);
    throw new Error('Could not load parsing dependencies. Please verify your connection and try again.');
  }
}

/**
 * Text formatting normalization and cleanup logic
 */
export function normalizeExtractedText(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Remove non-printable control characters (excluding newlines/tabs/carriage-return)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

  // 3. Normalize vertical carriage returns and CRLFs to standard linebreaks
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 4. Clean up excessively broken line wrapping while keeping paragraphs intact
  // Often lists are parsed with a newline per bullet. We preserve list shapes.
  const lines = cleaned.split('\n');
  const polishedLines = lines.map((line) => {
    // Trim line content
    let l = line.trim();
    // Normalize spaces between characters
    l = l.replace(/\s+/g, ' ');
    return l;
  });

  // 5. Filter out empty lines but avoid eating paragraph spacing entirely
  const filteredLines: string[] = [];
  let consecutiveEmpties = 0;

  for (const line of polishedLines) {
    if (line === '') {
      consecutiveEmpties++;
      if (consecutiveEmpties <= 1) {
        filteredLines.push('');
      }
    } else {
      consecutiveEmpties = 0;
      filteredLines.push(line);
    }
  }

  // Combine back with clean line breaks
  let finalResult = filteredLines.join('\n');

  // 6. Final trim and remove redundant white-spacing
  finalResult = finalResult
    .replace(/[ \t]+/g, ' ') // collapse multi-spaces or tabs to single spaces
    .replace(/\n{3,}/g, '\n\n') // collapse triple newlines to double newlines
    .trim();

  return finalResult;
}

/**
 * Custom RTF formatting tag stripper
 */
export function parseRTF(rtfStr: string): string {
  // Replace standard control word delimiters for newlines
  let text = rtfStr.replace(/\\par[d]?\b|\\line\b/g, '\n');

  // Remove group tags like stylesheet tables, color tables, or font tables
  text = text.replace(/\{\\\*?[^{}]*\}/g, '');

  // Strip general formatting markers and resolve hex entities like \'92
  text = text.replace(/\\(?:[a-z]{1,32}(-?\d+)?|'([0-9a-f]{2})|.)/gi, (match, num, hex) => {
    if (hex) {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return '';
      }
    }
    return '';
  });

  // Clear outer control braces
  text = text.replace(/[{}]/g, '');

  return normalizeExtractedText(text);
}

export interface ExtractionResult {
  text: string;
  totalPages: number;
  extractedPages: number;
  failedPages: number[];
  ocrNeeded: boolean;
}

/**
 * Custom client-side binary byte scanner for old .doc files (OLE format)
 * Scans printable character streams while bypassing non-readable binary blobs
 * Now supports standard accented Latin-1 characters for international support
 */
export function parseBinaryDOC(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  let result = '';
  let tempBuffer = '';

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    // Keep standard readable printable ASCII chars (32 to 126), Latin-1 accented supplement (128 to 255), tabs (9), and linebreaks (10, 13)
    if ((b >= 32 && b <= 126) || (b >= 128 && b <= 255) || b === 9 || b === 10 || b === 13) {
      if (b === 13) {
        tempBuffer += '\n';
      } else {
        tempBuffer += String.fromCharCode(b);
      }
    } else {
      // Once a binary run starts, check if the previously read string block was substantial
      if (tempBuffer.length >= 6) {
        result += tempBuffer + ' ';
      }
      tempBuffer = '';
    }
  }
  if (tempBuffer.length >= 6) {
    result += tempBuffer;
  }

  // Remove common doc metadata blocks and formatting structures that contaminate raw text
  let cleaned = result
    .replace(/Normal\.dotm|Microsoft Word|Title|Subject|Author|Keywords|Template|Last Saved By|Revision Number/gi, '')
    .replace(/[^a-zA-Z0-9\s.,;:()\-–—_'"!?@&#$%\u00C0-\u00FF]/g, '') // keep standard accented characters in clean text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n');

  return normalizeExtractedText(cleaned);
}

/**
 * File parser dispatcher
 * Extracts full complete resume text client-side, returning page counts and diagnostic data
 */
export async function extractTextFromFile(
  file: File,
  onProgress?: (status: string) => void
): Promise<ExtractionResult> {
  const maxBytes = 15 * 1024 * 1024; // Support files up to 15MB+ as required
  if (file.size > maxBytes) {
    throw new Error('File size exceeds the premium 15MB limit.');
  }

  const fileType = file.name.split('.').pop()?.toLowerCase();
  
  if (onProgress) onProgress(`Reading document: ${file.name}...`);

  switch (fileType) {
    case 'txt': {
      if (onProgress) onProgress('Reading text file encoding...');
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = () => reject(new Error('Failed to read plain text file.'));
        reader.readAsText(file);
      });
      const normalized = normalizeExtractedText(text);
      return {
        text: normalized,
        totalPages: 1,
        extractedPages: 1,
        failedPages: [],
        ocrNeeded: normalized.length < 200
      };
    }

    case 'rtf': {
      if (onProgress) onProgress('Reading RTF document structure...');
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = () => reject(new Error('Failed to read RTF file.'));
        reader.readAsText(file);
      });
      const normalized = parseRTF(text);
      return {
        text: normalized,
        totalPages: 1,
        extractedPages: 1,
        failedPages: [],
        ocrNeeded: normalized.length < 200
      };
    }

    case 'docx': {
      const { mammoth } = await loadParsers(onProgress);
      if (onProgress) onProgress('Converting DOCX nodes to plain text...');
      
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as ArrayBuffer) || new ArrayBuffer(0));
        reader.onerror = () => reject(new Error('Failed to process DOCX file bytes.'));
        reader.readAsArrayBuffer(file);
      });

      if (arrayBuffer.byteLength === 0) {
        throw new Error('The uploaded file is empty.');
      }

      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.messages && result.messages.length > 0) {
        console.warn('Mammoth parser messages:', result.messages);
      }
      const normalized = normalizeExtractedText(result.value);
      return {
        text: normalized,
        totalPages: 1,
        extractedPages: 1,
        failedPages: [],
        ocrNeeded: normalized.length < 200
      };
    }

    case 'doc': {
      if (onProgress) onProgress('Scanning binary Word document structures client-side...');
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as ArrayBuffer) || new ArrayBuffer(0));
        reader.onerror = () => reject(new Error('Failed to process binary DOC file bytes.'));
        reader.readAsArrayBuffer(file);
      });

      if (arrayBuffer.byteLength === 0) {
        throw new Error('The uploaded file is empty.');
      }

      const normalized = parseBinaryDOC(arrayBuffer);
      return {
        text: normalized,
        totalPages: 1,
        extractedPages: 1,
        failedPages: [],
        ocrNeeded: normalized.length < 200
      };
    }

    case 'pdf': {
      const { pdfjsLib } = await loadParsers(onProgress);
      if (onProgress) onProgress('Analyzing PDF page counts and layout blocks...');

      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as ArrayBuffer) || new ArrayBuffer(0));
        reader.onerror = () => reject(new Error('Failed to process PDF file bytes.'));
        reader.readAsArrayBuffer(file);
      });

      if (arrayBuffer.byteLength === 0) {
        throw new Error('The uploaded file is empty.');
      }

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      const totalPages = pdf.numPages;
      let extractedPages = 0;
      const failedPages: number[] = [];

      for (let i = 1; i <= totalPages; i++) {
        if (onProgress) onProgress(`Extracting credentials from PDF page ${i} of ${totalPages}...`);
        
        let success = false;
        let retries = 3;
        let pageText = '';

        while (retries > 0 && !success) {
          try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Layout-preserving Y-coordinate alignment. Avoids page flattening
            pageText = textContent.items
              .map((item: any, idx: number) => {
                if (idx === 0) return item.str || '';
                const prevItem = textContent.items[idx - 1] as any;
                const currentStr = item.str || '';
                
                if (item.transform && prevItem.transform) {
                  const prevY = prevItem.transform[5];
                  const currentY = item.transform[5];
                  const height = item.height || Math.abs(item.transform[3]) || 10;
                  
                  // Significant shift in Y coordinate signifies a newline
                  if (Math.abs(currentY - prevY) > height * 0.5) {
                    return '\n' + currentStr;
                  }
                }
                return ' ' + currentStr;
              })
              .join('');
              
            success = true;
            extractedPages++;
          } catch (pageErr) {
            console.error(`Page ${i} extraction failed. Retrying...`, pageErr);
            retries--;
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
          }
        }

        if (success) {
          text += pageText + '\n\n';
        } else {
          failedPages.push(i);
          console.error(`Page ${i} permanently failed to extract after multiple retries.`);
        }
      }

      const normalized = normalizeExtractedText(text);
      const totalLetters = (normalized.match(/[a-zA-Z]/g) || []).length;
      const characterDensityRatio = normalized.length > 0 ? totalLetters / normalized.length : 0;
      // High-precision low-density / scan PDF detection
      const ocrNeeded = normalized.length < 200 || totalLetters < 100 || (normalized.length > 0 && characterDensityRatio < 0.35);

      return {
        text: normalized,
        totalPages,
        extractedPages,
        failedPages,
        ocrNeeded
      };
    }

    default:
      throw new Error(`Unsupported document extension: .${fileType}. Please use PDF, DOCX, DOC, TXT, or RTF.`);
  }
}
