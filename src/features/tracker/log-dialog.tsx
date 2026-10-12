"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { FormField, fieldProps } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSetCompletion } from "@/features/completions/hooks";
import type { HabitStateDTO } from "@/shared/api-types";

interface LogDialogProps {
  habit: HabitStateDTO;
  date: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Record a measurable quantity and/or a note for one habit on one day. */
export function LogDialog({ habit, date, open, onOpenChange }: LogDialogProps) {
  const measurable = habit.targetValue !== null;
  const mutation = useSetCompletion();
  const [value, setValue] = useState(habit.progressValue?.toString() ?? "");
  const [notes, setNotes] = useState(habit.notes ?? "");
  const [error, setError] = useState<string>();

  function save() {
    let progressValue: number | undefined;
    if (measurable && value.trim() !== "") {
      progressValue = Number(value);
      if (!Number.isFinite(progressValue) || progressValue < 0) {
        setError("Enter a number that is zero or more.");
        return;
      }
    }
    setError(undefined);
    mutation.mutate(
      {
        habitId: habit.id,
        date,
        notes: notes.trim() === "" ? null : notes.trim(),
        // Without a quantity, saving a note must not change whether the day counts as done.
        ...(progressValue !== undefined
          ? { progressValue }
          : { completed: habit.state === "done", ...(habit.progressValue !== null ? { progressValue: habit.progressValue } : {}) }),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  const remaining = measurable && habit.targetValue ? Math.max(0, habit.targetValue - (Number(value) || 0)) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{habit.name}</DialogTitle>
          <DialogDescription>
            {measurable
              ? `Goal for the day: ${habit.targetValue} ${habit.targetUnit ?? ""}. It counts as done once you reach it.`
              : "Add a note for this day. Notes don't change whether the habit is done."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {measurable ? (
            <FormField id="log-value" label={`Amount${habit.targetUnit ? ` (${habit.targetUnit})` : ""}`} error={error}
              hint={remaining !== null && remaining > 0 ? `${remaining} to go` : remaining === 0 ? "Target reached 🎉" : undefined}>
              <Input
                {...fieldProps("log-value", error, true)}
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                className="h-11 text-lg"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                autoFocus
              />
            </FormField>
          ) : null}
          <FormField id="log-notes" label="Notes (optional)">
            <Textarea
              id="log-notes"
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="How did it go?"
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
