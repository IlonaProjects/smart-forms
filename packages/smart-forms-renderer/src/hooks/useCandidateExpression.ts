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

import type { Coding } from 'fhir/r4';
import { useQuestionnaireStore } from '../stores';

/**
 * A candidate option that can be selected as an answer
 * Supports the main FHIR answer types
 */
export interface CandidateOption {
  valueCoding?: Coding;
  valueString?: string;
  valueInteger?: number;
  valueDate?: string;
  valueBoolean?: boolean;
  valueDecimal?: number;
}

/**
 * React hook to get candidate options for a specific question
 * Following the pattern from useEnableWhen hook
 * 
 * @param linkId - The ID of the question we want candidates for
 * @returns Array of candidate options for this question
 */
export function useCandidateExpression(linkId: string): CandidateOption[] {
  // Get the current state from the questionnaire store
  const candidateExpressions = useQuestionnaireStore.use.candidateExpressions();
  
  // Get the candidate expressions for this specific question
  const candidateExpressionsForItem = candidateExpressions[linkId];
  
  // If no candidate expressions, return empty array
  if (!candidateExpressionsForItem || candidateExpressionsForItem.length === 0) {
    return [];
  }
  
  // Combine all candidate options from all expressions for this question
  const allCandidateOptions: CandidateOption[] = [];
  
  for (const candidateExpression of candidateExpressionsForItem) {
    // If expression has been evaluated and has results
    if (candidateExpression.result && candidateExpression.result.length > 0) {
      console.log('[useCandidateExpression] Raw results for', linkId, ':', candidateExpression.result);
      // Convert FHIR resources to answer options
      const options = convertResultsToCandidateOptions(candidateExpression.result);
      console.log('[useCandidateExpression] Converted options for', linkId, ':', options);
      allCandidateOptions.push(...options);
    }
  }
  
  console.log('[useCandidateExpression] Final options for', linkId, ':', allCandidateOptions);
  return allCandidateOptions;
}

/**
 * Helper function to convert FHIR query results into answer options
 * This is where we transform things like "Condition" resources into selectable options
 */
function convertResultsToCandidateOptions(results: any[]): CandidateOption[] {
  const candidateOptions: CandidateOption[] = [];
  
  for (const result of results) {
    // Handle different types of FHIR resources
    if (result.resourceType) {
      // It's a FHIR resource, extract useful info for display
      const option = convertResourceToCandidateOption(result);
      if (option) {
        candidateOptions.push(option);
      }
    } else if (typeof result === 'string') {
      // It's a simple string value
      candidateOptions.push({ valueString: result });
    } else if (typeof result === 'number') {
      // It's a number value
      candidateOptions.push({ valueInteger: result });
    } else if (result.system && result.code) {
      // It's already a Coding, use directly
      candidateOptions.push({ valueCoding: result });
    }
    // Could add more type handling as needed
  }
  
  return candidateOptions;
}

/**
 * Convert different FHIR resource types to display options
 */
function convertResourceToCandidateOption(resource: any): CandidateOption | null {
  console.log('[convertResourceToCandidateOption] Converting resource:', resource);
  
  switch (resource.resourceType) {
    case 'Condition':
      // For conditions, use the condition code if available
      console.log('[convertResourceToCandidateOption] Condition resource code:', resource.code);
      if (resource.code && resource.code.coding && resource.code.coding.length > 0) {
        const option = { valueCoding: resource.code.coding[0] };
        console.log('[convertResourceToCandidateOption] Condition -> Coding:', option);
        return option;
      } else if (resource.code && resource.code.text) {
        const option = { valueString: resource.code.text };
        console.log('[convertResourceToCandidateOption] Condition -> Text:', option);
        return option;
      }
      console.warn('[convertResourceToCandidateOption] Condition has no usable code');
      break;
      
    case 'MedicationRequest':
      // For medications, try to get medication name
      if (resource.medicationCodeableConcept?.coding?.[0]) {
        return { valueCoding: resource.medicationCodeableConcept.coding[0] };
      } else if (resource.medicationCodeableConcept?.text) {
        return { valueString: resource.medicationCodeableConcept.text };
      }
      break;
      
    case 'Observation':
      // For observations, could use the value or code
      if (resource.valueCodeableConcept?.coding?.[0]) {
        return { valueCoding: resource.valueCodeableConcept.coding[0] };
      } else if (resource.code?.coding?.[0]) {
        return { valueCoding: resource.code.coding[0] };
      }
      break;
      
    case 'Practitioner':
      // For practitioners, use name
      if (resource.name && resource.name.length > 0) {
        const name = resource.name[0];
        const display = [name.prefix, name.given, name.family].flat().filter(Boolean).join(' ');
        return { valueString: display };
      }
      break;

    case 'Patient':
      // For patients, format name properly
      if (resource.name && resource.name.length > 0) {
        const name = resource.name[0];
        const display = [name.given?.join(' '), name.family].filter(Boolean).join(' ');
        return { valueString: display };
      }
      break;

    case 'Organization':
      // For organizations, use organization name
      if (resource.name) {
        return { valueString: resource.name };
      }
      break;

    case 'Location':
      // For locations, use location name and type
      if (resource.name) {
        const display = resource.type?.coding?.[0]?.display 
          ? `${resource.name} (${resource.type.coding[0].display})`
          : resource.name;
        return { valueString: display };
      }
      break;

    case 'Medication':
      // For medications, get medication name/code
      if (resource.code?.coding?.[0]) {
        return { valueCoding: resource.code.coding[0] };
      } else if (resource.code?.text) {
        return { valueString: resource.code.text };
      }
      break;

    case 'DiagnosticReport':
      // For diagnostic reports, use the report code
      if (resource.code?.coding?.[0]) {
        return { valueCoding: resource.code.coding[0] };
      } else if (resource.code?.text) {
        return { valueString: resource.code.text };
      }
      break;

    case 'Procedure':
      // For procedures, use procedure code
      if (resource.code?.coding?.[0]) {
        return { valueCoding: resource.code.coding[0] };
      } else if (resource.code?.text) {
        return { valueString: resource.code.text };
      }
      break;

    case 'Encounter':
      // For encounters, use encounter type
      if (resource.type?.[0]?.coding?.[0]) {
        return { valueCoding: resource.type[0].coding[0] };
      } else if (resource.type?.[0]?.text) {
        return { valueString: resource.type[0].text };
      } else if (resource.class?.display) {
        return { valueString: resource.class.display };
      }
      break;

    case 'Device':
      // For devices, use device name/type
      if (resource.deviceName?.[0]?.name) {
        return { valueString: resource.deviceName[0].name };
      } else if (resource.type?.coding?.[0]) {
        return { valueCoding: resource.type.coding[0] };
      } else if (resource.type?.text) {
        return { valueString: resource.type.text };
      }
      break;

    case 'Immunization':
      // For immunizations, use vaccine code
      if (resource.vaccineCode?.coding?.[0]) {
        return { valueCoding: resource.vaccineCode.coding[0] };
      } else if (resource.vaccineCode?.text) {
        return { valueString: resource.vaccineCode.text };
      }
      break;

    case 'AllergyIntolerance':
      // For allergies, use the allergen code
      if (resource.code?.coding?.[0]) {
        return { valueCoding: resource.code.coding[0] };
      } else if (resource.code?.text) {
        return { valueString: resource.code.text };
      }
      break;

    case 'CarePlan':
      // For care plans, use the care plan category or title
      if (resource.title) {
        return { valueString: resource.title };
      } else if (resource.category?.[0]?.coding?.[0]) {
        return { valueCoding: resource.category[0].coding[0] };
      } else if (resource.category?.[0]?.text) {
        return { valueString: resource.category[0].text };
      }
      break;

    case 'ServiceRequest':
      // For service requests, use the service code
      if (resource.code?.coding?.[0]) {
        return { valueCoding: resource.code.coding[0] };
      } else if (resource.code?.text) {
        return { valueString: resource.code.text };
      }
      break;

    case 'Specimen':
      // For specimens, use specimen type
      if (resource.type?.coding?.[0]) {
        return { valueCoding: resource.type.coding[0] };
      } else if (resource.type?.text) {
        return { valueString: resource.type.text };
      }
      break;
      
    // Could add more resource types as needed
    default:
      // For unknown types, try to find a display string
      if (resource.display) {
        return { valueString: resource.display };
      } else if (resource.name) {
        return { valueString: resource.name };
      }
  }
  
  return null; // Couldn't convert this resource
}