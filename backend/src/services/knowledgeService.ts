// =====================================================
// Knowledge Service - Product & Organization Profiles
// =====================================================
// Manages reusable knowledge profiles for AI contextualization

import { getSupabaseClient } from '../db/supabase';
import {
  ProductProfile,
  OrganizationProfile,
  CallKnowledgeSnapshot,
  CreateProductProfileRequest,
  UpdateProductProfileRequest,
  CreateOrganizationProfileRequest,
  UpdateOrganizationProfileRequest,
  AssociateKnowledgeRequest,
} from '../types';

const supabase = getSupabaseClient();

// =====================================================
// Product Profile Operations
// =====================================================

/**
 * Create a new product profile
 */
export async function createProductProfile(
  data: CreateProductProfileRequest
): Promise<ProductProfile> {
  const profileData = {
    product_name: data.product_name,
    short_description: data.short_description || null,
    detailed_explanation: data.detailed_explanation || null,
    problems_solved: data.problems_solved || [],
    features: data.features || [],
    benefits: data.benefits || [],
    use_cases: data.use_cases || [],
    pricing_model: data.pricing_model || null,
    technical_requirements: data.technical_requirements || null,
    product_limitations: data.product_limitations || null,
    common_objections: data.common_objections || [],
    ideal_customer_profile: data.ideal_customer_profile || null,
    supported_industries: data.supported_industries || [],
    unsupported_industries: data.unsupported_industries || [],
    image_references: data.image_references || [],
    preferred_cta: data.preferred_cta || null,
    preferred_next_steps: data.preferred_next_steps || null,
  };

  const { data: profile, error } = await supabase
    .from('product_profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create product profile: ${error.message}`);
  }

  return profile as ProductProfile;
}

/**
 * Get all product profiles (active only by default)
 */
export async function getProductProfiles(includeInactive = false): Promise<ProductProfile[]> {
  let query = supabase
    .from('product_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch product profiles: ${error.message}`);
  }

  return (data || []) as ProductProfile[];
}

/**
 * Get a product profile by ID
 */
export async function getProductProfileById(id: string): Promise<ProductProfile | null> {
  const { data, error } = await supabase
    .from('product_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to fetch product profile: ${error.message}`);
  }

  return data as ProductProfile;
}

/**
 * Update a product profile
 */
export async function updateProductProfile(
  id: string,
  data: UpdateProductProfileRequest
): Promise<ProductProfile> {
  // Verify profile exists
  const existing = await getProductProfileById(id);
  if (!existing) {
    throw new Error('Product profile not found');
  }

  const updateData: any = {};
  
  // Only update fields that are provided
  if (data.product_name !== undefined) updateData.product_name = data.product_name;
  if (data.short_description !== undefined) updateData.short_description = data.short_description || null;
  if (data.detailed_explanation !== undefined) updateData.detailed_explanation = data.detailed_explanation || null;
  if (data.problems_solved !== undefined) updateData.problems_solved = data.problems_solved;
  if (data.features !== undefined) updateData.features = data.features;
  if (data.benefits !== undefined) updateData.benefits = data.benefits;
  if (data.use_cases !== undefined) updateData.use_cases = data.use_cases;
  if (data.pricing_model !== undefined) updateData.pricing_model = data.pricing_model || null;
  if (data.technical_requirements !== undefined) updateData.technical_requirements = data.technical_requirements || null;
  if (data.product_limitations !== undefined) updateData.product_limitations = data.product_limitations || null;
  if (data.common_objections !== undefined) updateData.common_objections = data.common_objections;
  if (data.ideal_customer_profile !== undefined) updateData.ideal_customer_profile = data.ideal_customer_profile || null;
  if (data.supported_industries !== undefined) updateData.supported_industries = data.supported_industries;
  if (data.unsupported_industries !== undefined) updateData.unsupported_industries = data.unsupported_industries;
  if (data.image_references !== undefined) updateData.image_references = data.image_references;
  if (data.preferred_cta !== undefined) updateData.preferred_cta = data.preferred_cta || null;
  if (data.preferred_next_steps !== undefined) updateData.preferred_next_steps = data.preferred_next_steps || null;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;

  const { data: updated, error } = await supabase
    .from('product_profiles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update product profile: ${error.message}`);
  }

  return updated as ProductProfile;
}

/**
 * Soft delete a product profile (set is_active = false)
 */
export async function deleteProductProfile(id: string): Promise<void> {
  const { error } = await supabase
    .from('product_profiles')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete product profile: ${error.message}`);
  }
}

// =====================================================
// Organization Profile Operations
// =====================================================

/**
 * Create a new organization profile
 */
export async function createOrganizationProfile(
  data: CreateOrganizationProfileRequest
): Promise<OrganizationProfile> {
  const profileData = {
    organization_name: data.organization_name,
    website: data.website || null,
    industry: data.industry || null,
    organization_type: data.organization_type || null,
    company_size: data.company_size || null,
    prospect_name: data.prospect_name || null,
    prospect_role: data.prospect_role || null,
    is_decision_maker: data.is_decision_maker !== undefined ? data.is_decision_maker : null,
    business_challenges: data.business_challenges || null,
    potential_use_cases: data.potential_use_cases || null,
    organization_notes: data.organization_notes || null,
    information_source: data.information_source || null,
    confidence_level: data.confidence_level || null,
  };

  const { data: profile, error } = await supabase
    .from('organization_profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create organization profile: ${error.message}`);
  }

  return profile as OrganizationProfile;
}

/**
 * Get all organization profiles (active only by default)
 */
export async function getOrganizationProfiles(includeInactive = false): Promise<OrganizationProfile[]> {
  let query = supabase
    .from('organization_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch organization profiles: ${error.message}`);
  }

  return (data || []) as OrganizationProfile[];
}

/**
 * Get an organization profile by ID
 */
export async function getOrganizationProfileById(id: string): Promise<OrganizationProfile | null> {
  const { data, error } = await supabase
    .from('organization_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to fetch organization profile: ${error.message}`);
  }

  return data as OrganizationProfile;
}

/**
 * Update an organization profile
 */
export async function updateOrganizationProfile(
  id: string,
  data: UpdateOrganizationProfileRequest
): Promise<OrganizationProfile> {
  // Verify profile exists
  const existing = await getOrganizationProfileById(id);
  if (!existing) {
    throw new Error('Organization profile not found');
  }

  const updateData: any = {};
  
  // Only update fields that are provided
  if (data.organization_name !== undefined) updateData.organization_name = data.organization_name;
  if (data.website !== undefined) updateData.website = data.website || null;
  if (data.industry !== undefined) updateData.industry = data.industry || null;
  if (data.organization_type !== undefined) updateData.organization_type = data.organization_type || null;
  if (data.company_size !== undefined) updateData.company_size = data.company_size || null;
  if (data.prospect_name !== undefined) updateData.prospect_name = data.prospect_name || null;
  if (data.prospect_role !== undefined) updateData.prospect_role = data.prospect_role || null;
  if (data.is_decision_maker !== undefined) updateData.is_decision_maker = data.is_decision_maker;
  if (data.business_challenges !== undefined) updateData.business_challenges = data.business_challenges || null;
  if (data.potential_use_cases !== undefined) updateData.potential_use_cases = data.potential_use_cases || null;
  if (data.organization_notes !== undefined) updateData.organization_notes = data.organization_notes || null;
  if (data.information_source !== undefined) updateData.information_source = data.information_source || null;
  if (data.confidence_level !== undefined) updateData.confidence_level = data.confidence_level || null;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;

  const { data: updated, error } = await supabase
    .from('organization_profiles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update organization profile: ${error.message}`);
  }

  // Update last_contacted_at if this is a real contact update
  if (data.prospect_name || data.prospect_role || data.business_challenges) {
    await supabase
      .from('organization_profiles')
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', id);
  }

  return updated as OrganizationProfile;
}

/**
 * Soft delete an organization profile (set is_active = false)
 */
export async function deleteOrganizationProfile(id: string): Promise<void> {
  const { error } = await supabase
    .from('organization_profiles')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete organization profile: ${error.message}`);
  }
}

// =====================================================
// Call Knowledge Association
// =====================================================

/**
 * Associate product and/or organization profiles with a call
 * Creates an immutable snapshot of the knowledge
 */
export async function associateKnowledgeWithCall(
  callId: string,
  data: AssociateKnowledgeRequest
): Promise<CallKnowledgeSnapshot> {
  // Fetch full profile data to create snapshots
  let productSnapshot = null;
  let organizationSnapshot = null;

  if (data.product_profile_id) {
    const product = await getProductProfileById(data.product_profile_id);
    if (!product) {
      throw new Error('Product profile not found');
    }
    productSnapshot = product;
  }

  if (data.organization_profile_id) {
    const organization = await getOrganizationProfileById(data.organization_profile_id);
    if (!organization) {
      throw new Error('Organization profile not found');
    }
    organizationSnapshot = organization;
  }

  // Check if snapshot already exists for this call
  const { data: existing } = await supabase
    .from('call_knowledge_snapshots')
    .select('id')
    .eq('call_id', callId)
    .single();

  if (existing) {
    // Update existing snapshot
    const { data: updated, error } = await supabase
      .from('call_knowledge_snapshots')
      .update({
        product_profile_id: data.product_profile_id || null,
        organization_profile_id: data.organization_profile_id || null,
        product_snapshot: productSnapshot,
        organization_snapshot: organizationSnapshot,
      })
      .eq('call_id', callId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update call knowledge snapshot: ${error.message}`);
    }

    return updated as CallKnowledgeSnapshot;
  } else {
    // Create new snapshot
    const { data: snapshot, error } = await supabase
      .from('call_knowledge_snapshots')
      .insert({
        call_id: callId,
        product_profile_id: data.product_profile_id || null,
        organization_profile_id: data.organization_profile_id || null,
        product_snapshot: productSnapshot,
        organization_snapshot: organizationSnapshot,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create call knowledge snapshot: ${error.message}`);
    }

    return snapshot as CallKnowledgeSnapshot;
  }
}

/**
 * Get knowledge snapshot for a call
 */
export async function getCallKnowledgeSnapshot(callId: string): Promise<CallKnowledgeSnapshot | null> {
  const { data, error } = await supabase
    .from('call_knowledge_snapshots')
    .select('*')
    .eq('call_id', callId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found - this is OK, not all calls have knowledge
      return null;
    }
    throw new Error(`Failed to fetch call knowledge snapshot: ${error.message}`);
  }

  return data as CallKnowledgeSnapshot;
}

/**
 * Search organization profiles by name or industry
 */
export async function searchOrganizationProfiles(query: string): Promise<OrganizationProfile[]> {
  const { data, error } = await supabase
    .from('organization_profiles')
    .select('*')
    .or(`organization_name.ilike.%${query}%,industry.ilike.%${query}%`)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`Failed to search organization profiles: ${error.message}`);
  }

  return (data || []) as OrganizationProfile[];
}
