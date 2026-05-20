import { useEffect, useState } from "react";
import { useConfig, useUpdateConfig } from "@/api/hooks";
import { useToast } from "@/components/shared/Toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SYNC_PRESET_DESCRIPTIONS,
  SYNC_PRESET_LABELS,
} from "@/lib/constants";
import type { SyncPreset, TrailConfig } from "@/types/task";

function defaultAutoSyncForPreset(preset: SyncPreset): boolean {
  return preset === "collaborative";
}

function SettingsField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground/80">{hint}</p> : null}
    </div>
  );
}

function configEquals(a: TrailConfig, b: TrailConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function SettingsPage() {
  const { data: payload, isLoading, isError } = useConfig();
  const updateConfig = useUpdateConfig();
  const { toast } = useToast();

  const [draft, setDraft] = useState<TrailConfig | null>(null);

  useEffect(() => {
    if (payload?.config) {
      setDraft(payload.config);
    }
  }, [payload?.config]);

  const saved = payload?.config ?? null;
  const isDirty =
    draft !== null && saved !== null && !configEquals(draft, saved);

  function setSync<K extends keyof TrailConfig["sync"]>(
    key: K,
    value: TrailConfig["sync"][K],
  ) {
    setDraft((prev) =>
      prev ? { ...prev, sync: { ...prev.sync, [key]: value } } : prev,
    );
  }

  function handlePresetChange(preset: SyncPreset) {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            sync: {
              ...prev.sync,
              preset,
              auto_sync_on_command: defaultAutoSyncForPreset(preset),
            },
          }
        : prev,
    );
  }

  function handleSave() {
    if (!draft) return;
    updateConfig.mutate(
      { github: draft.github, sync: draft.sync },
      {
        onSuccess: () => {
          toast("success", "Settings saved to .trail/config.json");
        },
        onError: () => {
          toast("error", "Could not save settings");
        },
      },
    );
  }

  if (isLoading || !draft) {
    return (
      <p className="text-sm text-muted-foreground">Loading settings…</p>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-red-400/90">
        Could not load .trail/config.json.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Changes are written to{" "}
          <code className="rounded bg-accent px-1.5 py-0.5 font-mono text-xs">
            .trail/config.json
          </code>{" "}
          in this repository.
        </p>
      </div>

      <section className="space-y-4 rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">GitHub repository</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField label="Owner">
            <Input
              value={draft.github.owner}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        github: { ...prev.github, owner: e.target.value },
                      }
                    : prev,
                )
              }
              autoComplete="off"
            />
          </SettingsField>
          <SettingsField label="Repository">
            <Input
              value={draft.github.repo}
              onChange={(e) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        github: { ...prev.github, repo: e.target.value },
                      }
                    : prev,
                )
              }
              autoComplete="off"
            />
          </SettingsField>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Sync</h2>
        <SettingsField
          label="Preset"
          hint={SYNC_PRESET_DESCRIPTIONS[draft.sync.preset]}
        >
          <Select
            value={draft.sync.preset}
            onValueChange={(v) => handlePresetChange(v as SyncPreset)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SYNC_PRESET_LABELS) as SyncPreset[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {SYNC_PRESET_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsField>

        <div className="flex items-start gap-3">
          <Checkbox
            id="auto-sync"
            checked={draft.sync.auto_sync_on_command}
            onCheckedChange={(checked) =>
              setSync("auto_sync_on_command", checked === true)
            }
            className="mt-0.5"
          />
          <div className="space-y-0.5">
            <Label htmlFor="auto-sync" className="cursor-pointer text-sm text-foreground">
              Auto-sync on CLI commands
            </Label>
            <p className="text-xs text-muted-foreground">
              Pull from GitHub before trail commands that read tasks (when not
              offline).
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">UI</h2>
        <SettingsField
          label="Poll interval (seconds)"
          hint="How often the board refreshes task data from disk (minimum 5)."
        >
          <Input
            type="number"
            min={5}
            max={600}
            value={draft.sync.ui_poll_interval_seconds}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              if (!Number.isNaN(n)) {
                setSync("ui_poll_interval_seconds", Math.max(5, n));
              }
            }}
            className="max-w-[8rem]"
          />
        </SettingsField>

        <div className="flex items-start gap-3">
          <Checkbox
            id="idle-backoff"
            checked={draft.sync.ui_idle_backoff}
            onCheckedChange={(checked) =>
              setSync("ui_idle_backoff", checked === true)
            }
            className="mt-0.5"
          />
          <div className="space-y-0.5">
            <Label htmlFor="idle-backoff" className="cursor-pointer text-sm text-foreground">
              Idle backoff
            </Label>
            <p className="text-xs text-muted-foreground">
              Slow polling when the tab is in the background (future use).
            </p>
          </div>
        </div>

        {payload?.last_full_sync_at ? (
          <p className="text-xs text-muted-foreground">
            Last full sync:{" "}
            <time dateTime={payload.last_full_sync_at}>
              {new Date(payload.last_full_sync_at).toLocaleString()}
            </time>
          </p>
        ) : null}
      </section>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || updateConfig.isPending}
        >
          {updateConfig.isPending ? "Saving…" : "Save settings"}
        </Button>
        {isDirty ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => saved && setDraft(saved)}
          >
            Reset
          </Button>
        ) : null}
      </div>
    </div>
  );
}
