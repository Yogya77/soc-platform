import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { HttpSecurityService } from '../src/services/http.service';
import { MockSecurityService } from '../src/services/mock.service';

describe('Stage 3: Service Contract Fidelity', () => {
  const requiredMethods = [
    'getDashboardStats',
    'getActivityTimeSeries',
    'getAlerts',
    'getAlertById',
    'updateAlertStatus',
    'escalateAlertToIncident',
    'linkAlertToIncident',
    'getIncidents',
    'getIncidentById',
    'updateIncidentStatus',
    'updateIncidentSeverity',
    'assignIncidentAnalyst',
    'addIncidentNote',
    'getEvents',
    'getEventById',
    'getAssets',
    'getAssetById',
    'isolateAsset',
    'getDetectionRules',
    'getDetectionRuleById',
    'toggleRuleStatus',
    'testDetectionRule',
    'getThreatIntel',
    'getThreatIndicatorByValue',
    'startAIInvestigation',
    'getAIInvestigation',
    'updateRecommendationStatus',
    'getInvestigationReport',
    'generateInvestigationReport',
    'getAuditLogs',
    'addAuditLog',
    'searchOmni',
    'getSystemHealth',
    'setMode',
    'getCurrentMode',
  ];

  test('HttpSecurityService implements all ISecurityService interface methods', () => {
    const httpService = new HttpSecurityService('/api');
    for (const method of requiredMethods) {
      assert.equal(
        typeof (httpService as any)[method],
        'function',
        `HttpSecurityService must implement ${method}`
      );
    }
  });

  test('MockSecurityService implements all ISecurityService interface methods', () => {
    const mockService = new MockSecurityService();
    for (const method of requiredMethods) {
      assert.equal(
        typeof (mockService as any)[method],
        'function',
        `MockSecurityService must implement ${method}`
      );
    }
  });

  test('HttpSecurityService defaults to relative /api endpoint', () => {
    const httpService = new HttpSecurityService();
    assert.equal((httpService as any).baseUrl, '/api');
  });

  test('HttpSecurityService respects custom baseUrl', () => {
    const httpService = new HttpSecurityService('https://soc.corp.internal/api');
    assert.equal((httpService as any).baseUrl, 'https://soc.corp.internal/api');
  });
});
