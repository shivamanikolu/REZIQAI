/**
 * Production-Grade Forensic Resume Ingestion & Document Intelligence Engine
 * REZIQ — Heuristic Parsing, Structured Section Reconstruction, & Token Optimization
 */

export interface ExtractedMetadata {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  portfolio: string;
  sections: Record<string, string>;
  reconstructedMarkdown: string;
  rawLength: number;
  optimizedLength: number;
  compressionRatio: number;
  confidenceScore: number;
  confidenceLabel: 'Excellent' | 'Partial' | 'Low';
  readabilityScore: number;
  ocrNeeded: boolean;
  isIncomplete?: boolean;
  diagnostics: {
    format: string;
    parsingDurationMs: number;
    wordCount: number;
    actionsCount: number;
    metricsCount: number;
    sectionsFound: string[];
    redundanciesStripped: boolean;
    characterDensityRatio: number;
    totalPages?: number;
    extractedPages?: number;
    failedPages?: number[];
  };
}

// Custom lists of action verbs and metrics indicators
const ACTION_VERBS = [
  'led', 'developed', 'designed', 'managed', 'built', 'optimized', 'scaled', 'created',
  'improved', 'executed', 'directed', 'architected', 'spearheaded', 'implemented', 'orchestrated',
  'engineered', 'accelerated', 'pioneered', 'transformed', 'delivered', 'automated'
];

/**
 * Main parser entry-point that analyzes raw extracted text and converts it into structured intelligence.
 */
export function processResumeIntelligence(
  rawText: string,
  fileType: string,
  startTime: number,
  extractionMeta?: {
    totalPages: number;
    extractedPages: number;
    failedPages: number[];
    ocrNeeded: boolean;
  }
): ExtractedMetadata {
  const parsingDurationMs = Date.now() - startTime;
  
  if (!rawText || rawText.trim().length === 0) {
    return createEmptyMetadata(fileType, parsingDurationMs);
  }

  // 1. OCR / Scan-Based Fallback Detection
  const totalChars = rawText.length;
  const alphaChars = (rawText.match(/[a-zA-Z]/g) || []).length;
  const characterDensityRatio = totalChars > 0 ? alphaChars / totalChars : 0;
  
  const ocrNeeded = extractionMeta
    ? extractionMeta.ocrNeeded
    : (totalChars < 200 || alphaChars < 100 || (totalChars > 0 && characterDensityRatio < 0.35));

  // 2. Token Optimization and Redundancy Stripping
  const { optimizedText, strippedRedundancies } = optimizeTokenFootprint(rawText);

  // 3. Entity Classification (Name, Email, Contact Links)
  const email = extractEmail(optimizedText);
  const phone = extractPhone(optimizedText);
  const { linkedin, github, portfolio } = extractLinks(optimizedText);
  const name = extractName(optimizedText, email);

  // 4. Dynamic Section Classification & Reconstruction (100% Non-Destructive)
  const { coreSections, dynamicSections, sectionSequence, preSectionContent } = classifySections(optimizedText);

  // 5. Compute Readability & ATS Heuristics
  const readabilityScore = calculateReadabilityScore(optimizedText, coreSections);

  // 6. Compute Extraction Confidence Index
  const { confidenceScore, confidenceLabel } = calculateConfidenceIndex(
    totalChars,
    coreSections,
    email,
    name,
    ocrNeeded
  );

  // 7. Structured Reconstruct Markdown Output (100% complete!)
  const reconstructedMarkdown = buildReconstructedMarkdown(
    name,
    email,
    phone,
    linkedin,
    github,
    portfolio,
    preSectionContent,
    sectionSequence,
    dynamicSections
  );

  // 8. Diagnostics Collection
  const wordCount = optimizedText.split(/\s+/).filter(Boolean).length;
  const actionsCount = countActionVerbs(optimizedText);
  const metricsCount = countQuantitativeMetrics(optimizedText);
  const sectionsFound = sectionSequence.map(s => s.title);

  // 9. Validation Heuristics for Suspicious/Incomplete Extractions
  const failedCount = extractionMeta?.failedPages?.length || 0;
  const missingCore = !coreSections.EXPERIENCE || coreSections.EXPERIENCE.trim().length < 50;
  const isIncomplete = totalChars < 300 || failedCount > 0 || missingCore;

  return {
    name,
    email,
    phone,
    linkedin,
    github,
    portfolio,
    sections: coreSections,
    reconstructedMarkdown,
    rawLength: totalChars,
    optimizedLength: optimizedText.length,
    compressionRatio: totalChars > 0 ? Math.round(((totalChars - optimizedText.length) / totalChars) * 100) : 0,
    confidenceScore,
    confidenceLabel,
    readabilityScore,
    ocrNeeded,
    isIncomplete,
    diagnostics: {
      format: fileType.toUpperCase(),
      parsingDurationMs,
      wordCount,
      actionsCount,
      metricsCount,
      sectionsFound,
      redundanciesStripped: strippedRedundancies,
      characterDensityRatio: parseFloat(characterDensityRatio.toFixed(2)),
      totalPages: extractionMeta?.totalPages || 1,
      extractedPages: extractionMeta?.extractedPages || 1,
      failedPages: extractionMeta?.failedPages || []
    }
  };
}

/**
 * Robust Email Extractor
 */
function extractEmail(text: string): string {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
  const match = text.match(emailRegex);
  return match ? match[0].trim() : '';
}

/**
 * Flexible Phone Number Extractor
 */
function extractPhone(text: string): string {
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const matches = text.match(phoneRegex);
  return matches && matches.length > 0 ? matches[0].trim() : '';
}

/**
 * Links Extractor (LinkedIn, GitHub, Portfolio)
 */
function extractLinks(text: string): { linkedin: string; github: string; portfolio: string } {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const urls = text.match(urlRegex) || [];
  
  let linkedin = '';
  let github = '';
  let portfolio = '';

  for (const url of urls) {
    const cleanUrl = url.replace(/[.,;)]+$/, ''); // clean tail symbols
    if (/linkedin\.com\/in\//i.test(cleanUrl) && !linkedin) {
      linkedin = cleanUrl;
    } else if (/github\.com\//i.test(cleanUrl) && !github) {
      github = cleanUrl;
    } else if (!portfolio && !/linkedin\.com/i.test(cleanUrl) && !/github\.com/i.test(cleanUrl)) {
      portfolio = cleanUrl;
    }
  }

  return { linkedin, github, portfolio };
}

/**
 * Heuristic Name Extractor (Avoids rigid Regexes)
 */
function extractName(text: string, email: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Look at first 4 lines of resume
  const candidateLines = lines.slice(0, 4);
  
  for (const line of candidateLines) {
    // Exclude links, emails, numbers
    if (line.includes('@') || line.includes('http') || line.includes('/') || line.includes(':')) {
      continue;
    }
    
    // Check if line contains 2-3 words (First Middle Last name shape)
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4) {
      const allCapitalized = words.every(word => /^[A-Z][a-zA-Z-]*$/.test(word));
      const hasDigitOrSymbol = /[\d!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`]/.test(line);
      
      if (allCapitalized && !hasDigitOrSymbol) {
        return line;
      }
    }
  }

  // Fallback 1: Extract username part of email if available
  if (email) {
    const part = email.split('@')[0];
    const nameStr = part
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    if (nameStr.length > 2) return nameStr;
  }

  return 'Candidate Profile';
}

/**
 * Heuristic Section Classifier
 */
function classifySections(text: string): {
  coreSections: Record<string, string>;
  dynamicSections: Record<string, string>;
  sectionSequence: { key: string; title: string }[];
  preSectionContent: string;
} {
  const lines = text.split('\n');
  
  const headerKeywords = [
    'summary', 'profile', 'professional summary', 'executive summary', 'about me', 'career objective', 'objective', 'professional profile', 'biography', 'intro', 'introduction',
    'experience', 'work experience', 'professional experience', 'employment history', 'work history', 'career history', 'employment', 'experience summary', 'professional background', 'relevant experience', 'history',
    'projects', 'personal projects', 'key projects', 'selected projects', 'portfolio', 'academic projects', 'technical projects', 'featured projects', 'open source',
    'skills', 'technical skills', 'core competencies', 'technologies', 'expertise', 'areas of expertise', 'specializations', 'proficiencies', 'toolbelt', 'tools', 'languages & technologies', 'technical proficiencies', 'skills & expertise',
    'education', 'academic background', 'academic credentials', 'qualifications', 'academic history', 'education and credentials', 'educational background', 'credentials', 'academic qualifications',
    'certifications', 'licenses', 'certifications & licenses', 'awards', 'certifications/licenses', 'professional certifications', 'honors & awards', 'honors', 'patents', 'publications', 'languages', 'interests', 'volunteer', 'volunteering', 'activities', 'affiliations', 'professional memberships', 'extracurricular', 'extracurricular activities', 'leadership'
  ];

  const dynamicSections: Record<string, string> = {};
  const sectionSequence: { key: string; title: string }[] = [];
  let preSectionContent = '';
  
  let currentSectionKey = '';
  let currentBuffer: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentSectionKey) {
        currentBuffer.push(line);
      } else {
        preSectionContent += line + '\n';
      }
      continue;
    }

    const isBullet = /^[•\-\*■❑◦\d+\.]/.test(trimmed);
    let isHeader = false;
    let cleanHeader = '';

    if (trimmed.length < 50 && !isBullet) {
      const normalizedLine = trimmed.toLowerCase().replace(/[^a-z\s&/,\-]/g, '').trim();
      if (headerKeywords.includes(normalizedLine)) {
        isHeader = true;
        cleanHeader = trimmed;
      }
    }

    if (isHeader) {
      if (currentSectionKey) {
        dynamicSections[currentSectionKey] = currentBuffer.join('\n');
      }
      
      const secKey = cleanHeader.toUpperCase().replace(/[^A-Z0-9]/g, '_') + '_' + sectionSequence.length;
      currentSectionKey = secKey;
      dynamicSections[currentSectionKey] = '';
      sectionSequence.push({ key: secKey, title: cleanHeader });
      currentBuffer = [];
    } else {
      if (currentSectionKey) {
        currentBuffer.push(line);
      } else {
        preSectionContent += line + '\n';
      }
    }
  }

  if (currentSectionKey) {
    dynamicSections[currentSectionKey] = currentBuffer.join('\n');
  }

  const coreSections: Record<string, string> = {
    SUMMARY: '',
    EXPERIENCE: '',
    PROJECTS: '',
    SKILLS: '',
    EDUCATION: '',
    CERTIFICATIONS: ''
  };

  const summaryKeywords = ['summary', 'profile', 'professional summary', 'executive summary', 'about me', 'career objective', 'objective', 'professional profile', 'biography', 'intro', 'introduction'];
  const experienceKeywords = ['experience', 'work experience', 'professional experience', 'employment history', 'work history', 'career history', 'employment', 'experience summary', 'professional background', 'relevant experience', 'history'];
  const projectsKeywords = ['projects', 'personal projects', 'key projects', 'selected projects', 'portfolio', 'academic projects', 'technical projects', 'featured projects', 'open source'];
  const skillsKeywords = ['skills', 'technical skills', 'core competencies', 'technologies', 'expertise', 'areas of expertise', 'specializations', 'proficiencies', 'toolbelt', 'tools', 'languages & technologies', 'technical proficiencies', 'skills & expertise'];
  const educationKeywords = ['education', 'academic background', 'academic credentials', 'qualifications', 'academic history', 'education and credentials', 'educational background', 'credentials', 'academic qualifications'];

  for (const { key, title } of sectionSequence) {
    const normTitle = title.toLowerCase().replace(/[^a-z\s&/]/g, '').trim();
    const content = dynamicSections[key] || '';
    
    if (summaryKeywords.some(kw => normTitle.includes(kw))) {
      coreSections.SUMMARY += (coreSections.SUMMARY ? '\n\n' : '') + content;
    } else if (experienceKeywords.some(kw => normTitle.includes(kw))) {
      coreSections.EXPERIENCE += (coreSections.EXPERIENCE ? '\n\n' : '') + content;
    } else if (projectsKeywords.some(kw => normTitle.includes(kw))) {
      coreSections.PROJECTS += (coreSections.PROJECTS ? '\n\n' : '') + content;
    } else if (skillsKeywords.some(kw => normTitle.includes(kw))) {
      coreSections.SKILLS += (coreSections.SKILLS ? '\n\n' : '') + content;
    } else if (educationKeywords.some(kw => normTitle.includes(kw))) {
      coreSections.EDUCATION += (coreSections.EDUCATION ? '\n\n' : '') + content;
    } else {
      coreSections.CERTIFICATIONS += (coreSections.CERTIFICATIONS ? '\n\n' : '') + content;
    }
  }

  return { coreSections, dynamicSections, sectionSequence, preSectionContent };
}

/**
 * Token Optimization and Redundancy Stripping
 */
function optimizeTokenFootprint(text: string): { optimizedText: string; strippedRedundancies: boolean } {
  let originalLength = text.length;
  let cleaned = text;

  // 1. Remove repeated page header/footer numbers (e.g. "Page 1 of 3", "Page 2", "1 / 4")
  cleaned = cleaned.replace(/(?:page|pg\.?)\s*\d+(?:\s*(?:of|\|\/)\s*\d+)?/gi, '');
  cleaned = cleaned.replace(/(?:\b\d+\s*\/\s*\d+\b)/g, '');

  // 2. Remove visible binary symbols or PDF artifacts
  cleaned = cleaned.replace(/[\uFFFD\u200B\uFEFF]/g, '');

  // 3. De-duplicate consecutive whitespace, tab, and newline gaps
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return {
    optimizedText: cleaned.trim(),
    strippedRedundancies: cleaned.length < originalLength
  };
}

/**
 * Calculate Extraction Confidence Index
 */
function calculateConfidenceIndex(
  rawLength: number,
  sections: Record<string, string>,
  email: string,
  name: string,
  ocrNeeded: boolean
): { confidenceScore: number; confidenceLabel: 'Excellent' | 'Partial' | 'Low' } {
  let score = 100;

  // Deduct for scan-based / extremely low characters
  if (ocrNeeded) {
    return { confidenceScore: 30, confidenceLabel: 'Low' };
  }

  // Deduct for missing core sections
  const coreSections = ['EXPERIENCE', 'EDUCATION', 'SKILLS'];
  for (const core of coreSections) {
    if (!sections[core] || sections[core].trim().length < 50) {
      score -= 18; // -18% for each core section missing
    }
  }

  // Deduct for missing minor sections
  const minorSections = ['SUMMARY', 'PROJECTS', 'CERTIFICATIONS'];
  for (const minor of minorSections) {
    if (!sections[minor] || sections[minor].trim().length < 30) {
      score -= 8; // -8% for each minor section missing
    }
  }

  // Deduct for missing core metadata
  if (!email) score -= 10;
  if (!name || name === 'Candidate Profile') score -= 8;

  // Scale bounds
  score = Math.max(15, Math.min(100, score));

  let label: 'Excellent' | 'Partial' | 'Low' = 'Excellent';
  if (score < 50) {
    label = 'Low';
  } else if (score < 80) {
    label = 'Partial';
  }

  return { confidenceScore: score, confidenceLabel: label };
}

/**
 * Calculates human and recruiter readability scores based on layout and density heuristics
 */
function calculateReadabilityScore(text: string, sections: Record<string, string>): number {
  let score = 30; // base score

  // 1. Structure Coverage (up to +30%)
  const crucialSections = ['EXPERIENCE', 'EDUCATION', 'SKILLS', 'PROJECTS'];
  for (const sect of crucialSections) {
    if (sections[sect] && sections[sect].trim().length > 40) {
      score += 7.5;
    }
  }

  // 2. Bullet point density (up to +20%)
  // Count standard bullets (•, -, *, etc.)
  const bulletCount = (text.match(/^[ \t]*[•\-\*■❑◦]\s/gm) || []).length;
  if (bulletCount > 15) {
    score += 20;
  } else if (bulletCount > 5) {
    score += 10;
  }

  // 3. Action-Verb Density (up to +25%)
  const actionsCount = countActionVerbs(text);
  if (actionsCount > 10) {
    score += 25;
  } else if (actionsCount > 4) {
    score += 15;
  } else if (actionsCount > 1) {
    score += 5;
  }

  // 4. Quantitative Outcome Metric Density (up to +25%)
  // Recruiter metrics count (%, $, Numbers, time indicators)
  const metricsCount = countQuantitativeMetrics(text);
  if (metricsCount > 8) {
    score += 25;
  } else if (metricsCount > 3) {
    score += 15;
  } else if (metricsCount > 0) {
    score += 5;
  }

  return Math.min(100, score);
}

function countActionVerbs(text: string): number {
  const clean = text.toLowerCase();
  let count = 0;
  for (const verb of ACTION_VERBS) {
    const regex = new RegExp(`\\b${verb}\\b`, 'g');
    count += (clean.match(regex) || []).length;
  }
  return count;
}

function countQuantitativeMetrics(text: string): number {
  // Matches percentages (e.g. 50%, 1.5%), currency (e.g. $10K, $500,000), time frame/scale outcomes (e.g. 40x, 20M+, 30k+)
  const metricsRegex = /(?:\d+(?:\.\d+)?%|\$\d+(?:,\d+)*(?:\s*[kKmMgGbB]\+?)?|\b\d+\s*(?:k\+|m\+|x\b|years|months|members|users|scale|servers))/gi;
  return (text.match(metricsRegex) || []).length;
}

/**
 * Builds structured high-readability Markdown representation
 */
function buildReconstructedMarkdown(
  name: string,
  email: string,
  phone: string,
  linkedin: string,
  github: string,
  portfolio: string,
  preSectionContent: string,
  sectionSequence: { key: string; title: string }[],
  sections: Record<string, string>
): string {
  let md = `# ${name}\n\n`;

  // Build contact row
  const contacts: string[] = [];
  if (email) contacts.push(`**Email:** ${email}`);
  if (phone) contacts.push(`**Phone:** ${phone}`);
  if (linkedin) contacts.push(`[LinkedIn](${linkedin})`);
  if (github) contacts.push(`[GitHub](${github})`);
  if (portfolio) contacts.push(`[Portfolio](${portfolio})`);
  
  if (contacts.length > 0) {
    md += contacts.join('  |  ') + '\n\n';
  }

  md += '---\n\n';

  // Include pre-section text if it exists (e.g. address or top summaries)
  const cleanPre = preSectionContent.trim();
  if (cleanPre) {
    md += cleanPre + '\n\n';
  }

  // Helper to find closest emoji
  const getEmoji = (title: string): string => {
    const t = title.toLowerCase();
    if (t.includes('summary') || t.includes('profile') || t.includes('objective')) return '🎯';
    if (t.includes('skill') || t.includes('technolog') || t.includes('expert')) return '🛠️';
    if (t.includes('experience') || t.includes('work') || t.includes('employ')) return '💼';
    if (t.includes('project') || t.includes('portfolio')) return '🚀';
    if (t.includes('education') || t.includes('academic') || t.includes('degree')) return '🎓';
    return '📜';
  };

  // Iterate in original sequence
  for (const { key, title } of sectionSequence) {
    const content = sections[key];
    if (content && content.trim().length > 0) {
      const emoji = getEmoji(title);
      md += `### ${emoji} ${title.toUpperCase()}\n\n`;
      md += content.trim() + '\n\n';
    }
  }

  return md.trim();
}

/**
 * Empty fallback structures
 */
function createEmptyMetadata(fileType: string, parsingDurationMs: number): ExtractedMetadata {
  return {
    name: 'Candidate Profile',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    portfolio: '',
    sections: {},
    reconstructedMarkdown: '',
    rawLength: 0,
    optimizedLength: 0,
    compressionRatio: 0,
    confidenceScore: 0,
    confidenceLabel: 'Low',
    readabilityScore: 0,
    ocrNeeded: false,
    diagnostics: {
      format: fileType.toUpperCase(),
      parsingDurationMs,
      wordCount: 0,
      actionsCount: 0,
      metricsCount: 0,
      sectionsFound: [],
      redundanciesStripped: false,
      characterDensityRatio: 0
    }
  };
}
