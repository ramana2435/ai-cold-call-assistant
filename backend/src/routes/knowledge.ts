import { Router, Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import {
  createProductProfile,
  getProductProfiles,
  getProductProfileById,
  updateProductProfile,
  deleteProductProfile,
  createOrganizationProfile,
  getOrganizationProfiles,
  getOrganizationProfileById,
  updateOrganizationProfile,
  deleteOrganizationProfile,
  associateKnowledgeWithCall,
  getCallKnowledgeSnapshot,
  searchOrganizationProfiles,
} from '../services/knowledgeService';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// =====================================================
// Product Profile Routes
// =====================================================

/**
 * GET /products
 * Get all product profiles
 */
router.get(
  '/products',
  [query('includeInactive').optional().isBoolean()],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const profiles = await getProductProfiles(includeInactive);

      const response: ApiResponse = {
        success: true,
        data: profiles,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /products/:id
 * Get a product profile by ID
 */
router.get(
  '/products/:id',
  [param('id').isUUID().withMessage('Invalid product profile ID')],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await getProductProfileById(req.params.id);

      if (!profile) {
        const response: ApiResponse = {
          success: false,
          error: 'Product profile not found',
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: profile,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /products
 * Create a new product profile
 */
router.post(
  '/products',
  [
    body('product_name')
      .trim()
      .notEmpty()
      .withMessage('Product name is required')
      .isLength({ max: 255 })
      .withMessage('Product name must be 255 characters or less'),
    body('short_description').optional().trim(),
    body('detailed_explanation').optional().trim(),
    body('problems_solved').optional().isArray(),
    body('features').optional().isArray(),
    body('benefits').optional().isArray(),
    body('use_cases').optional().isArray(),
    body('pricing_model').optional().trim(),
    body('technical_requirements').optional().trim(),
    body('product_limitations').optional().trim(),
    body('common_objections').optional().isArray(),
    body('ideal_customer_profile').optional().trim(),
    body('supported_industries').optional().isArray(),
    body('unsupported_industries').optional().isArray(),
    body('image_references').optional().isArray(),
    body('preferred_cta').optional().trim(),
    body('preferred_next_steps').optional().trim(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await createProductProfile(req.body);

      const response: ApiResponse = {
        success: true,
        data: profile,
        message: 'Product profile created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /products/:id
 * Update a product profile
 */
router.put(
  '/products/:id',
  [
    param('id').isUUID().withMessage('Invalid product profile ID'),
    body('product_name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Product name cannot be empty')
      .isLength({ max: 255 })
      .withMessage('Product name must be 255 characters or less'),
    body('is_active').optional().isBoolean(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await updateProductProfile(req.params.id, req.body);

      const response: ApiResponse = {
        success: true,
        data: profile,
        message: 'Product profile updated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /products/:id
 * Soft delete a product profile
 */
router.delete(
  '/products/:id',
  [param('id').isUUID().withMessage('Invalid product profile ID')],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await deleteProductProfile(req.params.id);

      const response: ApiResponse = {
        success: true,
        message: 'Product profile deleted successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// =====================================================
// Organization Profile Routes
// =====================================================

/**
 * GET /organizations
 * Get all organization profiles
 */
router.get(
  '/organizations',
  [query('includeInactive').optional().isBoolean()],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const profiles = await getOrganizationProfiles(includeInactive);

      const response: ApiResponse = {
        success: true,
        data: profiles,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /organizations/search
 * Search organization profiles
 */
router.get(
  '/organizations/search',
  [query('q').notEmpty().withMessage('Search query is required')],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profiles = await searchOrganizationProfiles(req.query.q as string);

      const response: ApiResponse = {
        success: true,
        data: profiles,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /organizations/:id
 * Get an organization profile by ID
 */
router.get(
  '/organizations/:id',
  [param('id').isUUID().withMessage('Invalid organization profile ID')],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await getOrganizationProfileById(req.params.id);

      if (!profile) {
        const response: ApiResponse = {
          success: false,
          error: 'Organization profile not found',
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: profile,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /organizations
 * Create a new organization profile
 */
router.post(
  '/organizations',
  [
    body('organization_name')
      .trim()
      .notEmpty()
      .withMessage('Organization name is required')
      .isLength({ max: 255 })
      .withMessage('Organization name must be 255 characters or less'),
    body('website')
      .optional({ checkFalsy: true })
      .trim()
      .isURL()
      .withMessage('Invalid website URL'),
    body('industry').optional().trim(),
    body('organization_type').optional().trim(),
    body('company_size').optional().trim(),
    body('prospect_name').optional().trim(),
    body('prospect_role').optional().trim(),
    body('is_decision_maker').optional().isBoolean(),
    body('business_challenges').optional().trim(),
    body('potential_use_cases').optional().trim(),
    body('organization_notes').optional().trim(),
    body('information_source').optional().trim(),
    body('confidence_level')
      .optional()
      .isIn(['high', 'medium', 'low', 'unverified'])
      .withMessage('Invalid confidence level'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await createOrganizationProfile(req.body);

      const response: ApiResponse = {
        success: true,
        data: profile,
        message: 'Organization profile created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /organizations/:id
 * Update an organization profile
 */
router.put(
  '/organizations/:id',
  [
    param('id').isUUID().withMessage('Invalid organization profile ID'),
    body('organization_name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Organization name cannot be empty')
      .isLength({ max: 255 })
      .withMessage('Organization name must be 255 characters or less'),
    body('website')
      .optional({ checkFalsy: true })
      .trim()
      .isURL()
      .withMessage('Invalid website URL'),
    body('is_active').optional().isBoolean(),
    body('confidence_level')
      .optional()
      .isIn(['high', 'medium', 'low', 'unverified'])
      .withMessage('Invalid confidence level'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await updateOrganizationProfile(req.params.id, req.body);

      const response: ApiResponse = {
        success: true,
        data: profile,
        message: 'Organization profile updated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /organizations/:id
 * Soft delete an organization profile
 */
router.delete(
  '/organizations/:id',
  [param('id').isUUID().withMessage('Invalid organization profile ID')],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await deleteOrganizationProfile(req.params.id);

      const response: ApiResponse = {
        success: true,
        message: 'Organization profile deleted successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// =====================================================
// Call Knowledge Association Routes
// =====================================================

/**
 * POST /calls/:id/knowledge
 * Associate product and/or organization profiles with a call
 */
router.post(
  '/:id/knowledge',
  [
    param('id').isUUID().withMessage('Invalid call ID'),
    body('product_profile_id').optional().isUUID().withMessage('Invalid product profile ID'),
    body('organization_profile_id').optional().isUUID().withMessage('Invalid organization profile ID'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const snapshot = await associateKnowledgeWithCall(req.params.id, req.body);

      const response: ApiResponse = {
        success: true,
        data: snapshot,
        message: 'Knowledge profiles associated with call successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /calls/:id/knowledge
 * Get knowledge snapshot for a call
 */
router.get(
  '/:id/knowledge',
  [param('id').isUUID().withMessage('Invalid call ID')],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const snapshot = await getCallKnowledgeSnapshot(req.params.id);

      const response: ApiResponse = {
        success: true,
        data: snapshot,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
