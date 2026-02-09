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
  Patient,
  Condition,
  MedicationRequest,
  Observation,
  Practitioner,
  PractitionerRole,
  Encounter,
  Bundle,
  ValueSet
} from 'fhir/r4';

// Mock Patient data
export const mockPatient: Patient = {
  resourceType: 'Patient',
  id: 'test-patient-123',
  name: [
    {
      use: 'official',
      family: 'Doe',
      given: ['John', 'Michael']
    }
  ],
  gender: 'male',
  birthDate: '1980-01-15',
  active: true
};

// Mock Condition data for candidate expressions
export const mockConditions: Condition[] = [
  {
    resourceType: 'Condition',
    id: 'condition-diabetes',
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'active',
          display: 'Active'
        }
      ]
    },
    verificationStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'confirmed',
          display: 'Confirmed'
        }
      ]
    },
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '73211009',
          display: 'Diabetes mellitus'
        }
      ],
      text: 'Diabetes mellitus'
    },
    subject: {
      reference: 'Patient/test-patient-123'
    },
    onsetDateTime: '2019-03-15',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
            code: 'problem-list-item',
            display: 'Problem List Item'
          }
        ]
      }
    ]
  },
  {
    resourceType: 'Condition',
    id: 'condition-hypertension',
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'active',
          display: 'Active'
        }
      ]
    },
    verificationStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'confirmed',
          display: 'Confirmed'
        }
      ]
    },
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '59621000',
          display: 'Essential hypertension'
        }
      ],
      text: 'Essential hypertension'
    },
    subject: {
      reference: 'Patient/test-patient-123'
    },
    onsetDateTime: '2020-08-22',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
            code: 'problem-list-item',
            display: 'Problem List Item'
          }
        ]
      }
    ]
  },
  {
    resourceType: 'Condition',
    id: 'condition-asthma',
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'active',
          display: 'Active'
        }
      ]
    },
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '195967001',
          display: 'Asthma'
        }
      ],
      text: 'Bronchial asthma'
    },
    subject: {
      reference: 'Patient/test-patient-123'
    },
    onsetDateTime: '2015-06-10'
  }
];

// Mock MedicationRequest data
export const mockMedicationRequests: MedicationRequest[] = [
  {
    resourceType: 'MedicationRequest',
    id: 'med-request-metformin',
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '109081006',
          display: 'Metformin'
        }
      ],
      text: 'Metformin 500mg'
    },
    subject: {
      reference: 'Patient/test-patient-123'
    },
    dosageInstruction: [
      {
        text: 'Take 500mg twice daily with meals',
        timing: {
          repeat: {
            frequency: 2,
            period: 1,
            periodUnit: 'd'
          }
        }
      }
    ]
  },
  {
    resourceType: 'MedicationRequest',
    id: 'med-request-lisinopril',
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '386862002',
          display: 'Lisinopril'
        }
      ],
      text: 'Lisinopril 10mg'
    },
    subject: {
      reference: 'Patient/test-patient-123'
    },
    dosageInstruction: [
      {
        text: 'Take 10mg once daily',
        timing: {
          repeat: {
            frequency: 1,
            period: 1,
            periodUnit: 'd'
          }
        }
      }
    ]
  },
  {
    resourceType: 'MedicationRequest',
    id: 'med-request-albuterol',
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: {
      text: 'Albuterol Inhaler 90mcg'
    },
    subject: {
      reference: 'Patient/test-patient-123'
    },
    dosageInstruction: [
      {
        text: 'Inhale 2 puffs as needed for shortness of breath',
        asNeededBoolean: true
      }
    ]
  }
];

// Mock Observation data
export const mockObservations: Observation[] = [
  {
    resourceType: 'Observation',
    id: 'obs-blood-pressure',
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs',
            display: 'Vital Signs'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '85354-9',
          display: 'Blood pressure panel with all children optional'
        }
      ]
    },
    subject: {
      reference: 'Patient/test-patient-123'
    },
    effectiveDateTime: '2024-01-15T10:30:00Z',
    component: [
      {
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '8480-6',
              display: 'Systolic blood pressure'
            }
          ]
        },
        valueQuantity: {
          value: 140,
          unit: 'mmHg',
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]'
        },
        interpretation: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                code: 'H',
                display: 'High'
              }
            ]
          }
        ]
      },
      {
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '8462-4',
              display: 'Diastolic blood pressure'
            }
          ]
        },
        valueQuantity: {
          value: 90,
          unit: 'mmHg',
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]'
        },
        interpretation: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                code: 'H',
                display: 'High'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    resourceType: 'Observation',
    id: 'obs-glucose',
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'laboratory',
            display: 'Laboratory'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '33747-0',
          display: 'Glucose [Mass/volume] in Blood'
        }
      ]
    },
    subject: {
      reference: 'Patient/test-patient-123'
    },
    effectiveDateTime: '2024-01-10T08:00:00Z',
    valueQuantity: {
      value: 180,
      unit: 'mg/dL',
      system: 'http://unitsofmeasure.org',
      code: 'mg/dL'
    },
    interpretation: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: 'H',
            display: 'High'
          }
        ]
      }
    ],
    referenceRange: [
      {
        low: {
          value: 70,
          unit: 'mg/dL'
        },
        high: {
          value: 140,
          unit: 'mg/dL'
        }
      }
    ]
  },
  {
    resourceType: 'Observation',
    id: 'obs-weight',
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs',
            display: 'Vital Signs'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '29463-7',
          display: 'Body weight'
        }
      ]
    },
    subject: {
      reference: 'Patient/test-patient-123'
    },
    effectiveDateTime: '2024-01-15T10:00:00Z',
    valueQuantity: {
      value: 85.5,
      unit: 'kg',
      system: 'http://unitsofmeasure.org',
      code: 'kg'
    }
  }
];

// Mock Practitioner data
export const mockPractitioners: Practitioner[] = [
  {
    resourceType: 'Practitioner',
    id: 'practitioner-smith',
    active: true,
    name: [
      {
        use: 'official',
        prefix: ['Dr'],
        given: ['John'],
        family: 'Smith'
      }
    ],
    telecom: [
      {
        system: 'email',
        value: 'john.smith@example.com'
      }
    ],
    qualification: [
      {
        code: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0360',
              code: 'MD',
              display: 'Doctor of Medicine'
            }
          ]
        }
      }
    ]
  },
  {
    resourceType: 'Practitioner',
    id: 'practitioner-doe',
    active: true,
    name: [
      {
        use: 'official',
        given: ['Jane', 'Mary'],
        family: 'Doe'
      }
    ],
    telecom: [
      {
        system: 'email',
        value: 'jane.doe@example.com'
      }
    ],
    qualification: [
      {
        code: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0360',
              code: 'RN',
              display: 'Registered Nurse'
            }
          ]
        }
      }
    ]
  }
];

// Mock PractitionerRole data
export const mockPractitionerRoles: PractitionerRole[] = [
  {
    resourceType: 'PractitionerRole',
    id: 'role-physician',
    active: true,
    practitioner: {
      reference: 'Practitioner/practitioner-smith'
    },
    code: [
      {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '62247001',
            display: 'Family medicine specialist'
          }
        ]
      }
    ],
    specialty: [
      {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '419772000',
            display: 'Family practice'
          }
        ]
      }
    ]
  }
];

// Mock Encounter data
export const mockEncounters: Encounter[] = [
  {
    resourceType: 'Encounter',
    id: 'encounter-annual-checkup',
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory'
    },
    type: [
      {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '185349003',
            display: 'Annual physical examination'
          }
        ]
      }
    ],
    subject: {
      reference: 'Patient/test-patient-123'
    },
    period: {
      start: '2024-01-15T10:00:00Z',
      end: '2024-01-15T11:30:00Z'
    },
    participant: [
      {
        individual: {
          reference: 'Practitioner/practitioner-smith'
        }
      }
    ],
    diagnosis: [
      {
        condition: {
          reference: 'Condition/condition-diabetes'
        },
        rank: 1
      },
      {
        condition: {
          reference: 'Condition/condition-hypertension'
        },
        rank: 2
      }
    ]
  }
];

// Mock ValueSet data
export const mockValueSets: ValueSet[] = [
  {
    resourceType: 'ValueSet',
    id: 'diabetes-types',
    status: 'active',
    name: 'DiabetesTypes',
    title: 'Types of Diabetes',
    expansion: {
      identifier: 'urn:uuid:diabetes-expansion-001',
      timestamp: '2024-01-01T00:00:00Z',
      contains: [
        {
          system: 'http://snomed.info/sct',
          code: '44054006',
          display: 'Type 2 diabetes mellitus'
        },
        {
          system: 'http://snomed.info/sct',
          code: '46635009',
          display: 'Type 1 diabetes mellitus'
        },
        {
          system: 'http://snomed.info/sct',
          code: '11687002',
          display: 'Gestational diabetes mellitus'
        }
      ]
    }
  }
];

// Mock Bundle containing various resources
export const mockBundle: Bundle = {
  resourceType: 'Bundle',
  id: 'candidate-expression-test-bundle',
  type: 'collection',
  entry: [
    { resource: mockPatient },
    ...mockConditions.map((condition) => ({ resource: condition })),
    ...mockMedicationRequests.map((med) => ({ resource: med })),
    ...mockObservations.map((obs) => ({ resource: obs })),
    ...mockPractitioners.map((prac) => ({ resource: prac })),
    ...mockPractitionerRoles.map((role) => ({ resource: role })),
    ...mockEncounters.map((enc) => ({ resource: enc }))
  ]
};

// FHIRPath context with mock data for testing
export const mockFhirPathContext = {
  '%patient': mockPatient,
  '%PatientConditions': {
    entry: mockConditions.map((condition) => ({ resource: condition }))
  },
  '%AllConditions': {
    entry: mockConditions.map((condition) => ({ resource: condition }))
  },
  '%AllObservations': {
    entry: mockObservations.map((obs) => ({ resource: obs }))
  },
  '%VitalSigns': {
    entry: mockObservations
      .filter((obs) => obs.category?.[0]?.coding?.[0]?.code === 'vital-signs')
      .map((obs) => ({ resource: obs }))
  },
  '%LabResults': {
    entry: mockObservations
      .filter((obs) => obs.category?.[0]?.coding?.[0]?.code === 'laboratory')
      .map((obs) => ({ resource: obs }))
  },
  '%RecentConditions': {
    entry: mockConditions
      .sort((a, b) => (b.onsetDateTime || '').localeCompare(a.onsetDateTime || ''))
      .slice(0, 10)
      .map((condition) => ({ resource: condition }))
  },
  '%ChronicConditions': {
    entry: mockConditions
      .filter((condition) => condition.category?.[0]?.coding?.[0]?.code === 'problem-list-item')
      .map((condition) => ({ resource: condition }))
  },
  '%DiabetesValueSet': mockValueSets[0],
  '%user': mockPractitioners[0],
  '%encounter': mockEncounters[0],
  Bundle: mockBundle
};

// Helper function to create mock query results
export function createMockQueryResult(resourceType: string, count: number = 3) {
  const resources = {
    Condition: mockConditions,
    MedicationRequest: mockMedicationRequests,
    Observation: mockObservations,
    Practitioner: mockPractitioners,
    PractitionerRole: mockPractitionerRoles,
    Encounter: mockEncounters
  };

  const selectedResources = resources[resourceType as keyof typeof resources] || [];
  return selectedResources.slice(0, count);
}

// Helper function to create mock FHIRPath evaluation results
export function createMockFhirPathResult(expression: string): any {
  // Simple mock responses based on common expression patterns
  if (expression.includes('Condition')) {
    return mockConditions;
  }
  if (expression.includes('MedicationRequest')) {
    return mockMedicationRequests;
  }
  if (expression.includes('Observation')) {
    return mockObservations;
  }
  if (expression.includes('Practitioner') && !expression.includes('Role')) {
    return mockPractitioners;
  }
  if (expression.includes('PractitionerRole')) {
    return mockPractitionerRoles;
  }
  if (expression.includes('ValueSet')) {
    return mockValueSets[0].expansion?.contains || [];
  }
  if (expression.includes('Bundle.entry.resource')) {
    return mockBundle.entry?.map((entry) => entry.resource) || [];
  }

  // Default empty result
  return [];
}
