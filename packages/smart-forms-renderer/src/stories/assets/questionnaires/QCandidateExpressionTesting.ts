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

import type { Questionnaire } from 'fhir/r4';

export const qCandidateExpressionBasic: Questionnaire = {
  resourceType: 'Questionnaire',
  status: 'draft',
  extension: [
    {
      url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-launchContext',
      extension: [
        {
          url: 'name',
          valueCoding: {
            system: 'http://hl7.org/fhir/uv/sdc/CodeSystem/launchContext',
            code: 'patient'
          }
        },
        {
          url: 'type',
          valueCode: 'Patient'
        },
        {
          url: 'description',
          valueString: 'The patient that is to be used for candidate expressions'
        }
      ]
    },
    {
      url: 'http://hl7.org/fhir/StructureDefinition/variable',
      valueExpression: {
        name: 'PatientConditions',
        language: 'application/x-fhir-query',
        expression: 'Condition?patient={{%patient.id}}&clinical-status=active'
      }
    }
  ],
  item: [
    {
      linkId: 'condition-select-fhirpath',
      type: 'choice',
      text: 'Select a condition (FHIRPath)',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: '%PatientConditions.entry.resource.where(resourceType=\'Condition\')'
          }
        }
      ]
    },
    {
      linkId: 'condition-select-query',
      type: 'choice',
      text: 'Select a condition (x-fhir-query)',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'application/x-fhir-query',
            expression: 'Condition?patient={{%patient.id}}&clinical-status=active&verification-status=confirmed'
          }
        }
      ]
    },
    {
      linkId: 'medication-select',
      type: 'choice',
      text: 'Select current medications',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'application/x-fhir-query',
            expression: 'MedicationRequest?patient={{%patient.id}}&status=active'
          }
        }
      ]
    }
  ]
};

export const qCandidateExpressionMultiSource: Questionnaire = {
  resourceType: 'Questionnaire',
  status: 'draft',
  extension: [
    {
      url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-launchContext',
      extension: [
        {
          url: 'name',
          valueCoding: {
            system: 'http://hl7.org/fhir/uv/sdc/CodeSystem/launchContext',
            code: 'patient'
          }
        },
        {
          url: 'type',
          valueCode: 'Patient'
        }
      ]
    },
    {
      url: 'http://hl7.org/fhir/StructureDefinition/variable',
      valueExpression: {
        name: 'AllConditions',
        language: 'application/x-fhir-query',
        expression: 'Condition?patient={{%patient.id}}'
      }
    },
    {
      url: 'http://hl7.org/fhir/StructureDefinition/variable',  
      valueExpression: {
        name: 'AllObservations',
        language: 'application/x-fhir-query',
        expression: 'Observation?patient={{%patient.id}}&category=vital-signs'
      }
    }
  ],
  item: [
    {
      linkId: 'combined-health-data',
      type: 'choice',
      text: 'Select from conditions or vital signs',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: '%AllConditions.entry.resource.where(resourceType=\'Condition\')'
          }
        },
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: '%AllObservations.entry.resource.where(resourceType=\'Observation\')'
          }
        }
      ]
    }
  ]
};

export const qCandidateExpressionPractitioner: Questionnaire = {
  resourceType: 'Questionnaire',
  status: 'draft',
  extension: [
    {
      url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-launchContext',
      extension: [
        {
          url: 'name',
          valueCoding: {
            system: 'http://hl7.org/fhir/uv/sdc/CodeSystem/launchContext',
            code: 'user'
          }
        },
        {
          url: 'type',
          valueCode: 'Practitioner'
        },
        {
          url: 'description',
          valueString: 'The practitioner user for candidate expressions'
        }
      ]
    }
  ],
  item: [
    {
      linkId: 'practitioner-select',
      type: 'choice',
      text: 'Select a practitioner',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'application/x-fhir-query',
            expression: 'Practitioner?active=true'
          }
        }
      ]
    },
    {
      linkId: 'practitioner-role-select',
      type: 'choice',
      text: 'Select practitioner role',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'application/x-fhir-query',
            expression: 'PractitionerRole?practitioner={{%user.id}}&active=true'
          }
        }
      ]
    }
  ]
};

export const qCandidateExpressionComplex: Questionnaire = {
  resourceType: 'Questionnaire',
  status: 'draft',
  extension: [
    {
      url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-launchContext',
      extension: [
        {
          url: 'name',
          valueCoding: {
            system: 'http://hl7.org/fhir/uv/sdc/CodeSystem/launchContext',
            code: 'patient'
          }
        },
        {
          url: 'type',
          valueCode: 'Patient'
        }
      ]
    },
    {
      url: 'http://hl7.org/fhir/StructureDefinition/variable',
      valueExpression: {
        name: 'RecentConditions',
        language: 'application/x-fhir-query',
        expression: 'Condition?patient={{%patient.id}}&_sort=-onset-date&_count=10'
      }
    },
    {
      url: 'http://hl7.org/fhir/StructureDefinition/variable',
      valueExpression: {
        name: 'ChronicConditions',
        language: 'application/x-fhir-query', 
        expression: 'Condition?patient={{%patient.id}}&clinical-status=active&category=problem-list-item'
      }
    }
  ],
  item: [
    {
      linkId: 'primary-concern',
      type: 'choice',
      text: 'What is your primary health concern today?',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: '%RecentConditions.entry.resource.where(resourceType=\'Condition\' and clinicalStatus.coding.where(system=\'http://terminology.hl7.org/CodeSystem/condition-clinical\' and code=\'active\'))'
          }
        }
      ]
    },
    {
      linkId: 'chronic-conditions',
      type: 'choice',
      text: 'Select relevant chronic conditions',
      repeats: true,
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: '%ChronicConditions.entry.resource.where(resourceType=\'Condition\')'
          }
        }
      ]
    },
    {
      linkId: 'related-medications',
      type: 'choice',
      text: 'Current medications for selected conditions',
      repeats: true,
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'application/x-fhir-query',
            expression: 'MedicationRequest?patient={{%patient.id}}&status=active&intent=order'
          }
        }
      ]
    }
  ]
};

export const qCandidateExpressionValueSet: Questionnaire = {
  resourceType: 'Questionnaire',
  status: 'draft',
  extension: [
    {
      url: 'http://hl7.org/fhir/StructureDefinition/variable',
      valueExpression: {
        name: 'DiabetesValueSet',
        language: 'application/x-fhir-query',
        expression: 'ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/condition-code&filter=diabetes'
      }
    }
  ],
  item: [
    {
      linkId: 'diabetes-type-select',
      type: 'choice',
      text: 'Select type of diabetes',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: '%DiabetesValueSet.expansion.contains.where(display contains \'diabetes\')'
          }
        }
      ]
    },
    {
      linkId: 'symptom-codes',
      type: 'choice',
      text: 'Select symptom codes',
      repeats: true,
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'application/x-fhir-query', 
            expression: 'ValueSet/$expand?url=http://snomed.info/sct&filter=symptom'
          }
        }
      ]
    }
  ]
};

export const qCandidateExpressionObservation: Questionnaire = {
  resourceType: 'Questionnaire',
  status: 'draft',
  extension: [
    {
      url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-launchContext',
      extension: [
        {
          url: 'name',
          valueCoding: {
            system: 'http://hl7.org/fhir/uv/sdc/CodeSystem/launchContext',
            code: 'patient'
          }
        },
        {
          url: 'type',
          valueCode: 'Patient'
        }
      ]
    },
    {
      url: 'http://hl7.org/fhir/StructureDefinition/variable',
      valueExpression: {
        name: 'VitalSigns',
        language: 'application/x-fhir-query',
        expression: 'Observation?patient={{%patient.id}}&category=vital-signs&_sort=-date&_count=20'
      }
    },
    {
      url: 'http://hl7.org/fhir/StructureDefinition/variable',
      valueExpression: {
        name: 'LabResults',
        language: 'application/x-fhir-query',
        expression: 'Observation?patient={{%patient.id}}&category=laboratory&_sort=-date&_count=20'
      }
    }
  ],
  item: [
    {
      linkId: 'recent-vital-signs',
      type: 'choice',
      text: 'Select relevant vital signs',
      repeats: true,
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: '%VitalSigns.entry.resource.where(resourceType=\'Observation\' and status=\'final\')'
          }
        }
      ]
    },
    {
      linkId: 'abnormal-lab-results',
      type: 'choice', 
      text: 'Select abnormal lab results',
      repeats: true,
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: '%LabResults.entry.resource.where(resourceType=\'Observation\' and status=\'final\' and interpretation.coding.where(system=\'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation\' and (code=\'H\' or code=\'L\' or code=\'A\')))'
          }
        }
      ]
    }
  ]
};

export const qCandidateExpressionEncounter: Questionnaire = {
  resourceType: 'Questionnaire',
  status: 'draft',
  extension: [
    {
      url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-launchContext',
      extension: [
        {
          url: 'name',
          valueCoding: {
            system: 'http://hl7.org/fhir/uv/sdc/CodeSystem/launchContext',
            code: 'patient'
          }
        },
        {
          url: 'type',
          valueCode: 'Patient'
        }
      ]
    },
    {
      url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-launchContext',
      extension: [
        {
          url: 'name',
          valueCoding: {
            system: 'http://hl7.org/fhir/uv/sdc/CodeSystem/launchContext',
            code: 'encounter'
          }
        },  
        {
          url: 'type',
          valueCode: 'Encounter'
        }
      ]
    }
  ],
  item: [
    {
      linkId: 'previous-encounters',
      type: 'choice',
      text: 'Select previous encounters',
      repeats: true,
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'application/x-fhir-query',
            expression: 'Encounter?patient={{%patient.id}}&status=finished&_sort=-date&_count=10'
          }
        }
      ]
    },
    {
      linkId: 'encounter-diagnoses',
      type: 'choice',
      text: 'Diagnoses from current encounter',
      repeats: true,
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: '%encounter.diagnosis.condition.resolve()'
          }
        }
      ]
    }
  ]
};

export const qCandidateExpressionErrorHandling: Questionnaire = {
  resourceType: 'Questionnaire',
  status: 'draft',
  item: [
    {
      linkId: 'invalid-expression',
      type: 'choice',
      text: 'Test invalid expression',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath',
            expression: 'invalid.fhirpath.expression.that.should.fail'
          }
        }
      ]
    },
    {
      linkId: 'empty-results',
      type: 'choice',
      text: 'Test empty results',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'text/fhirpath', 
            expression: 'Bundle.entry.resource.where(resourceType=\'NonexistentResource\')'
          }
        }
      ]
    },
    {
      linkId: 'network-failure',
      type: 'choice',
      text: 'Test network failure',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-candidateExpression',
          valueExpression: {
            language: 'application/x-fhir-query',
            expression: 'InvalidResource?nonexistent=parameter'
          }
        }
      ]
    }
  ]
};