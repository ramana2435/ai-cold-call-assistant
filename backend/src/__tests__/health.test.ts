import request from 'supertest';
import { createApp } from '../app';

describe('Health Endpoint', () => {
  const app = createApp();

  it('should return health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('status');
    expect(response.body.data).toHaveProperty('timestamp');
  });

  it('should return degraded status when Supabase not configured', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Without configuration, should be degraded
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      expect(response.body.data.status).toBe('degraded');
    }
  });
});
