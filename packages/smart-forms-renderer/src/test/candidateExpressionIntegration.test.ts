/*
 * Copyright 2025 Commonwealth Scientific and Industrial Research
 * Organisation (CSIRO) ABN 41 687 119 230.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { getCandidateExpressions } from '../utils/getExpressionsFromItem';
import { evaluateCandidateExpressions } from '../utils/candidateExpression';
import { useCandidateExpression } from '../hooks/useCandidateExpression';
import {
  qCandidateExpressionBasic,
  qCandidateExpressionMultiSource,
  qCandidateExpressionComplex
} from '../stories/assets/questionnaires/QCandidateExpressionTesting';
import {
  mockFhirPathContext,
  mockConditions,
  mockMedicationRequests,
  mockObservations,
  createMockFhirPathResult
} from './data/candidateExpressionMockData';
import type { CandidateExpressions } from '../interfaces/candidateExpression.interface';

// Mock dependencies
jest.mock('../stores', () => ({
  useQuestionnaireStore: jest.fn()
}));

jest.mock('fhirpath', () => ({
  evaluate: jest.fn()
}));

jest.mock('../utils/fhirpath', () => ({
  cacheTerminologyResult: jest.fn(),
  handleFhirPathResult: jest.fn(),
  isExpressionCached: jest.fn()
}));

jest.mock('fhirclient', () => ({
  client: jest.fn()
}));

import { useQuestionnaireStore } from '../stores';
import fhirpath from 'fhirpath';
import {
  cacheTerminologyResult,
  handleFhirPathResult,
  isExpressionCached
} from '../utils/fhirpath';
import { client } from 'fhirclient';

const mockUseQuestionnaireStore = useQuestionnaireStore as unknown as jest.Mock;
const mockFhirpath = fhirpath as { evaluate: jest.Mock };
const mockHandleFhirPathResult = handleFhirPathResult as jest.MockedFunction<
  typeof handleFhirPathResult
>;
const mockIsExpressionCached = isExpressionCached as jest.MockedFunction<typeof isExpressionCached>;
const mockClient = client as jest.MockedFunction<typeof client>;

describe('Candidate Expression Integration Tests', () => {
  let mockFhirClientRequest: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fhirclient request
    mockFhirClientRequest = jest.fn();
    mockClient.mockReturnValue({
      request: mockFhirClientRequest
    } as any);

    // Default mock implementations
    mockIsExpressionCached.mockReturnValue(false);
    mockHandleFhirPathResult.mockImplementation(async (result) => result);
    mockFhirpath.evaluate = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End Candidate Expression Flow', () => {
    test('should extract, evaluate, and use candidate expressions for basic questionnaire', async () => {
      // Step 1: Extract candidate expressions from questionnaire
      const conditionSelectItem = qCandidateExpressionBasic.item?.find(
        (item) => item.linkId === 'condition-select-fhirpath'
      );
      expect(conditionSelectItem).toBeDefined();

      const extractedExpressions = getCandidateExpressions(conditionSelectItem!);
      expect(extractedExpressions).toHaveLength(1);
      expect(extractedExpressions[0].expression.expression).toBe(
        "%PatientConditions.entry.resource.where(resourceType='Condition')"
      );

      // Step 2: Set up candidate expressions for evaluation
      const candidateExpressions: CandidateExpressions = {
        'condition-select-fhirpath': extractedExpressions
      };

      // Mock FHIRPath evaluation
      const mockResult = createMockFhirPathResult('Condition');
      mockFhirpath.evaluate.mockReturnValue(mockResult);
      mockHandleFhirPathResult.mockResolvedValue(mockResult);

      // Step 3: Evaluate candidate expressions
      const evaluationResult = await evaluateCandidateExpressions(
        mockFhirPathContext,
        {},
        candidateExpressions,
        'http://test-terminology.com'
      );

      expect(evaluationResult.isUpdated).toBe(true);
      expect(
        evaluationResult.updatedCandidateExpressions['condition-select-fhirpath'][0].result
      ).toEqual(mockResult);

      // Step 4: Use hook to get candidate options
      mockUseQuestionnaireStore.mockReturnValue(evaluationResult.updatedCandidateExpressions);

      const { result } = renderHook(() => useCandidateExpression('condition-select-fhirpath'));

      // Verify that the hook returns the expected candidate options
      expect(result.current).toHaveLength(3); // We have 3 mock conditions
      expect(result.current[0]).toMatchObject({
        valueCoding: {
          system: 'http://snomed.info/sct',
          code: '73211009',
          display: 'Diabetes mellitus'
        }
      });
      expect(result.current[1]).toMatchObject({
        valueCoding: {
          system: 'http://snomed.info/sct',
          code: '59621000',
          display: 'Essential hypertension'
        }
      });
    });

    test('should handle multi-source candidate expressions', async () => {
      // Extract expressions from multi-source questionnaire
      const multiSourceItem = qCandidateExpressionMultiSource.item?.find(
        (item) => item.linkId === 'combined-health-data'
      );
      expect(multiSourceItem).toBeDefined();

      const extractedExpressions = getCandidateExpressions(multiSourceItem!);
      expect(extractedExpressions).toHaveLength(2);

      // Set up candidate expressions
      const candidateExpressions: CandidateExpressions = {
        'combined-health-data': extractedExpressions
      };

      // Mock different results for different expressions
      const mockConditionResult = createMockFhirPathResult('Condition');
      const mockObservationResult = createMockFhirPathResult('Observation');

      mockFhirpath.evaluate
        .mockReturnValueOnce(mockConditionResult)
        .mockReturnValueOnce(mockObservationResult);

      mockHandleFhirPathResult
        .mockResolvedValueOnce(mockConditionResult)
        .mockResolvedValueOnce(mockObservationResult);

      // Evaluate expressions
      const evaluationResult = await evaluateCandidateExpressions(
        mockFhirPathContext,
        {},
        candidateExpressions,
        'http://test-terminology.com'
      );

      expect(evaluationResult.isUpdated).toBe(true);
      expect(evaluationResult.updatedCandidateExpressions['combined-health-data']).toHaveLength(2);

      // Use hook
      mockUseQuestionnaireStore.mockReturnValue(evaluationResult.updatedCandidateExpressions);
      const { result } = renderHook(() => useCandidateExpression('combined-health-data'));

      // Should combine results from both expressions
      expect(result.current.length).toBeGreaterThan(3); // Conditions + Observations

      // Should have condition options
      expect(
        result.current.some((option) => option.valueCoding?.display === 'Diabetes mellitus')
      ).toBe(true);

      // Should have observation options (checking for observation-specific fields)
      expect(
        result.current.some((option) => option.valueCoding?.system === 'http://loinc.org')
      ).toBe(true);
    });

    test('should handle complex questionnaire with multiple items', async () => {
      // Test primary concern item
      const primaryConcernItem = qCandidateExpressionComplex.item?.find(
        (item) => item.linkId === 'primary-concern'
      );
      const primaryConcernExpressions = getCandidateExpressions(primaryConcernItem!);

      // Test related medications item
      const medicationsItem = qCandidateExpressionComplex.item?.find(
        (item) => item.linkId === 'related-medications'
      );
      const medicationExpressions = getCandidateExpressions(medicationsItem!);

      // Set up expressions for both items
      const candidateExpressions: CandidateExpressions = {
        'primary-concern': primaryConcernExpressions,
        'related-medications': medicationExpressions
      };

      // Mock results
      const mockConditionResult = mockConditions.filter(
        (c) => c.clinicalStatus?.coding?.[0]?.code === 'active'
      );
      const mockMedicationResult = createMockFhirPathResult('MedicationRequest');

      mockFhirpath.evaluate
        .mockReturnValueOnce(mockConditionResult)
        .mockReturnValueOnce(mockMedicationResult);

      mockHandleFhirPathResult
        .mockResolvedValueOnce(mockConditionResult)
        .mockResolvedValueOnce(mockMedicationResult);

      // Evaluate
      const evaluationResult = await evaluateCandidateExpressions(
        mockFhirPathContext,
        {},
        candidateExpressions,
        'http://test-terminology.com'
      );

      expect(evaluationResult.isUpdated).toBe(true);

      // Test primary concern results
      mockUseQuestionnaireStore.mockReturnValue(evaluationResult.updatedCandidateExpressions);
      const { result: primaryResult } = renderHook(() => useCandidateExpression('primary-concern'));

      expect(primaryResult.current.length).toBeGreaterThan(0);
      expect(
        primaryResult.current.every((option) => option.valueCoding || option.valueString)
      ).toBe(true);

      // Test medication results
      const { result: medicationResult } = renderHook(() =>
        useCandidateExpression('related-medications')
      );

      expect(medicationResult.current.length).toBeGreaterThan(0);
      expect(
        medicationResult.current.some(
          (option) =>
            option.valueCoding?.display?.includes('Metformin') ||
            option.valueString?.includes('Metformin')
        )
      ).toBe(true);
    });

    test('should handle errors gracefully in end-to-end flow', async () => {
      const conditionSelectItem = qCandidateExpressionBasic.item?.find(
        (item) => item.linkId === 'condition-select-fhirpath'
      );
      const extractedExpressions = getCandidateExpressions(conditionSelectItem!);

      const candidateExpressions: CandidateExpressions = {
        'condition-select-fhirpath': extractedExpressions
      };

      // Mock evaluation failure
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockFhirpath.evaluate.mockImplementation(() => {
        throw new Error('FHIRPath evaluation error');
      });

      const evaluationResult = await evaluateCandidateExpressions(
        mockFhirPathContext,
        {},
        candidateExpressions,
        'http://test-terminology.com'
      );

      expect(evaluationResult.isUpdated).toBe(true);
      expect(
        evaluationResult.updatedCandidateExpressions['condition-select-fhirpath'][0].result
      ).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalled();

      // Hook should handle empty results gracefully
      mockUseQuestionnaireStore.mockReturnValue(evaluationResult.updatedCandidateExpressions);
      const { result } = renderHook(() => useCandidateExpression('condition-select-fhirpath'));

      expect(result.current).toEqual([]);

      consoleWarnSpy.mockRestore();
    });

    test('should handle empty evaluation results', async () => {
      const conditionSelectItem = qCandidateExpressionBasic.item?.find(
        (item) => item.linkId === 'condition-select-fhirpath'
      );
      const extractedExpressions = getCandidateExpressions(conditionSelectItem!);

      const candidateExpressions: CandidateExpressions = {
        'condition-select-fhirpath': extractedExpressions
      };

      // Mock empty results
      mockFhirpath.evaluate.mockReturnValue([]);
      mockHandleFhirPathResult.mockResolvedValue([]);

      const evaluationResult = await evaluateCandidateExpressions(
        mockFhirPathContext,
        {},
        candidateExpressions,
        'http://test-terminology.com'
      );

      expect(evaluationResult.isUpdated).toBe(true);
      expect(
        evaluationResult.updatedCandidateExpressions['condition-select-fhirpath'][0].result
      ).toEqual([]);

      // Hook should return empty array
      mockUseQuestionnaireStore.mockReturnValue(evaluationResult.updatedCandidateExpressions);
      const { result } = renderHook(() => useCandidateExpression('condition-select-fhirpath'));

      expect(result.current).toEqual([]);
    });

    test('should handle x-fhir-query expressions end-to-end', async () => {
      const queryItem = qCandidateExpressionBasic.item?.find(
        (item) => item.linkId === 'condition-select-query'
      );
      const extractedExpressions = getCandidateExpressions(queryItem!);

      expect(extractedExpressions[0].expression.language).toBe('application/x-fhir-query');

      const candidateExpressions: CandidateExpressions = {
        'condition-select-query': extractedExpressions
      };

      // Mock query result as a Bundle from FHIR server
      const mockQueryResult = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: mockConditions
          .filter(
            (c) =>
              c.clinicalStatus?.coding?.[0]?.code === 'active' &&
              c.verificationStatus?.coding?.[0]?.code === 'confirmed'
          )
          .map((resource) => ({ resource }))
      };

      // Mock fhirclient request to return Bundle
      mockFhirClientRequest.mockResolvedValue(mockQueryResult as any);

      const evaluationResult = await evaluateCandidateExpressions(
        mockFhirPathContext,
        {},
        candidateExpressions,
        'http://test-terminology.com'
      );

      expect(evaluationResult.isUpdated).toBe(true);

      // Verify fhirclient was called, NOT fhirpath.evaluate
      expect(mockClient).toHaveBeenCalledWith({ serverUrl: 'http://test-terminology.com' });
      expect(mockFhirClientRequest).toHaveBeenCalledWith({
        url: 'Condition?patient=patient-123&clinical-status=active&verification-status=confirmed'
      });
      expect(mockFhirpath.evaluate).not.toHaveBeenCalled();

      // Verify results were extracted from Bundle entries
      expect(
        evaluationResult.updatedCandidateExpressions['condition-select-query'][0].result
      ).toHaveLength(2);

      mockUseQuestionnaireStore.mockReturnValue(evaluationResult.updatedCandidateExpressions);
      const { result } = renderHook(() => useCandidateExpression('condition-select-query'));

      expect(result.current.length).toBe(2); // Only diabetes and hypertension have confirmed status
      expect(result.current.every((option) => option.valueCoding)).toBe(true);
    });
  });

  describe('Performance and Caching', () => {
    test('should not re-evaluate cached expressions', async () => {
      const conditionSelectItem = qCandidateExpressionBasic.item?.find(
        (item) => item.linkId === 'condition-select-fhirpath'
      );
      const extractedExpressions = getCandidateExpressions(conditionSelectItem!);

      const candidateExpressions: CandidateExpressions = {
        'condition-select-fhirpath': extractedExpressions
      };

      // First call - not cached
      mockIsExpressionCached.mockReturnValueOnce(false);
      mockFhirpath.evaluate.mockReturnValue(mockConditions);
      mockHandleFhirPathResult.mockResolvedValue(mockConditions);

      const firstResult = await evaluateCandidateExpressions(
        mockFhirPathContext,
        {},
        candidateExpressions,
        'http://test-terminology.com'
      );

      expect(firstResult.isUpdated).toBe(true);
      expect(mockFhirpath.evaluate).toHaveBeenCalledTimes(1);

      // Second call - cached
      jest.clearAllMocks();
      mockIsExpressionCached.mockReturnValue(true);

      const secondResult = await evaluateCandidateExpressions(
        mockFhirPathContext,
        {},
        candidateExpressions,
        'http://test-terminology.com'
      );

      expect(secondResult.isUpdated).toBe(false);
      expect(mockFhirpath.evaluate).not.toHaveBeenCalled();
    });

    test('should handle mixed cached and uncached expressions', async () => {
      const multiSourceItem = qCandidateExpressionMultiSource.item?.find(
        (item) => item.linkId === 'combined-health-data'
      );
      const extractedExpressions = getCandidateExpressions(multiSourceItem!);

      const candidateExpressions: CandidateExpressions = {
        'combined-health-data': extractedExpressions
      };

      // First expression cached, second not cached
      mockIsExpressionCached
        .mockReturnValueOnce(true) // First expression cached
        .mockReturnValueOnce(false); // Second expression not cached

      mockFhirpath.evaluate.mockReturnValue(mockObservations);
      mockHandleFhirPathResult.mockResolvedValue(mockObservations);

      const result = await evaluateCandidateExpressions(
        mockFhirPathContext,
        {},
        candidateExpressions,
        'http://test-terminology.com'
      );

      expect(result.isUpdated).toBe(true);
      expect(mockFhirpath.evaluate).toHaveBeenCalledTimes(1); // Only for uncached expression
    });
  });

  describe('Hook State Management', () => {
    test('should update hook results when candidate expressions change', async () => {
      let currentCandidateExpressions: CandidateExpressions = {};

      mockUseQuestionnaireStore.mockImplementation((selector) =>
        selector({ candidateExpressions: currentCandidateExpressions } as any)
      );

      const { result, rerender } = renderHook(() => useCandidateExpression('test-linkId'));

      // Initially empty
      expect(result.current).toEqual([]);

      // Update candidate expressions
      act(() => {
        currentCandidateExpressions = {
          'test-linkId': [
            {
              expression: {
                language: 'text/fhirpath',
                expression: 'test'
              },
              result: mockConditions.slice(0, 1)
            }
          ]
        };
      });

      rerender();

      expect(result.current).toHaveLength(1);
      expect(result.current[0].valueCoding?.display).toBe('Diabetes mellitus');

      // Update with different results
      act(() => {
        currentCandidateExpressions = {
          'test-linkId': [
            {
              expression: {
                language: 'text/fhirpath',
                expression: 'test'
              },
              result: mockMedicationRequests.slice(0, 1)
            }
          ]
        };
      });

      rerender();

      expect(result.current).toHaveLength(1);
      expect(result.current[0].valueCoding?.display).toBe('Metformin');
    });
  });
});
