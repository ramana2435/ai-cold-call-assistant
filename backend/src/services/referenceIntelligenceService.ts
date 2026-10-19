// =====================================================
// Reference Intelligence Service
// =====================================================
// Retrieves relevant examples from the 100 reference transcripts
// to provide evidence-based guidance during live sales calls

import fs from 'fs';
import path from 'path';
import { StageName } from '../types';

export interface ReferenceMetadata {
  id: string;
  duration_seconds: string;
  outcome: string;
  prospect_role: string;
  company_kind: string;
  company: string;
  caller: string;
  turns: number;
}

export interface ReferenceExample {
  id: string;
  relevanceScore: number;
  matchReason: string;
  outcome: string;
  excerpt: string; // Relevant portion only (5-10 turns max)
  metadata: {
    prospect_role: string;
    company_kind: string;
    duration_seconds: string;
    turns: number;
  };
}

export interface ReferenceIntelligence {
  examples: ReferenceExample[];
  guidance: string;
  totalAvailable: number;
}

// Cache for reference data
let referenceIndex: ReferenceMetadata[] | null = null;
const transcriptCache = new Map<string, string>();

/**
 * Load the reference transcript index
 */
function loadReferenceIndex(): ReferenceMetadata[] {
  if (referenceIndex) {
    return referenceIndex;
  }

  try {
    const indexPath = path.join(process.cwd(), '..', 'cold-call-transcripts-100', 'index.json');
    const indexData = fs.readFileSync(indexPath, 'utf-8');
    referenceIndex = JSON.parse(indexData);
    console.log(`[ReferenceIntelligence] Loaded ${referenceIndex!.length} reference transcripts`);
    return referenceIndex!;
  } catch (error) {
    console.error('[ReferenceIntelligence] Failed to load reference index:', error);
    referenceIndex = [];
    return [];
  }
}

/**
 * Load a specific transcript file
 */
function loadTranscript(id: string): string | null {
  if (transcriptCache.has(id)) {
    return transcriptCache.get(id)!;
  }

  try {
    const transcriptPath = path.join(
      process.cwd(),
      '..',
      'cold-call-transcripts-100',
      'transcripts',
      `${id}.txt`
    );
    const content = fs.readFileSync(transcriptPath, 'utf-8');
    transcriptCache.set(id, content);
    return content;
  } catch (error) {
    console.error(`[ReferenceIntelligence] Failed to load transcript ${id}:`, error);
    return null;
  }
}

/**
 * Extract a relevant excerpt from a transcript
 */
function extractExcerpt(transcript: string, maxTurns: number = 8): string {
  const lines = transcript.split('\n');
  const dialogueLines = lines.filter(line => 
    line.startsWith('CALLER:') || 
    line.startsWith('PROSPECT:') || 
    line.startsWith('RECEPTION:')
  );

  // Take first maxTurns turns as a representative sample
  const excerpt = dialogueLines.slice(0, maxTurns).join('\n');
  
  if (dialogueLines.length > maxTurns) {
    return excerpt + '\n[... conversation continues ...]';
  }
  
  return excerpt;
}

/**
 * Calculate relevance score for a reference transcript
 */
function calculateRelevance(
  metadata: ReferenceMetadata,
  currentStage: StageName,
  recentTranscript: string,
  requestedOutcome?: string
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Outcome match (highest weight if specified)
  if (requestedOutcome && metadata.outcome === requestedOutcome) {
    score += 50;
    reasons.push(`Same outcome: ${metadata.outcome}`);
  }

  // Stage-based matching
  const stageNames: StageName[] = ['Opening', 'Purpose', 'Permission', 'Their business', 'Their need, in their words', 'Objection', 'Next step', 'Close'];
  const stageNumber = stageNames.indexOf(currentStage) + 1;
  
  // Prefer transcripts that completed successfully
  if (['next_step_agreed', 'agreed_to_receive_report'].includes(metadata.outcome)) {
    score += 20;
    reasons.push('Successful call example');
  }

  // Early stage preference for short calls
  if (stageNumber <= 3 && parseInt(metadata.duration_seconds) < 60) {
    score += 15;
    reasons.push('Short, efficient opening');
  }

  // Objection handling stage
  if (currentStage === 'Objection') {
    if (['not_interested', 'do_not_call', 'wrong_person'].includes(metadata.outcome)) {
      score += 25;
      reasons.push('Handled objections or rejection');
    }
  }

  // Do-not-call examples for learning
  if (metadata.outcome === 'do_not_call') {
    score += 10;
    reasons.push('Shows explicit refusal handling');
  }

  // Text similarity (basic keyword matching)
  if (recentTranscript) {
    const lowerTranscript = recentTranscript.toLowerCase();
    const keywords = ['report', 'meeting', 'busy', 'not interested', 'send', 'email'];
    const matches = keywords.filter(kw => lowerTranscript.includes(kw));
    if (matches.length > 0) {
      score += matches.length * 5;
      reasons.push(`Keyword matches: ${matches.join(', ')}`);
    }
  }

  // Diversity bonus for different company types
  if (metadata.company_kind && metadata.company_kind !== 'not known') {
    score += 5;
  }

  return {
    score,
    reason: reasons.join('; ') || 'General reference',
  };
}

/**
 * Get relevant reference examples for the current call
 */
export async function getRelevantExamples(
  currentStage: StageName,
  recentTranscript: string = '',
  requestedOutcome?: string,
  maxExamples: number = 3
): Promise<ReferenceIntelligence> {
  const index = loadReferenceIndex();

  if (index.length === 0) {
    console.warn('[ReferenceIntelligence] No reference transcripts available');
    return {
      examples: [],
      guidance: 'No reference examples available. Continue with standard best practices.',
      totalAvailable: 0,
    };
  }

  // Calculate relevance for each reference
  const scoredReferences = index.map(metadata => {
    const { score, reason } = calculateRelevance(
      metadata,
      currentStage,
      recentTranscript,
      requestedOutcome
    );
    return { metadata, score, reason };
  });

  // Sort by relevance and take top N
  scoredReferences.sort((a, b) => b.score - a.score);
  const topReferences = scoredReferences.slice(0, maxExamples);

  // Load transcripts and create examples
  const examples: ReferenceExample[] = [];

  for (const ref of topReferences) {
    if (ref.score < 10) {
      // Too low relevance, skip
      continue;
    }

    const transcript = loadTranscript(ref.metadata.id);
    if (!transcript) {
      continue;
    }

    const excerpt = extractExcerpt(transcript);

    examples.push({
      id: ref.metadata.id,
      relevanceScore: ref.score,
      matchReason: ref.reason,
      outcome: ref.metadata.outcome,
      excerpt,
      metadata: {
        prospect_role: ref.metadata.prospect_role,
        company_kind: ref.metadata.company_kind,
        duration_seconds: ref.metadata.duration_seconds,
        turns: ref.metadata.turns,
      },
    });
  }

  // Generate contextual guidance
  const guidance = generateGuidance(currentStage, examples);

  return {
    examples,
    guidance,
    totalAvailable: scoredReferences.filter(r => r.score >= 10).length,
  };
}

/**
 * Generate contextual guidance based on examples and stage
 */
function generateGuidance(stage: StageName, examples: ReferenceExample[]): string {
  if (examples.length === 0) {
    return `No specific reference examples found for ${stage} stage. Apply standard best practices.`;
  }

  const successfulExamples = examples.filter(e => 
    ['next_step_agreed', 'agreed_to_receive_report'].includes(e.outcome)
  );

  const objectionExamples = examples.filter(e =>
    ['not_interested', 'do_not_call', 'wrong_person'].includes(e.outcome)
  );

  let guidance = `Found ${examples.length} relevant reference example${examples.length > 1 ? 's' : ''} for ${stage} stage.\n\n`;

  if (successfulExamples.length > 0) {
    guidance += `✓ ${successfulExamples.length} example${successfulExamples.length > 1 ? 's' : ''} ended with positive outcomes (next step agreed or report accepted).\n`;
  }

  if (objectionExamples.length > 0) {
    guidance += `⚠ ${objectionExamples.length} example${objectionExamples.length > 1 ? 's' : ''} show${objectionExamples.length === 1 ? 's' : ''} objection or rejection handling.\n`;
  }

  // Stage-specific guidance
  if (stage === 'Objection') {
    guidance += '\n💡 Review how these callers responded to resistance. If prospect says "do not call," respect it.';
  } else if (stage === 'Next step') {
    guidance += '\n💡 Notice how successful calls move from interest to a specific committed action.';
  } else if (stage === 'Opening') {
    guidance += '\n💡 Observe how effective openings establish credibility quickly without overselling.';
  }

  return guidance.trim();
}

/**
 * Check if reference dataset is available
 */
export function isReferenceDataAvailable(): boolean {
  try {
    const indexPath = path.join(process.cwd(), '..', 'cold-call-transcripts-100', 'index.json');
    return fs.existsSync(indexPath);
  } catch {
    return false;
  }
}

/**
 * Get statistics about reference dataset
 */
export function getReferenceStats(): {
  total: number;
  outcomes: Record<string, number>;
  avgDuration: number;
} {
  const index = loadReferenceIndex();

  if (index.length === 0) {
    return { total: 0, outcomes: {}, avgDuration: 0 };
  }

  const outcomes: Record<string, number> = {};
  let totalDuration = 0;

  for (const ref of index) {
    outcomes[ref.outcome] = (outcomes[ref.outcome] || 0) + 1;
    totalDuration += parseInt(ref.duration_seconds) || 0;
  }

  return {
    total: index.length,
    outcomes,
    avgDuration: Math.round(totalDuration / index.length),
  };
}
