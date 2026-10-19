import { getSupabaseClient } from '../db/supabase';
import {
  Call,
  CallStageResult,
  CallWithStages,
  CreateCallRequest,
  SaveStageRequest,
  CloseCallRequest,
  STAGE_NAMES,
  StageNumber,
} from '../types';

/**
 * Create a new call
 */
export async function createCall(data: CreateCallRequest): Promise<Call> {
  const client = getSupabaseClient();

  const callData = {
    prospect_name: data.prospect_name,
    company_name: data.company_name,
    prospect_role: data.prospect_role || null,
    call_context: data.call_context || null,
    current_stage_number: 1,
    current_stage_name: 'Opening',
    reached_stage_number: 1,
    reached_stage_name: 'Opening',
    status: 'in_progress',
  };

  const { data: call, error } = await client
    .from('calls')
    .insert(callData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create call: ${error.message}`);
  }

  return call as Call;
}

/**
 * Get all calls (newest first)
 */
export async function getAllCalls(): Promise<Call[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('calls')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch calls: ${error.message}`);
  }

  return data as Call[];
}

/**
 * Get a call by ID
 */
export async function getCallById(id: string): Promise<Call | null> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('calls')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to fetch call: ${error.message}`);
  }

  return data as Call;
}

/**
 * Get call with all stage results
 */
export async function getCallWithStages(id: string): Promise<CallWithStages | null> {
  const client = getSupabaseClient();

  // Fetch call
  const call = await getCallById(id);
  if (!call) {
    return null;
  }

  // Fetch stage results
  const { data: stageResults, error } = await client
    .from('call_stage_results')
    .select('*')
    .eq('call_id', id)
    .order('stage_number', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch stage results: ${error.message}`);
  }

  return {
    ...call,
    stage_results: stageResults as CallStageResult[],
  };
}

/**
 * Save a stage result and update call progress
 */
export async function saveStageResult(
  callId: string,
  data: SaveStageRequest
): Promise<CallStageResult> {
  const client = getSupabaseClient();

  // Verify call exists and is in progress
  const call = await getCallById(callId);
  if (!call) {
    throw new Error('Call not found');
  }

  if (call.status === 'closed') {
    throw new Error('Cannot save stage result for a closed call');
  }

  // Get stage name from number
  const stageName = STAGE_NAMES[data.stage_number as StageNumber];
  if (!stageName) {
    throw new Error(`Invalid stage number: ${data.stage_number}`);
  }

  // Upsert stage result (insert or update if already exists)
  // First, check if a stage result already exists for this call and stage
  const { data: existingStage } = await client
    .from('call_stage_results')
    .select('id')
    .eq('call_id', callId)
    .eq('stage_number', data.stage_number)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const stageData = {
    call_id: callId,
    stage_number: data.stage_number,
    stage_name: stageName,
    quick_tap_events: data.quick_tap_events,
    prospect_words: data.prospect_words || null,
    stage_notes: data.stage_notes || null,
  };

  let stageResult;
  
  if (existingStage) {
    // Update existing stage result
    const { data: updated, error: updateError } = await client
      .from('call_stage_results')
      .update(stageData)
      .eq('id', existingStage.id)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Failed to update stage result: ${updateError.message}`);
    }
    stageResult = updated;
  } else {
    // Insert new stage result
    const { data: inserted, error: insertError } = await client
      .from('call_stage_results')
      .insert(stageData)
      .select()
      .single();
    
    if (insertError) {
      throw new Error(`Failed to save stage result: ${insertError.message}`);
    }
    stageResult = inserted;
  }

  // Update call progress
  const updateData: any = {
    current_stage_number: data.stage_number,
    current_stage_name: stageName,
  };

  // Update reached stage if this is further than before
  if (data.stage_number > call.reached_stage_number) {
    updateData.reached_stage_number = data.stage_number;
    updateData.reached_stage_name = stageName;
  }

  const { error: updateError } = await client
    .from('calls')
    .update(updateData)
    .eq('id', callId);

  if (updateError) {
    throw new Error(`Failed to update call progress: ${updateError.message}`);
  }

  return stageResult as CallStageResult;
}

/**
 * Close a call from any stage
 */
export async function closeCall(callId: string, data: CloseCallRequest): Promise<Call> {
  const client = getSupabaseClient();

  // Verify call exists
  const call = await getCallById(callId);
  if (!call) {
    throw new Error('Call not found');
  }

  if (call.status === 'closed') {
    throw new Error('Call is already closed');
  }

  // Get reached stage name
  const reachedStageName = STAGE_NAMES[data.reached_stage_number as StageNumber];
  if (!reachedStageName) {
    throw new Error(`Invalid reached stage number: ${data.reached_stage_number}`);
  }

  // Update call
  const updateData = {
    status: 'closed',
    outcome: data.outcome,
    reached_stage_number: data.reached_stage_number,
    reached_stage_name: reachedStageName,
    prospect_key_words: data.prospect_key_words || null,
    agreed_next_action: data.agreed_next_action || null,
    closed_at: new Date().toISOString(),
  };

  const { data: updatedCall, error } = await client
    .from('calls')
    .update(updateData)
    .eq('id', callId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to close call: ${error.message}`);
  }

  return updatedCall as Call;
}
