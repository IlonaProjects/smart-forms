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

import type {
  CandidateExpression,
  CandidateExpressions,
  CandidateOption
} from '../interfaces/candidateExpression.interface';
import { describe, expect, test } from '@jest/globals';
import type { Expression, Coding } from 'fhir/r4';

describe('CandidateExpression Interfaces', () => {
  describe('CandidateExpression', () => {
    test('should allow valid CandidateExpression structure', () => {
      const expression: Expression = {
        language: 'text/fhirpath',
        expression: 'Condition.code'
      };

      const candidateExpression: CandidateExpression = {
        expression: expression,
        result: undefined
      };

      expect(candidateExpression.expression).toEqual(expression);
      expect(candidateExpression.result).toBeUndefined();
    });

    test('should allow CandidateExpression with results', () => {
      const expression: Expression = {
        language: 'application/x-fhir-query',
        expression: 'Condition?patient={{%patient.id}}'
      };

      const mockResults = [
        { resourceType: 'Condition', code: { text: 'Diabetes' } },
        { resourceType: 'Condition', code: { text: 'Hypertension' } }
      ];

      const candidateExpression: CandidateExpression = {
        expression: expression,
        result: mockResults
      };

      expect(candidateExpression.expression).toEqual(expression);
      expect(candidateExpression.result).toEqual(mockResults);
      expect(candidateExpression.result).toHaveLength(2);
    });
  });

  describe('CandidateExpressions', () => {
    test('should allow collection of candidate expressions by linkId', () => {
      const expressions: CandidateExpressions = {
        'condition-select': [
          {
            expression: {
              language: 'text/fhirpath',
              expression: 'Condition.code'
            },
            result: []
          }
        ],
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

      expect(expressions['condition-select']).toBeDefined();
      expect(expressions['medication-select']).toBeDefined();
      expect(expressions['condition-select']).toHaveLength(1);
      expect(expressions['medication-select']).toHaveLength(1);
    });

    test('should allow multiple expressions per linkId', () => {
      const expressions: CandidateExpressions = {
        'combined-select': [
          {
            expression: {
              language: 'text/fhirpath',
              expression: 'Condition.code'
            },
            result: []
          },
          {
            expression: {
              language: 'application/x-fhir-query',
              expression: 'Observation?code=glucose'
            },
            result: []
          }
        ]
      };

      expect(expressions['combined-select']).toHaveLength(2);
      expect(expressions['combined-select'][0].expression.language).toBe('text/fhirpath');
      expect(expressions['combined-select'][1].expression.language).toBe('application/x-fhir-query');
    });
  });

  describe('CandidateOption', () => {
    test('should support valueCoding option', () => {
      const coding: Coding = {
        system: 'http://snomed.info/sct',
        code: '73211009',
        display: 'Diabetes mellitus'
      };

      const option: CandidateOption = {
        valueCoding: coding
      };

      expect(option.valueCoding).toEqual(coding);
      expect(option.valueString).toBeUndefined();
    });

    test('should support valueString option', () => {
      const option: CandidateOption = {
        valueString: 'Patient reported symptom'
      };

      expect(option.valueString).toBe('Patient reported symptom');
      expect(option.valueCoding).toBeUndefined();
    });

    test('should support valueInteger option', () => {
      const option: CandidateOption = {
        valueInteger: 42
      };

      expect(option.valueInteger).toBe(42);
      expect(option.valueString).toBeUndefined();
    });

    test('should support valueDate option', () => {
      const option: CandidateOption = {
        valueDate: '2024-01-15'
      };

      expect(option.valueDate).toBe('2024-01-15');
      expect(option.valueInteger).toBeUndefined();
    });

    test('should support valueBoolean option', () => {
      const option: CandidateOption = {
        valueBoolean: true
      };

      expect(option.valueBoolean).toBe(true);
      expect(option.valueDate).toBeUndefined();
    });

    test('should support valueDecimal option', () => {
      const option: CandidateOption = {
        valueDecimal: 98.6
      };

      expect(option.valueDecimal).toBe(98.6);
      expect(option.valueBoolean).toBeUndefined();
    });

    test('should allow multiple value types (though only one should be used)', () => {
      const option: CandidateOption = {
        valueString: 'test',
        valueInteger: 123,
        valueBoolean: false
      };

      expect(option.valueString).toBe('test');
      expect(option.valueInteger).toBe(123);
      expect(option.valueBoolean).toBe(false);
    });
  });
});