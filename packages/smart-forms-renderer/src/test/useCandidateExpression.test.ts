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

import { renderHook } from '@testing-library/react';
import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { useCandidateExpression } from '../hooks/useCandidateExpression';
import type { CandidateExpressions } from '../interfaces/candidateExpression.interface';

// Mock the questionnaire store
jest.mock('../stores', () => ({
  useQuestionnaireStore: jest.fn()
}));

import { useQuestionnaireStore } from '../stores';

describe('useCandidateExpression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return empty array when no candidate expressions exist', () => {
    const mockCandidateExpressions: CandidateExpressions = {};

    mockUseQuestionnaireStore.mockReturnValue(mockCandidateExpressions);

    const { result } = renderHook(() => useCandidateExpression('test-linkId'));

    expect(result.current).toEqual([]);
  });

  test('should return empty array when linkId has no expressions', () => {
    const mockCandidateExpressions: CandidateExpressions = {
      'other-linkId': [
        {
          expression: {
            language: 'text/fhirpath',
            expression: 'Condition.code'
          },
          result: [{ resourceType: 'Condition', code: { text: 'Diabetes' } }]
        }
      ]
    };

    mockUseQuestionnaireStore.mockReturnValue(mockCandidateExpressions);

    const { result } = renderHook(() => useCandidateExpression('test-linkId'));

    expect(result.current).toEqual([]);
  });

  test('should return empty array when expressions have no results', () => {
    const mockCandidateExpressions: CandidateExpressions = {
      'test-linkId': [
        {
          expression: {
            language: 'text/fhirpath',
            expression: 'Condition.code'
          },
          result: undefined
        }
      ]
    };

    mockUseQuestionnaireStore.mockReturnValue(mockCandidateExpressions);

    const { result } = renderHook(() => useCandidateExpression('test-linkId'));

    expect(result.current).toEqual([]);
  });

  test('should return empty array when expressions have empty results', () => {
    const mockCandidateExpressions: CandidateExpressions = {
      'test-linkId': [
        {
          expression: {
            language: 'text/fhirpath',
            expression: 'Condition.code'
          },
          result: []
        }
      ]
    };

    mockUseQuestionnaireStore.mockReturnValue(mockCandidateExpressions);

    const { result } = renderHook(() => useCandidateExpression('test-linkId'));

    expect(result.current).toEqual([]);
  });

  test('should convert Condition resources to candidate options', () => {
    const mockConditions = [
      {
        resourceType: 'Condition',
        id: 'condition-1',
        code: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '73211009',
              display: 'Diabetes mellitus'
            }
          ],
          text: 'Diabetes mellitus'
        }
      },
      {
        resourceType: 'Condition',
        id: 'condition-2',
        code: {
          text: 'Essential hypertension'
        }
      }
    ];

    const mockCandidateExpressions: CandidateExpressions = {
      'condition-select': [
        {
          expression: {
            language: 'text/fhirpath',
            expression: 'Condition'
          },
          result: mockConditions
        }
      ]
    };

    mockUseQuestionnaireStore.mockReturnValue(mockCandidateExpressions);

    const { result } = renderHook(() => useCandidateExpression('condition-select'));

    expect(result.current).toEqual([
      {
        valueCoding: {
          system: 'http://snomed.info/sct',
          code: '73211009',
          display: 'Diabetes mellitus'
        }
      },
      {
        valueString: 'Essential hypertension'
      }
    ]);
  });

  test('should convert MedicationRequest resources to candidate options', () => {
    const mockMedications = [
      {
        resourceType: 'MedicationRequest',
        id: 'med-1',
        medicationCodeableConcept: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '387517004',
              display: 'Paracetamol'
            }
          ]
        }
      },
      {
        resourceType: 'MedicationRequest',
        id: 'med-2',
        medicationCodeableConcept: {
          text: 'Ibuprofen 400mg'
        }
      }
    ];

    const mockCandidateExpressions: CandidateExpressions = {
      'medication-select': [
        {
          expression: {
            language: 'application/x-fhir-query',
            expression: 'MedicationRequest?patient={{%patient.id}}'
          },
          result: mockMedications
        }
      ]
    };

    mockUseQuestionnaireStore.mockReturnValue(mockCandidateExpressions);

    const { result } = renderHook(() => useCandidateExpression('medication-select'));

    expect(result.current).toEqual([
      {
        valueCoding: {
          system: 'http://snomed.info/sct',
          code: '387517004',
          display: 'Paracetamol'
        }
      },
      {
        valueString: 'Ibuprofen 400mg'
      }
    ]);
  });

  test('should convert Observation resources to candidate options', () => {
    const mockObservations = [
      {
        resourceType: 'Observation',
        id: 'obs-1',
        valueCodeableConcept: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '263654008',
              display: 'Normal'
            }
          ]
        }
      },
      {
        resourceType: 'Observation',
        id: 'obs-2',
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '33747-0',
              display: 'General appearance of patient'
            }
          ]
        }
      }
    ];

    const mockCandidateExpressions: CandidateExpressions = {
      'observation-select': [
        {
          expression: {
            language: 'text/fhirpath',
            expression: 'Observation'
          },
          result: mockObservations
        }
      ]
    };

    mockUseQuestionnaireStore.mockReturnValue(mockCandidateExpressions);

    const { result } = renderHook(() => useCandidateExpression('observation-select'));

    expect(result.current).toEqual([
      {
        valueCoding: {
          system: 'http://snomed.info/sct',
          code: '263654008',
          display: 'Normal'
        }
      },
      {
        valueCoding: {
          system: 'http://loinc.org',
          code: '33747-0',
          display: 'General appearance of patient'
        }
      }
    ]);
  });

  test('should convert Practitioner resources to candidate options', () => {
    const mockPractitioners = [
      {
        resourceType: 'Practitioner',
        id: 'prac-1',
        name: [
          {
            prefix: ['Dr'],
            given: ['John'],
            family: 'Smith'
          }
        ]
      },
      {
        resourceType: 'Practitioner',
        id: 'prac-2',
        name: [
          {
            given: ['Jane', 'Mary'],
            family: 'Doe'
          }
        ]
      }
    ];

    const mockCandidateExpressions: CandidateExpressions = {
      'practitioner-select': [
        {
          expression: {
            language: 'application/x-fhir-query',
            expression: 'Practitioner'
          },
          result: mockPractitioners
        }
      ]
    };

    mockUseQuestionnaireStore.mockReturnValue(mockCandidateExpressions);

    const { result } = renderHook(() => useCandidateExpression('practitioner-select'));

    expect(result.current).toEqual([
      {
        valueString: 'Dr John Smith'
      },
      {
        valueString: 'Jane Mary Doe'
      }
    ]);
  });

  test('should handle primitive types as candidate options', () => {
    const mockPrimitiveResults = [
      'String result',
      42,
      { system: 'http://test.com', code: 'test', display: 'Test Code' }
    ];

    const mockCandidateExpressions: CandidateExpressions = {
      'primitive-select': [
        {
          expression: {
            language: 'text/fhirpath',
            expression: 'mixed.results'
          },
          result: mockPrimitiveResults
        }
      ]
    };

    mockUseQuestionnaireStore.mockReturnValue(mockCandidateExpressions);

    const { result } = renderHook(() => useCandidateExpression('primitive-select'));

    expect(result.current).toEqual([
      {
        valueString: 'String result'
      },
      {
        valueInteger: 42
      },
      {
        valueCoding: {
          system: 'http://test.com',
          code: 'test',
          display: 'Test Code'
        }
      }
    ]);
  });

  test('should handle unknown resource types by using display/name fallback', () => {
    const mockUnknownResources = [
      {
        resourceType: 'UnknownType',
        display: 'Unknown Resource Display'
      },
      {
        resourceType: 'AnotherUnknown',
        name: 'Unknown Resource Name'
      },
      {
        resourceType: 'NoDisplayOrName',
        someField: 'value'
      }
    ];

    const mockCandidateExpressions: CandidateExpressions = {
      'unknown-select': [
        {
          expression: {
            language: 'text/fhirpath',
            expression: 'Unknown.resources'
          },
          result: mockUnknownResources
        }
      ]
    };

    mockUseQuestionnaireStore.mockReturnValue(mockCandidateExpressions);

    const { result } = renderHook(() => useCandidateExpression('unknown-select'));

    expect(result.current).toEqual([
      {
        valueString: 'Unknown Resource Display'
      },
      {
        valueString: 'Unknown Resource Name'
      }
      // Third resource should be filtered out as it has no convertible content
    ]);
  });

  test('should combine results from multiple expressions', () => {
    const mockConditions = [
      {
        resourceType: 'Condition',
        code: { text: 'Diabetes' }
      }
    ];

    const mockObservations = [
      {
        resourceType: 'Observation',
        code: {
          coding: [{ system: 'http://test.com', code: 'obs1', display: 'Test Observation' }]
        }
      }
    ];

    const mockCandidateExpressions: CandidateExpressions = {
      'combined-select': [
        {
          expression: {
            language: 'text/fhirpath',
            expression: 'Condition'
          },
          result: mockConditions
        },
        {
          expression: {
            language: 'text/fhirpath',
            expression: 'Observation'
          },
          result: mockObservations
        }
      ]
    };

    mockUseQuestionnaireStore.mockReturnValue(mockCandidateExpressions);

    const { result } = renderHook(() => useCandidateExpression('combined-select'));

    expect(result.current).toEqual([
      {
        valueString: 'Diabetes'
      },
      {
        valueCoding: {
          system: 'http://test.com',
          code: 'obs1',
          display: 'Test Observation'
        }
      }
    ]);
  });

  test('should handle empty results in multi-expression scenario', () => {
    const mockCandidateExpressions: CandidateExpressions = {
      'mixed-results': [
        {
          expression: {
            language: 'text/fhirpath',
            expression: 'Empty.expression'
          },
          result: []
        },
        {
          expression: {
            language: 'text/fhirpath',
            expression: 'Valid.expression'
          },
          result: ['Valid result']
        },
        {
          expression: {
            language: 'text/fhirpath',
            expression: 'Undefined.expression'
          },
          result: undefined
        }
      ]
    };

    mockUseQuestionnaireStore.mockReturnValue(mockCandidateExpressions);

    const { result } = renderHook(() => useCandidateExpression('mixed-results'));

    expect(result.current).toEqual([
      {
        valueString: 'Valid result'
      }
    ]);
  });
});
