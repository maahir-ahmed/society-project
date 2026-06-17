"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { RubricEventForm, RubricFormQuestion, RubricAnswers } from "@/types/rubric";
import { isQuestionVisible } from "@/lib/rubricForm";

interface Props {
  form: RubricEventForm;
  answers: RubricAnswers;
  onChange: (answers: RubricAnswers) => void;
}

export function RubricFormQuestions({ form, answers, onChange }: Props) {
  function setSingle(q: RubricFormQuestion, optionId: number) {
    onChange({ ...answers, [q.questionId]: { selectedOptionIds: [optionId] } });
  }

  function toggleMulti(q: RubricFormQuestion, optionId: number) {
    const current = answers[q.questionId]?.selectedOptionIds ?? [];
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
    onChange({ ...answers, [q.questionId]: { selectedOptionIds: next } });
  }

  function setValue(q: RubricFormQuestion, value: string) {
    const optionId = q.options[0]?.optionId;
    onChange({
      ...answers,
      [q.questionId]: { selectedOptionIds: optionId != null ? [optionId] : [], value },
    });
  }

  const visibleQuestions = [...form.questions]
    .sort((a, b) => a.sortIndex - b.sortIndex)
    .filter((q) => isQuestionVisible(q, answers));

  return (
    <div className="space-y-4">
      {visibleQuestions.map((q) => {
        const answer = answers[q.questionId];
        const selected = answer?.selectedOptionIds ?? [];

        if (q.questionType === "statement") {
          return (
            <div key={q.questionId} className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-900">
              {q.title}
            </div>
          );
        }

        return (
          <div key={q.questionId} className="space-y-2">
            <Label className="text-sm font-medium">
              {q.title}
              {q.mandatory && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            {q.description?.trim() && (
              <p className="text-xs text-muted-foreground -mt-1">{q.description.trim()}</p>
            )}

            {q.questionType === "number" && (
              <Input
                type="number"
                value={answer?.value ?? ""}
                onChange={(e) => setValue(q, e.target.value)}
                placeholder="Enter a number"
              />
            )}

            {q.questionType === "text" && (
              <Input
                value={answer?.value ?? ""}
                onChange={(e) => setValue(q, e.target.value)}
                placeholder="Your answer"
              />
            )}

            {q.questionType === "multichoice" && (
              <div className="space-y-1.5">
                {q.options.filter((o) => !o.hidden).map((o) => (
                  <label key={o.optionId} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name={q.questionId}
                      checked={selected.includes(o.optionId)}
                      onChange={() => setSingle(q, o.optionId)}
                      className="h-4 w-4"
                    />
                    {o.description}
                  </label>
                ))}
              </div>
            )}

            {(q.questionType === "multiselect" || q.questionType === "multicheck") && (
              <div className="space-y-1.5">
                {q.options.filter((o) => !o.hidden).map((o) => (
                  <label key={o.optionId} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.includes(o.optionId)}
                      onChange={() => toggleMulti(q, o.optionId)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    {o.description}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
