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

import { describe, expect, test } from '@jest/globals';
import { getCandidateExpressions } from '../utils/getExpressionsFromItem';
import type { QuestionnaireItem } from 'fhir/r4';

describe('getCandidateExpressions', () => {
  test('should return empty array when no extensions exist', () => {
    const qItem: QuestionnaireItem = {
      linkId: 'test-item',
      type: 'choice',
      text: 'Test Question'
    };

    const result = getCandidateExpressions(qItem);

    expect(result).toEqual([]);
  });

  test('should return empty array when no candidate expression extensions exist', () => {
    const qItem: QuestionnaireItem = {
      linkId: 'test-item',
      type: 'choice',
      text: 'Test Question',
      extension: [
        {
          url: 'http://hl7.org/fhir/StructureDefinition/other-extension',
          valueString: 'some value'
        }
      ]
    };

    const result = getCandidateExpressions(qItem);

    expect(result).toEqual([]);
  });

  test('should extract FHIRPath candidate expression', () => {
    const qItem: QuestionnaireItem = {
      linkId: 'condition-select',
      type: 'choice',
      text: 'Select Condition',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: 'Bundle.entry.resource.where(resourceType=\'Condition\')'
          }
        }
      ]
    };

    const result = getCandidateExpressions(qItem);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      expression: {
        language: 'text/fhirpath',
        expression: 'Bundle.entry.resource.where(resourceType=\'Condition\')'
      },
      result: undefined
    });
  });

  test('should extract x-fhir-query candidate expression', () => {
    const qItem: QuestionnaireItem = {
      linkId: 'medication-select',
      type: 'choice',
      text: 'Select Medication',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'application/x-fhir-query',
            expression: 'MedicationRequest?patient={{%patient.id}}'
          }
        }
      ]
    };

    const result = getCandidateExpressions(qItem);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      expression: {
        language: 'application/x-fhir-query',
        expression: 'MedicationRequest?patient={{%patient.id}}'
      },
      result: undefined
    });
  });

  test('should extract multiple candidate expressions', () => {
    const qItem: QuestionnaireItem = {
      linkId: 'multi-source-select',
      type: 'choice',
      text: 'Select from Multiple Sources',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: 'Bundle.entry.resource.where(resourceType=\'Condition\')'
          }
        },
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'application/x-fhir-query',
            expression: 'Observation?code=glucose&patient={{%patient.id}}'
          }
        },
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: '%someVariable.entry.resource'
          }
        }
      ]
    };

    const result = getCandidateExpressions(qItem);

    expect(result).toHaveLength(3);
    expect(result[0].expression.language).toBe('text/fhirpath');
    expect(result[0].expression.expression).toBe('Bundle.entry.resource.where(resourceType=\'Condition\')');
    expect(result[1].expression.language).toBe('application/x-fhir-query');
    expect(result[1].expression.expression).toBe('Observation?code=glucose&patient={{%patient.id}}');
    expect(result[2].expression.language).toBe('text/fhirpath');
    expect(result[2].expression.expression).toBe('%someVariable.entry.resource');
  });

  test('should ignore candidate expressions with unsupported languages', () => {
    const qItem: QuestionnaireItem = {
      linkId: 'unsupported-select',
      type: 'choice',
      text: 'Select with Unsupported Language',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/cql',
            expression: 'some CQL expression'
          }
        },
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: 'Bundle.entry.resource'
          }
        },
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'application/javascript',
            expression: 'some JavaScript'
          }
        }
      ]
    };

    const result = getCandidateExpressions(qItem);

    expect(result).toHaveLength(1);
    expect(result[0].expression.language).toBe('text/fhirpath');
    expect(result[0].expression.expression).toBe('Bundle.entry.resource');
  });

  test('should ignore candidate expressions without valueExpression', () => {
    const qItem: QuestionnaireItem = {
      linkId: 'invalid-select',
      type: 'choice',
      text: 'Select with Invalid Extension',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueString: 'not an expression'
        },
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: 'Valid.expression'
          }
        }
      ]
    };

    const result = getCandidateExpressions(qItem);

    expect(result).toHaveLength(1);
    expect(result[0].expression.expression).toBe('Valid.expression');
  });

  test('should ignore candidate expressions with empty valueExpression', () => {
    const qItem: QuestionnaireItem = {
      linkId: 'empty-expression-select',
      type: 'choice',
      text: 'Select with Empty Expression',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {}
        },
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: 'Valid.expression'
          }
        }
      ]
    };

    const result = getCandidateExpressions(qItem);

    expect(result).toHaveLength(1);
    expect(result[0].expression.expression).toBe('Valid.expression');
  });

  test('should handle mixed extensions correctly', () => {
    const qItem: QuestionnaireItem = {
      linkId: 'mixed-extensions',
      type: 'choice',
      text: 'Mixed Extensions',
      extension: [
        {
          url: 'http://hl7.org/fhir/StructureDefinition/other-extension',
          valueString: 'other value'
        },
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: 'Condition.code'
          }
        },
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: 'Patient.name'
          }
        },
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'application/x-fhir-query',
            expression: 'MedicationRequest?patient={{%patient.id}}'
          }
        }
      ]
    };

    const result = getCandidateExpressions(qItem);

    expect(result).toHaveLength(2);
    expect(result[0].expression.language).toBe('text/fhirpath');
    expect(result[0].expression.expression).toBe('Condition.code');
    expect(result[1].expression.language).toBe('application/x-fhir-query');
    expect(result[1].expression.expression).toBe('MedicationRequest?patient={{%patient.id}}');
  });

  test('should set result property to undefined for all expressions', () => {
    const qItem: QuestionnaireItem = {
      linkId: 'result-check',
      type: 'choice',
      text: 'Result Check',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: 'Bundle.entry.resource'
          }
        },
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'application/x-fhir-query',
            expression: 'Patient?_id={{%patient.id}}'
          }
        }
      ]
    };

    const result = getCandidateExpressions(qItem);

    expect(result).toHaveLength(2);
    expect(result[0].result).toBeUndefined();
    expect(result[1].result).toBeUndefined();
  });

  test('should handle complex FHIRPath expressions', () => {
    const qItem: QuestionnaireItem = {
      linkId: 'complex-fhirpath',
      type: 'choice',
      text: 'Complex FHIRPath',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: '%Bundle.entry.resource.where(resourceType=\'Condition\' and clinicalStatus.coding.where(system=\'http://terminology.hl7.org/CodeSystem/condition-clinical\' and code=\'active\')).code.coding.where(system=\'http://snomed.info/sct\')'
          }
        }
      ]
    };

    const result = getCandidateExpressions(qItem);

    expect(result).toHaveLength(1);
    expect(result[0].expression.language).toBe('text/fhirpath');
    expect(result[0].expression.expression).toContain('where(resourceType=\'Condition\'');
    expect(result[0].expression.expression).toContain('clinicalStatus.coding');
    expect(result[0].expression.expression).toContain('system=\'http://snomed.info/sct\'');
  });

  test('should handle complex x-fhir-query expressions', () => {
    const qItem: QuestionnaireItem = {
      linkId: 'complex-query',
      type: 'choice',
      text: 'Complex Query',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'application/x-fhir-query',
            expression: 'Condition?patient={{%patient.id}}&clinical-status=active&verification-status=confirmed&_sort=-onset-date&_count=50'
          }
        }
      ]
    };

    const result = getCandidateExpressions(qItem);

    expect(result).toHaveLength(1);
    expect(result[0].expression.language).toBe('application/x-fhir-query');
    expect(result[0].expression.expression).toContain('clinical-status=active');
    expect(result[0].expression.expression).toContain('verification-status=confirmed');
    expect(result[0].expression.expression).toContain('_sort=-onset-date');
    expect(result[0].expression.expression).toContain('_count=50');
  });
});