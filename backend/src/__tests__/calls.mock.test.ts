/**
 * Mock tests for calls endpoint (without database)
 * These tests validate request/response structure and validation
 */
import request from 'supertest';
import { createApp } from '../app';

describe('Calls API - Validation Tests (Mocked)', () => {
  const app = createApp();

  describe('POST /calls - Create Call', () => {
    it('should reject call creation without prospect_name', async () => {
      const response = await request(app)
        .post('/calls')
        .send({
          company_name: 'Test Company',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });

    it('should reject call creation without company_name', async () => {
      const response = await request(app)
        .post('/calls')
        .send({
          prospect_name: 'John Doe',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject prospect_name exceeding 255 characters', async () => {
      const longName = 'A'.repeat(256);
      
      const response = await request(app)
        .post('/calls')
        .send({
          prospect_name: longName,
          company_name: 'Test Company',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /calls/:id/stages - Save Stage', () => {
    const mockId = '123e4567-e89b-12d3-a456-426614174000';

    it('should reject invalid UUID format', async () => {
      const response = await request(app)
        .post('/calls/invalid-id/stages')
        .send({
          stage_number: 2,
          quick_tap_events: ['Asked what we do'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid call ID');
    });

    it('should reject stage_number less than 1', async () => {
      const response = await request(app)
        .post(`/calls/${mockId}/stages`)
        .send({
          stage_number: 0,
          quick_tap_events: ['test'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject stage_number greater than 8', async () => {
      const response = await request(app)
        .post(`/calls/${mockId}/stages`)
        .send({
          stage_number: 9,
          quick_tap_events: ['test'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject non-array quick_tap_events', async () => {
      const response = await request(app)
        .post(`/calls/${mockId}/stages`)
        .send({
          stage_number: 2,
          quick_tap_events: 'not an array',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should accept multiple quick_tap_events', async () => {
      const response = await request(app)
        .post(`/calls/${mockId}/stages`)
        .send({
          stage_number: 2,
          quick_tap_events: ['Event 1', 'Event 2', 'Event 3'],
          prospect_words: 'Test quote',
        });

      // Will fail at database level (no connection), but validation passes
      expect(response.status).not.toBe(400);
    });
  });

  describe('POST /calls/:id/close - Close Call', () => {
    const mockId = '123e4567-e89b-12d3-a456-426614174000';

    it('should reject close without outcome', async () => {
      const response = await request(app)
        .post(`/calls/${mockId}/close`)
        .send({
          reached_stage_number: 3,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid outcome', async () => {
      const response = await request(app)
        .post(`/calls/${mockId}/close`)
        .send({
          reached_stage_number: 3,
          outcome: 'invalid_outcome',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should accept valid outcomes', async () => {
      const validOutcomes = [
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

      for (const outcome of validOutcomes) {
        const response = await request(app)
          .post(`/calls/${mockId}/close`)
          .send({
            reached_stage_number: 3,
            outcome,
          });

        // Will fail at database level, but validation passes
        expect(response.status).not.toBe(400);
      }
    });

    it('should accept closing at stage 1', async () => {
      const response = await request(app)
        .post(`/calls/${mockId}/close`)
        .send({
          reached_stage_number: 1,
          outcome: 'do_not_call',
        });

      expect(response.status).not.toBe(400);
    });

    it('should accept closing at stage 6', async () => {
      const response = await request(app)
        .post(`/calls/${mockId}/close`)
        .send({
          reached_stage_number: 6,
          outcome: 'not_interested',
        });

      expect(response.status).not.toBe(400);
    });
  });

  describe('GET /calls/:id - Get Call', () => {
    it('should reject invalid UUID format', async () => {
      const response = await request(app).get('/calls/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('404 Not Found', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Route not found');
    });
  });
});
