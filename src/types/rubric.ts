// Types for Rubric's dynamic event-creation affiliation form (Arc clubs/sport).
// Derived from the live submitFormResponse payload captured from the portal.

export type RubricQuestionType =
  | "multichoice"   // single select (radio)
  | "multiselect"   // multi select
  | "multicheck"    // checkboxes ("select all that apply")
  | "number"        // numeric input
  | "text"          // free text
  | "statement";    // display-only, no response

export interface RubricFormOption {
  optionId: number;
  description?: string;
  hidden: boolean;
  quizAnswer: boolean;
}

export interface RubricConditionalDependency {
  parentOptionId: number;
  conditionId: number;
  parentQuestionId: number;
}

export interface RubricFormResponse {
  optionId: string | number;
  value: string;
}

export interface RubricFormQuestion {
  questionId: string;
  title: string;
  description: string;
  mandatory: boolean;
  sortIndex: number;
  questionType: RubricQuestionType;
  options: RubricFormOption[];
  conditionalLogicOperator: "always_show" | "any" | string;
  conditionalLogicDependencies?: RubricConditionalDependency[];
  is_initially_hidden: boolean;
  responses?: RubricFormResponse[];
  // Passed through untouched so we round-trip the exact server shape
  allowPastDates?: boolean;
  shuffleOptions?: boolean;
  collectStudentId?: boolean;
  officeUseOnly?: boolean;
  invitees?: unknown[];
  delete_restricted?: boolean;
  voterGroups?: unknown[];
}

export interface RubricEventForm {
  form_id: number;
  questions: RubricFormQuestion[];
}

// Local answer state keyed by questionId.
// For single-select/number/text -> one selected optionId (number questions use the
// question's sole optionId) and a value string. For multi -> a set of optionIds.
export interface RubricAnswer {
  selectedOptionIds: number[];
  value?: string; // for number/text questions
}

export type RubricAnswers = Record<string, RubricAnswer>;
