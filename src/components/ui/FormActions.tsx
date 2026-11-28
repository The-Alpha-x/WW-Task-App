import { Button } from "./Button";

export interface FormActionsProps {
  /** True while a save is running: disables both buttons and shows a spinner on submit. */
  saving?: boolean;
  submitLabel: string;
  savingLabel: string;
  /** When provided a secondary Cancel action is shown beside the submit button. */
  onCancel?: () => void;
  cancelLabel?: string;
}

/**
 * Action row shared by every create / edit form: Volt Lime primary on the
 * right, quiet outlined secondary on the left. Full width on mobile (primary on
 * top, thumb-reachable), right-aligned from `md`. Without `onCancel` the
 * primary action spans the full width.
 */
export function FormActions({
  saving = false,
  submitLabel,
  savingLabel,
  onCancel,
  cancelLabel = "Cancel",
}: FormActionsProps) {
  if (!onCancel) {
    return (
      <div className="pt-2">
        <Button type="submit" size="lg" className="w-full" loading={saving}>
          {saving ? savingLabel : submitLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full md:w-auto md:min-w-40"
        onClick={onCancel}
        disabled={saving}
      >
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        size="lg"
        className="w-full md:w-auto md:min-w-56"
        loading={saving}
      >
        {saving ? savingLabel : submitLabel}
      </Button>
    </div>
  );
}
