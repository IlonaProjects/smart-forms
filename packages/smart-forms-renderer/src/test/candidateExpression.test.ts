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

import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { evaluateCandidateExpressions } from '../utils/candidateExpression';
import type {
  CandidateExpressions,
  CandidateExpression
} from '../interfaces/candidateExpression.interface';

// Mock the fhirpath module
jest.mock('fhirpath', () => ({
  evaluate: jest.fn()
}));

// Mock the fhirpath utils
jest.mock('../utils/fhirpath', () => ({
  cacheTerminologyResult: jest.fn(),
  handleFhirPathResult: jest.fn(),
  isExpressionCached: jest.fn()
}));

import fhirpath from 'fhirpath';
import {
  cacheTerminologyResult,
  handleFhirPathResult,
  isExpressionCached
} from '../utils/fhirpath';

const mockFhirpath = fhirpath as jest.MockedFunction<typeof fhirpath>;
const mockCacheTerminologyResult = cacheTerminologyResult as jest.MockedFunction<
  typeof cacheTerminologyResult
>;
const mockHandleFhirPathResult = handleFhirPathResult as jest.MockedFunction<
  typeof handleFhirPathResult
>;
const mockIsExpressionCached = isExpressionCached as jest.MockedFunction<typeof isExpressionCached>;

describe('evaluateCandidateExpressions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockIsExpressionCached.mockReturnValue(false);
    mockHandleFhirPathResult.mockImplementation(async (result) => result);
    mockFhirpath.evaluate = jest.fn();
  });

  test('should return unchanged expressions when no expressions provided', async () => {
    const candidateExpressions: CandidateExpressions = {};
    const fhirPathContext = {};
    const fhirPathTerminologyCache = {};
    const terminologyServerUrl = 'http://test-terminology.com';

    const result = await evaluateCandidateExpressions(
      fhirPathContext,
      fhirPathTerminologyCache,
      candidateExpressions,
      terminologyServerUrl
    );

    expect(result.isUpdated).toBe(false);
    expect(result.updatedCandidateExpressions).toEqual({});
    expect(mockFhirpath.evaluate).not.toHaveBeenCalled();
  });

  test('should evaluate FHIRPath candidate expression successfully', async () => {
    const candidateExpressions: CandidateExpressions = {
      'condition-select': [
        {
          expression: {
            language: 'text/fhirpath',
            expression: "Bundle.entry.resource.where(resourceType='Condition')"
          },
          result: undefined
        }
      ]
    };

    const mockConditions = [
      {
        resourceType: 'Condition',
        id: 'condition-1',
        code: {
          coding: [
            { system: 'http://snomed.info/sct', code: '73211009', display: 'Diabetes mellitus' }
          ],
          text: 'Diabetes mellitus'
        }
      },
      {
        resourceType: 'Condition',
        id: 'condition-2',
        code: {
          coding: [{ system: 'http://snomed.info/sct', code: '59621000', display: 'Hypertension' }],
          text: 'Essential hypertension'
        }
      }
    ];

    mockFhirpath.evaluate.mockReturnValue(mockConditions);
    mockHandleFhirPathResult.mockResolvedValue(mockConditions);

    const fhirPathContext = {
      '%Bundle': {
        entry: mockConditions.map((c) => ({ resource: c }))
      }
    };
    const fhirPathTerminologyCache = {};
    const terminologyServerUrl = 'http://test-terminology.com';

    const result = await evaluateCandidateExpressions(
      fhirPathContext,
      fhirPathTerminologyCache,
      candidateExpressions,
      terminologyServerUrl
    );

    expect(result.isUpdated).toBe(true);
    expect(result.updatedCandidateExpressions['condition-select'][0].result).toEqual(
      mockConditions
    );
    expect(mockFhirpath.evaluate).toHaveBeenCalledWith(
      {},
      {
        base: 'QuestionnaireResponse',
        expression: "Bundle.entry.resource.where(resourceType='Condition')"
      },
      fhirPathContext,
      expect.anything(),
      {
        async: true,
        terminologyUrl: terminologyServerUrl
      }
    );
  });

  test('should evaluate x-fhir-query candidate expression successfully', async () => {
    const candidateExpressions: CandidateExpressions = {
      'medication-select': [
        {
          expression: {
            language: 'application/x-fhir-query',
            expression: 'MedicationRequest?patient={{%patient.id}}'
          },
          result: undefined
        }
      ]
    };

    const mockMedications = [
      {
        resourceType: 'MedicationRequest',
        id: 'med-1',
        medicationCodeableConcept: {
          coding: [{ system: 'http://snomed.info/sct', code: '387517004', display: 'Paracetamol' }],
          text: 'Paracetamol 500mg'
        }
      }
    ];

    mockFhirpath.evaluate.mockReturnValue(mockMedications);
    mockHandleFhirPathResult.mockResolvedValue(mockMedications);

    const fhirPathContext = {
      '%patient': { id: 'patient-123' }
    };
    const fhirPathTerminologyCache = {};
    const terminologyServerUrl = 'http://test-terminology.com';

    const result = await evaluateCandidateExpressions(
      fhirPathContext,
      fhirPathTerminologyCache,
      candidateExpressions,
      terminologyServerUrl
    );

    expect(result.isUpdated).toBe(true);
    expect(result.updatedCandidateExpressions['medication-select'][0].result).toEqual(
      mockMedications
    );
  });

  test('should handle single result by converting to array', async () => {
    const candidateExpressions: CandidateExpressions = {
      'single-result': [
        {
          expression: {
            language: 'text/fhirpath',
            expression: 'Patient.name.first()'
          },
          result: undefined
        }
      ]
    };

    const singleResult = { family: 'Doe', given: ['John'] };

    mockFhirpath.evaluate.mockReturnValue(singleResult);
    mockHandleFhirPathResult.mockResolvedValue(singleResult);

    const result = await evaluateCandidateExpressions(
      {},
      {},
      candidateExpressions,
      'http://test-terminology.com'
    );

    expect(result.isUpdated).toBe(true);
    expect(result.updatedCandidateExpressions['single-result'][0].result).toEqual([singleResult]);
  });

  test('should skip cached expressions', async () => {
    const candidateExpressions: CandidateExpressions = {
      'cached-expression': [
        {
          expression: {
            language: 'text/fhirpath',
            expression: 'Bundle.entry.resource'
          },
          result: undefined
        }
      ]
    };

    mockIsExpressionCached.mockReturnValue(true);

    const result = await evaluateCandidateExpressions(
      {},
      {},
      candidateExpressions,
      'http://test-terminology.com'
    );

    expect(result.isUpdated).toBe(false);
    expect(mockFhirpath.evaluate).not.toHaveBeenCalled();
  });

  test('should handle expression evaluation errors gracefully', async () => {
    const candidateExpressions: CandidateExpressions = {
      'error-expression': [
        {
          expression: {
            language: 'text/fhirpath',
            expression: 'invalid.fhirpath.expression'
          },
          result: undefined
        }
      ]
    };

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockFhirpath.evaluate.mockImplementation(() => {
      throw new Error('Invalid expression');
    });

    const result = await evaluateCandidateExpressions(
      {},
      {},
      candidateExpressions,
      'http://test-terminology.com'
    );

    expect(result.isUpdated).toBe(true);
    expect(result.updatedCandidateExpressions['error-expression'][0].result).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'CandidateExpression evaluation failed for invalid.fhirpath.expression:',
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });

  test('should skip expressions without expression text', async () => {
    const candidateExpressions: CandidateExpressions = {
      'empty-expression': [
        {
          expression: {
            language: 'text/fhirpath',
            expression: ''
          },
          result: undefined
        }
      ]
    };

    const result = await evaluateCandidateExpressions(
      {},
      {},
      candidateExpressions,
      'http://test-terminology.com'
    );

    expect(result.isUpdated).toBe(false);
    expect(mockFhirpath.evaluate).not.toHaveBeenCalled();
  });

  test('should process multiple expressions for single linkId', async () => {
    const candidateExpressions: CandidateExpressions = {
      'multi-source': [
        {
          expression: {
            language: 'text/fhirpath',
            expression: "Bundle.entry.resource.where(resourceType='Condition')"
          },
          result: undefined
        },
        {
          expression: {
            language: 'text/fhirpath',
            expression: "Bundle.entry.resource.where(resourceType='Observation')"
          },
          result: undefined
        }
      ]
    };

    const mockConditions = [{ resourceType: 'Condition', code: { text: 'Diabetes' } }];
    const mockObservations = [{ resourceType: 'Observation', code: { text: 'Blood glucose' } }];

    mockFhirpath.evaluate.mockReturnValueOnce(mockConditions).mockReturnValueOnce(mockObservations);

    mockHandleFhirPathResult
      .mockResolvedValueOnce(mockConditions)
      .mockResolvedValueOnce(mockObservations);

    const result = await evaluateCandidateExpressions(
      {},
      {},
      candidateExpressions,
      'http://test-terminology.com'
    );

    expect(result.isUpdated).toBe(true);
    expect(result.updatedCandidateExpressions['multi-source']).toHaveLength(2);
    expect(result.updatedCandidateExpressions['multi-source'][0].result).toEqual(mockConditions);
    expect(result.updatedCandidateExpressions['multi-source'][1].result).toEqual(mockObservations);
    expect(mockFhirpath.evaluate).toHaveBeenCalledTimes(2);
  });

  test('should handle async FHIRPath results and cache them', async () => {
    const candidateExpressions: CandidateExpressions = {
      'async-expression': [
        {
          expression: {
            language: 'text/fhirpath',
            expression: 'ValueSet.expansion.contains'
          },
          result: undefined
        }
      ]
    };

    const mockResults = [
      { code: 'code1', display: 'Display 1' },
      { code: 'code2', display: 'Display 2' }
    ];

    const asyncResult = Promise.resolve(mockResults);
    mockFhirpath.evaluate.mockReturnValue(asyncResult);
    mockHandleFhirPathResult.mockResolvedValue(mockResults);

    const result = await evaluateCandidateExpressions(
      {},
      {},
      candidateExpressions,
      'http://test-terminology.com'
    );

    expect(result.isUpdated).toBe(true);
    expect(result.updatedCandidateExpressions['async-expression'][0].result).toEqual(mockResults);
    expect(mockCacheTerminologyResult).toHaveBeenCalledWith(
      'ValueSet.expansion.contains',
      mockResults,
      {}
    );
  });
});
