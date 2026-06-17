import type {
  RubricEventForm,
  RubricFormQuestion,
  RubricAnswers,
} from "@/types/rubric";

// A conditionally-hidden question becomes visible when one of its dependencies'
// parent option is currently selected on the parent question.
export function isQuestionVisible(
  question: RubricFormQuestion,
  answers: RubricAnswers
): boolean {
  if (!question.is_initially_hidden) return true;
  const deps = question.conditionalLogicDependencies ?? [];
  if (deps.length === 0) return true;

  const matches = deps.some((dep) => {
    const parentAnswer = answers[String(dep.parentQuestionId)];
    return parentAnswer?.selectedOptionIds.includes(dep.parentOptionId) ?? false;
  });

  // "any" => show if any dependency matches. Treat unknown operators as "any".
  return matches;
}

// Returns an error string for the first unanswered mandatory + visible question, else null.
export function validateAnswers(
  form: RubricEventForm,
  answers: RubricAnswers
): string | null {
  for (const q of form.questions) {
    if (q.questionType === "statement") continue;
    if (!q.mandatory) continue;
    if (!isQuestionVisible(q, answers)) continue;

    const a = answers[q.questionId];
    const answered =
      q.questionType === "number" || q.questionType === "text"
        ? !!a?.value?.trim()
        : (a?.selectedOptionIds.length ?? 0) > 0;

    if (!answered) return `Please answer: "${q.title}"`;
  }
  return null;
}

// Builds the questions array with `responses` filled in, matching the exact shape
// the Rubric portal sends. Hidden questions are sent with empty responses.
export function buildQuestionsPayload(
  form: RubricEventForm,
  answers: RubricAnswers
): RubricFormQuestion[] {
  return form.questions.map((q) => {
    if (q.questionType === "statement") {
      return { ...q, responses: [] };
    }

    const a = answers[q.questionId];
    const visible = isQuestionVisible(q, answers);

    if (!visible || !a) {
      return { ...q, responses: [] };
    }

    if (q.questionType === "number" || q.questionType === "text") {
      const optionId = q.options[0]?.optionId;
      return {
        ...q,
        responses: a.value?.trim()
          ? [{ optionId: optionId ?? 0, value: a.value }]
          : [],
      };
    }

    // choice-based: map each selected optionId to its description
    const responses = a.selectedOptionIds.map((oid) => {
      const opt = q.options.find((o) => o.optionId === oid);
      return { optionId: String(oid), value: opt?.description ?? "" };
    });
    return { ...q, responses };
  });
}
