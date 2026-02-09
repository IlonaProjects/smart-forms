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

import type { Meta, StoryObj } from '@storybook/react';
import type { Questionnaire } from 'fhir/r4';
import BaseRenderer, { type BaseRendererProps } from '../../components/BaseRenderer';

const meta: Meta<typeof BaseRenderer> = {
  title: 'Smart Forms 3.0.0-alpha/SDC Behaviors/Candidate Expressions',
  component: BaseRenderer,
  argTypes: {
    questionnaire: {
      control: false
    }
  }
};

export default meta;

type Story = StoryObj<typeof meta>;

const questionnaireWithCandidateExpressions: Questionnaire = {
  resourceType: 'Questionnaire',
  id: 'candidate-expressions-demo',
  name: 'CandidateExpressionsDemo',
  title: 'SDC Candidate Expressions Demo',
  version: '1.0.0',
  status: 'active',
  experimental: true,
  description: 'Demonstrates FHIR SDC candidate expression functionality for dynamic option lists',
  item: [
    {
      linkId: 'condition-select',
      text: 'Select a condition from your medical history',
      type: 'choice',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'application/x-fhir-query',
            expression: 'Condition?patient={{%patient.id}}&clinical-status=active'
          }
        }
      ],
      answerOption: [
        {
          valueCoding: {
            system: 'http://snomed.info/sct',
            code: '38341003',
            display: 'Hypertensive disorder'
          }
        }
      ]
    },
    {
      linkId: 'medication-select',
      text: 'Select your current medications',
      type: 'choice',
      repeats: true,
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'application/x-fhir-query',
            expression: 'MedicationRequest?patient={{%patient.id}}&status=active'
          }
        }
      ],
      answerOption: [
        {
          valueCoding: {
            system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
            code: '308136',
            display: 'Lisinopril'
          }
        }
      ]
    },
    {
      linkId: 'practitioner-select',
      text: 'Select your primary care provider',
      type: 'choice',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'application/x-fhir-query',
            expression: 'Practitioner?active=true&_profile=http://hl7.org/fhir/us/core/StructureDefinition/us-core-practitioner'
          }
        }
      ],
      answerOption: [
        {
          valueString: 'Dr. Jane Smith'
        }
      ]
    },
    {
      linkId: 'observation-fhirpath',
      text: 'Recent vital signs (using FHIRPath)',
      type: 'choice', 
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: '%resource.entry.where(resource.resourceType = \\'Observation\\' and resource.subject.reference = (\\'Patient/\\' + %patient.id) and resource.status = \\'final\\').resource'
          }
        }
      ],
      answerOption: [
        {
          valueCoding: {
            system: 'http://loinc.org',
            code: '85354-9',
            display: 'Blood pressure panel'
          }
        }
      ]
    },
    {
      linkId: 'simple-string-candidates',
      text: 'Select preferred communication method',
      type: 'choice',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: "('Email' | 'Phone' | 'Text Message' | 'Portal Message')"
          }
        }
      ],
      answerOption: [
        {
          valueString: 'Mail'
        }
      ]
    }
  ]
};

const questionnaireCandidateExpressionsMultiple: Questionnaire = {
  resourceType: 'Questionnaire',
  id: 'multiple-candidate-expressions',
  name: 'MultipleCandidateExpressions',
  title: 'Multiple Candidate Expressions Demo',
  version: '1.0.0',
  status: 'active',
  experimental: true,
  description: 'Demonstrates multiple candidate expressions on a single question',
  item: [
    {
      linkId: 'combined-options',
      text: 'Select from combined static and dynamic options',
      type: 'choice',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'application/x-fhir-query',
            expression: 'Condition?patient={{%patient.id}}&clinical-status=active&_count=5'
          }
        },
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath', 
            expression: "('Other condition not listed' | 'Prefer not to say')"
          }
        }
      ],
      answerOption: [
        {
          valueCoding: {
            system: 'http://snomed.info/sct',
            code: '44054006',
            display: 'Diabetes mellitus'
          }
        },
        {
          valencyCoding: {
            system: 'http://snomed.info/sct', 
            code: '127013003',
            display: 'Emotional state finding'
          }
        }
      ]
    }
  ]
};

// Sample context data that would populate the expressions
const mockPatient = {
  resourceType: 'Patient',
  id: 'example-patient',
  name: [{ given: ['John'], family: 'Doe' }],
  gender: 'male',
  birthDate: '1980-01-01'
};

// Mock FHIR Bundle that candidate expressions could query
const mockBundle = {
  resourceType: 'Bundle',
  id: 'candidate-expression-context',
  type: 'collection',
  entry: [
    {
      resource: {
        resourceType: 'Condition',
        id: 'condition-1',
        subject: { reference: 'Patient/example-patient' },
        clinicalStatus: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }]
        },
        code: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '53741008',
              display: 'Coronary artery disease'
            }
          ]
        }
      }
    },
    {
      resource: {
        resourceType: 'Condition', 
        id: 'condition-2',
        subject: { reference: 'Patient/example-patient' },
        clinicalStatus: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }]
        },
        code: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '190205005',
              display: 'Chronic obstructive pulmonary disease'
            }
          ]
        }
      }
    },
    {
      resource: {
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        subject: { reference: 'Patient/example-patient' },
        medicationCodeableConcept: {
          coding: [
            {
              system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
              code: '314076',
              display: 'Atorvastatin'
            }
          ]
        }
      }
    },
    {
      resource: {
        resourceType: 'Practitioner',
        id: 'practitioner-1',
        active: true,
        name: [{ given: ['Alice'], family: 'Johnson', prefix: ['Dr.'] }],
        qualification: [
          {
            code: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v2-0360/2.7',
                  code: 'MD',
                  display: 'Doctor of Medicine'
                }
              ]
            }
          }
        ]
      }
    },
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        subject: { reference: 'Patient/example-patient' },
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '85354-9', 
              display: 'Blood pressure panel with all children optional'
            }
          ]
        },
        valueQuantity: {
          value: 120,
          unit: 'mmHg'
        }
      }
    }
  ]
};

export const BasicCandidateExpressions: Story = {
  args: {
    questionnaire: questionnaireWithCandidateExpressions,
    additionalVariables: [
      { name: 'patient', resource: mockPatient },
      { name: 'resource', resource: mockBundle }
    ]
  } as BaseRendererProps
};

export const MultipleCandidateExpressions: Story = {
  args: {
    questionnaire: questionnaireCandidateExpressionsMultiple,
    additionalVariables: [
      { name: 'patient', resource: mockPatient },
      { name: 'resource', resource: mockBundle }
    ]
  } as BaseRendererProps
};