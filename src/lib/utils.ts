import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if all search terms are present in any of the specified fields of the object.
 * @param obj The object to search (e.g., a lead)
 * @param searchTerms Array of search terms (already trimmed, lowercased)
 * @param fields Array of field names to check in the object
 * @returns true if ALL search terms are found in ANY of the fields
 */
export function matchesAllTermsInFields<T extends Record<string, any>>(
  obj: T,
  searchTerms: string[],
  fields: (keyof T)[]
): boolean {
  return searchTerms.every(term =>
    fields.some(field => {
      const value = obj[field];
      if (value !== undefined && value !== null && (typeof value === 'string' || typeof value === 'number')) {
        return String(value).toLowerCase().includes(term);
      }
      return false;
    })
  );
}
