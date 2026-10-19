import { body, param, ValidationChain } from 'express-validator';

// Valid outcomes
const VALID_OUTCOMES = [
  'next_step_agreed',
  'agreed_to_receive_report',
  'interested',
  'follow_up',
  'call_again',
  'not_interested',
  'do_not_call',
  'wrong_person',
  'moved_company',
  'not_logged',
];

/**
 * Validators for creating a call
 */
export const createCallValidators: ValidationChain[] = [
  body('prospect_name')
    .trim()
    .notEmpty()
    .withMessage('Prospect name is required')
    .isLength({ max: 255 })
    .withMessage('Prospect name must not exceed 255 characters'),
  
  body('company_name')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ max: 255 })
    .withMessage('Company name must not exceed 255 characters'),
  
  body('prospect_role')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Prospect role must not exceed 255 characters'),
  
  body('call_context')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Call context must not exceed 100 characters'),
];

/**
 * Validators for saving a stage result
 */
export const saveStageValidators: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid call ID format'),
  
  body('stage_number')
    .isInt({ min: 1, max: 8 })
    .withMessage('Stage number must be between 1 and 8'),
  
  body('quick_tap_events')
    .isArray()
    .withMessage('Quick tap events must be an array')
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      // Ensure all items are strings
      return value.every((item) => typeof item === 'string');
    })
    .withMessage('All quick tap events must be strings'),
  
  body('prospect_words')
    .optional()
    .trim()
    .isString()
    .withMessage('Prospect words must be a string'),
  
  body('stage_notes')
    .optional()
    .trim()
    .isString()
    .withMessage('Stage notes must be a string'),
];

/**
 * Validators for closing a call
 */
export const closeCallValidators: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid call ID format'),
  
  body('reached_stage_number')
    .isInt({ min: 1, max: 8 })
    .withMessage('Reached stage number must be between 1 and 8'),
  
  body('outcome')
    .trim()
    .notEmpty()
    .withMessage('Outcome is required')
    .isIn(VALID_OUTCOMES)
    .withMessage(`Outcome must be one of: ${VALID_OUTCOMES.join(', ')}`),
  
  body('prospect_key_words')
    .optional()
    .trim()
    .isString()
    .withMessage('Prospect key words must be a string'),
  
  body('agreed_next_action')
    .optional()
    .trim()
    .isString()
    .withMessage('Agreed next action must be a string'),
];

/**
 * Validator for call ID parameter
 */
export const callIdValidator: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid call ID format'),
];

/**
 * Validators for analyzing transcript
 */
export const analyzeTranscriptValidators: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid call ID format'),
  
  body('transcript')
    .trim()
    .notEmpty()
    .withMessage('Transcript is required')
    .isString()
    .withMessage('Transcript must be a string')
    .isLength({ max: 5000 })
    .withMessage('Transcript must not exceed 5000 characters'),
  
  body('currentStage')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Current stage must be between 1 and 8'),
];

/**
 * Validators for suggesting next stage
 */
export const suggestStageValidators: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid call ID format'),
  
  body('conversationSummary')
    .optional()
    .trim()
    .isString()
    .withMessage('Conversation summary must be a string'),
];

/**
 * Validators for suggesting responses
 */
export const suggestResponseValidators: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid call ID format'),
  
  body('prospectLastWords')
    .optional()
    .trim()
    .isString()
    .withMessage('Prospect last words must be a string')
    .isLength({ max: 500 })
    .withMessage('Prospect last words must not exceed 500 characters'),
];

/**
 * Validators for getting call intelligence
 */
export const getIntelligenceValidators: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid call ID format'),
];
