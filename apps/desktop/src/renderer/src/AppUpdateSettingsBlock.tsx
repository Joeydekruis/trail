import { useCallback, useEffect, useState } from "react";
import type { AppUpdateStateDto } from "@trail/ipc";
import { TrailButton } from "./design/TrailUi";
import { appUpdateStatusLine, canInstallAppUpdate } from "./app-update-status-line";

export function AppUpdateSettingsBlock() {
  const [state, setState] = useState<AppUpdateStateDto | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);

  const refresh = useCallback(async () => {
    const data = await window.trail?.getAppUpdate?.();
    if (data) {
      setState(data);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const api = window.trail;
    if (!api?.onAppUpdateState) {
      return;
    }
    return api.onAppUpdateState((payload) => {
      setState(payload);
    });
  }, [refresh]);

  if (!state) {
    return null;
  }

  const installUpdate = async () => {
    const api = window.trail;
    if (!api?.installAppUpdate) {
      return;
    }
    setInstallError(null);
    setInstalling(true);
    try {
      const result = await api.installAppUpdate();
      if (!result.ok) {
        setInstallError(result.message);
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div
      style={{
        paddingTop: 16,
        borderTop: "1px solid var(--line)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Application updates</h3>
        <p className="tr-small" style={{ margin: "6px 0 0" }}>
          Packaged builds download updates from GitHub Releases.
        </p>
      </div>
      <p className="tr-small" style={{ margin: 0 }}>
        {appUpdateStatusLine(state)}
      </p>
      {canInstallAppUpdate(state) ? (
        <TrailButton variant="primary" disabled={installing} onClick={() => void installUpdate()}>
          {installing ? "Restarting…" : "Install update and restart"}
        </TrailButton>
      ) : null}
      {installError ? (
        <span className="tr-small" style={{ color: "var(--warning)" }}>
          {installError}
        </span>
      ) : null}
    </div>
  );
}