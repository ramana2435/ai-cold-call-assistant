/**
 * Stage Persistence Tests
 * 
 * Tests that stage data (especially Stage 8) is properly saved and reloaded
 */

import { saveStageResult, getCallWithStages, createCall } from '../services/callService';
import { getSupabaseClient } from '../db/supabase';

describe('Stage Persistence', () => {
  let testCallId: string;
  
  beforeAll(async () => {
    // Create a test call
    const call = await createCall({
      prospect_name: 'Test Prospect',
      company_name: 'Test Company',
      prospect_role: 'Owner',
      call_context: 'test',
    });
    testCallId = call.id;
  });
  
  afterAll(async () => {
    // Clean up test call
    const client = getSupabaseClient();
    await client.from('calls').delete().eq('id', testCallId);
  });
  
  describe('Stage 1 - Opening', () => {
    it('should save Stage 1 data', async () => {
      const stageData = {
        stage_number: 1 as 1,
        quick_tap_events: ['Reached decision maker', 'Call connected'],
        prospect_words: 'Hello, this is Dr. Smith',
        stage_notes: 'Friendly tone, ready to listen',
      };
      
      const result = await saveStageResult(testCallId, stageData);
      
      expect(result).toBeDefined();
      expect(result.stage_number).toBe(1);
      expect(result.stage_name).toBe('Opening');
      expect(result.quick_tap_events).toEqual(stageData.quick_tap_events);
      expect(result.prospect_words).toBe(stageData.prospect_words);
      expect(result.stage_notes).toBe(stageData.stage_notes);
    });
    
    it('should reload Stage 1 data after navigating away', async () => {
      const callWithStages = await getCallWithStages(testCallId);
      
      expect(callWithStages).not.toBeNull();
      const stage1 = callWithStages!.stage_results?.find(s => s.stage_number === 1);
      
      expect(stage1).toBeDefined();
      expect(stage1!.prospect_words).toBe('Hello, this is Dr. Smith');
      expect(stage1!.stage_notes).toBe('Friendly tone, ready to listen');
      expect(stage1!.quick_tap_events).toEqual(['Reached decision maker', 'Call connected']);
    });
    
    it('should update Stage 1 data when saved again', async () => {
      const updatedData = {
        stage_number: 1 as 1,
        quick_tap_events: ['Spoke to receptionist', 'Left voicemail'],
        prospect_words: 'Updated opening words',
        stage_notes: 'Updated notes',
      };
      
      const result = await saveStageResult(testCallId, updatedData);
      
      expect(result.prospect_words).toBe('Updated opening words');
      expect(result.stage_notes).toBe('Updated notes');
      expect(result.quick_tap_events).toEqual(updatedData.quick_tap_events);
    });
    
    it('should not create duplicate Stage 1 records', async () => {
      const callWithStages = await getCallWithStages(testCallId);
      const stage1Records = callWithStages!.stage_results?.filter(s => s.stage_number === 1);
      
      // Should only have 1 record for Stage 1 (updated, not duplicated)
      expect(stage1Records?.length).toBe(1);
    });
  });
  
  describe('Stage 8 - Close', () => {
    it('should save Stage 8 data', async () => {
      const stageData = {
        stage_number: 8 as 8,
        quick_tap_events: ['Confirmed next step', 'Set calendar invite'],
        prospect_words: 'Sounds good, send me the info and we can discuss on Tuesday',
        stage_notes: 'Positive ending, agreed to follow-up call',
      };
      
      const result = await saveStageResult(testCallId, stageData);
      
      expect(result).toBeDefined();
      expect(result.stage_number).toBe(8);
      expect(result.stage_name).toBe('Close');
      expect(result.quick_tap_events).toEqual(stageData.quick_tap_events);
      expect(result.prospect_words).toBe(stageData.prospect_words);
      expect(result.stage_notes).toBe(stageData.stage_notes);
    });
    
    it('should reload Stage 8 data after navigating away', async () => {
      const callWithStages = await getCallWithStages(testCallId);
      
      expect(callWithStages).not.toBeNull();
      const stage8 = callWithStages!.stage_results?.find(s => s.stage_number === 8);
      
      expect(stage8).toBeDefined();
      expect(stage8!.prospect_words).toBe('Sounds good, send me the info and we can discuss on Tuesday');
      expect(stage8!.stage_notes).toBe('Positive ending, agreed to follow-up call');
      expect(stage8!.quick_tap_events).toEqual(['Confirmed next step', 'Set calendar invite']);
    });
    
    it('should update Stage 8 data when saved again', async () => {
      const updatedData = {
        stage_number: 8 as 8,
        quick_tap_events: ['Thanked for time', 'Ended positively'],
        prospect_words: 'Actually, let me think about it and I will call you back',
        stage_notes: 'Changed mind at last minute',
      };
      
      const result = await saveStageResult(testCallId, updatedData);
      
      expect(result.prospect_words).toBe('Actually, let me think about it and I will call you back');
      expect(result.stage_notes).toBe('Changed mind at last minute');
      expect(result.quick_tap_events).toEqual(updatedData.quick_tap_events);
    });
    
    it('should not create duplicate Stage 8 records', async () => {
      const callWithStages = await getCallWithStages(testCallId);
      const stage8Records = callWithStages!.stage_results?.filter(s => s.stage_number === 8);
      
      // Should only have 1 record for Stage 8 (updated, not duplicated)
      expect(stage8Records?.length).toBe(1);
    });
    
    it('should persist Stage 8 data across multiple reloads', async () => {
      // Reload 3 times to simulate navigating away and back multiple times
      for (let i = 0; i < 3; i++) {
        const callWithStages = await getCallWithStages(testCallId);
        const stage8 = callWithStages!.stage_results?.find(s => s.stage_number === 8);
        
        expect(stage8).toBeDefined();
        expect(stage8!.prospect_words).toBe('Actually, let me think about it and I will call you back');
      }
    });
  });
  
  describe('Multiple Stages', () => {
    it('should save data for multiple stages', async () => {
      const stages = [
        { stage_number: 2 as 2, quick_tap_events: ['Asked what we do'], prospect_words: 'What is this about?' },
        { stage_number: 3 as 3, quick_tap_events: ['Gave permission'], prospect_words: 'Go ahead' },
        { stage_number: 4 as 4, quick_tap_events: ['Described their practice'], prospect_words: 'We run a dental clinic' },
        { stage_number: 5 as 5, quick_tap_events: ['Stated specific need'], prospect_words: 'We need better patient scheduling' },
        { stage_number: 6 as 6, quick_tap_events: ['Not interested right now'], prospect_words: 'Maybe later' },
        { stage_number: 7 as 7, quick_tap_events: ['Requested follow-up call'], prospect_words: 'Call me next week' },
      ];
      
      for (const stageData of stages) {
        await saveStageResult(testCallId, stageData);
      }
      
      const callWithStages = await getCallWithStages(testCallId);
      expect(callWithStages!.stage_results?.length).toBeGreaterThanOrEqual(stages.length);
    });
    
    it('should load all stages in correct order', async () => {
      const callWithStages = await getCallWithStages(testCallId);
      const stageNumbers = callWithStages!.stage_results?.map(s => s.stage_number) || [];
      
      // Check stages are in ascending order
      for (let i = 1; i < stageNumbers.length; i++) {
        expect(stageNumbers[i]).toBeGreaterThanOrEqual(stageNumbers[i - 1]);
      }
    });
  });
});

