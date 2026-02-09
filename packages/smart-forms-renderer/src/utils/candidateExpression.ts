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

import {
  cacheTerminologyResult,
  handleFhirPathResult,
  isExpressionCached
} from './fhirpath';
import fhirpath from 'fhirpath';
import fhirpath_r4_model from 'fhirpath/fhir-context/r4';
import { client } from 'fhirclient';
import { smartConfigStore } from '../stores/smartConfigStore';
import type { CandidateExpressions, CandidateExpression } from '../interfaces/candidateExpression.interface';
import type { Bundle } from 'fhir/r4';

/**
 * Substitute variables in x-fhir-query expressions
 * Replaces {{%variableName}} or {{%variableName.property}} with actual values from context
 */
function substituteXFhirQueryVariables(
  queryString: string,
  fhirPathContext: Record<string, any>
): string {
  // Match patterns like {{%patient.id}} or {{%user.id}}
  const variablePattern = /\{\{%([\w.]+)\}\}/g;
  
  return queryString.replace(variablePattern, (match, variablePath) => {
    // Split the path into parts (e.g., "patient.id" -> ["patient", "id"])
    const parts = variablePath.split('.');
    let value: any = fhirPathContext;
    
    // Navigate through the path to get the value
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined || value === null) {
        console.warn(`Variable ${variablePath} not found in context for candidate expression`);
        return match; // Return original if not found
      }
    }
    
    return String(value);
  });
}

/**
 * Evaluates candidate expressions and updates their results
 * Follows the pattern from evaluateEnableWhenExpressions but simplified for candidate options
 */
export async function evaluateCandidateExpressions(
  fhirPathContext: Record<string, any>,
  fhirPathTerminologyCache: Record<string, any>,
  candidateExpressions: CandidateExpressions,
  terminologyServerUrl: string
): Promise<{
  isUpdated: boolean;
  updatedCandidateExpressions: CandidateExpressions;
  updatedFhirPathTerminologyCache: Record<string, any>;
}> {
  let isUpdated = false;
  const updatedCandidateExpressions: CandidateExpressions = { ...candidateExpressions };
  
  // Process each question's candidate expressions
  for (const linkId in candidateExpressions) {
    const candidateExpressionsForItem = candidateExpressions[linkId];
    
    if (!candidateExpressionsForItem || candidateExpressionsForItem.length === 0) {
      continue;
    }
    
    // Process each expression for this question
    for (const candidateExpression of candidateExpressionsForItem) {
      const { expression } = candidateExpression;
      
      if (!expression.expression) {
        continue;
      }
      
      // Check if we already evaluated this expression (performance optimization)
      if (isExpressionCached(expression.expression, fhirPathTerminologyCache)) {
        continue;
      }
      
      try {
        if (expression.language === 'application/x-fhir-query') {
          // Handle FHIR query expressions - use the configured FHIR client (not terminology server)
          const queryString = expression.expression;
          
          // Substitute variables like {{%patient.id}} with actual values
          const substitutedQuery = substituteXFhirQueryVariables(queryString, fhirPathContext);
          
          // Get the configured FHIR client which has the data server URL and auth
          const fhirClient = smartConfigStore.getState().client;
          
          if (!fhirClient) {
            console.warn('CandidateExpression: No FHIR client configured for x-fhir-query. Use initialiseFhirClient() or SMART App Launch.');
            candidateExpression.result = [];
            continue;
          }
          
          // Execute the FHIR query using the configured client
          const queryResult: Bundle = await fhirClient.request(substitutedQuery);
          
          // Extract resources from the Bundle
          const resources = queryResult.entry?.map(entry => entry.resource).filter(Boolean) ?? [];
          candidateExpression.result = resources;
          
          isUpdated = true;
          continue;
        }
        
        // Evaluate FHIRPath expressions as before
        const fhirPathResult = fhirpath.evaluate(
          {},
          {
            base: 'QuestionnaireResponse',
            expression: expression.expression
          },
          fhirPathContext,
          fhirpath_r4_model,
          {
            async: true,
            terminologyUrl: terminologyServerUrl
          }
        );
        
        // Process and store the results
        const result = await handleFhirPathResult(fhirPathResult);
        candidateExpression.result = Array.isArray(result) ? result : [result];
        
        // Cache the result to avoid re-evaluation
        if (fhirPathResult instanceof Promise) {
          cacheTerminologyResult(expression.expression, result, fhirPathTerminologyCache);
        }
        
        isUpdated = true;
        
      } catch (e) {
        // If expression fails, log error but don't crash
        console.warn(`CandidateExpression evaluation failed for ${expression.expression}:`, e);
        candidateExpression.result = [];
      }
    }
  }
  
  return {
    isUpdated,
    updatedCandidateExpressions,
    updatedFhirPathTerminologyCache: fhirPathTerminologyCache
  };
}