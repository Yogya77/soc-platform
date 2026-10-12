import { ISecurityService } from './api.interface';
import { MockSecurityService } from './mock.service';
import { HttpSecurityService } from './http.service';

const isProduction = process.env.NODE_ENV === 'production';
const preferredMode = process.env.NEXT_PUBLIC_DATA_MODE === 'live' ? 'REAL_FASTAPI' : 'MOCK_DEMO';

const mockServiceInstance = new MockSecurityService();
const httpServiceInstance = new HttpSecurityService();

let currentMode: 'MOCK_DEMO' | 'REAL_FASTAPI' = preferredMode;

export function getSecurityService(): ISecurityService {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('soc_data_mode') as 'MOCK_DEMO' | 'REAL_FASTAPI' | null;
    if (saved) {
      currentMode = saved;
    }
  }

  if (currentMode === 'REAL_FASTAPI') {
    return httpServiceInstance;
  }
  return mockServiceInstance;
}

export function setSecurityServiceMode(mode: 'MOCK_DEMO' | 'REAL_FASTAPI') {
  currentMode = mode;
  if (typeof window !== 'undefined') {
    localStorage.setItem('soc_data_mode', mode);
  }
  mockServiceInstance.setMode(mode);
  httpServiceInstance.setMode(mode);
}

export function getActiveServiceMode(): 'MOCK_DEMO' | 'REAL_FASTAPI' {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('soc_data_mode') as 'MOCK_DEMO' | 'REAL_FASTAPI' | null;
    if (saved) return saved;
  }
  return currentMode;
}

export * from './api.interface';
export * from './mock.data';
