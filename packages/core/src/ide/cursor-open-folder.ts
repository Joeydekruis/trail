export type ShellLaunchAttempt = {
  executable: string;
  args: string[];
};

/** Ordered strategies to open a folder in the Cursor editor. */
export function cursorOpenFolderAttempts(
  platform: NodeJS.Platform,
  folderPath: string,
): ShellLaunchAttempt[] {
  if (platform === "darwin") {
    return [
      { executable: "cursor", args: [folderPath] },
      { executable: "open", args: ["-a", "Cursor", folderPath] },
    ];
  }
  if (platform === "win32") {
    return [
      { executable: "cursor.cmd", args: [folderPath] },
      { executable: "cursor", args: [folderPath] },
    ];
  }
  return [{ executable: "cursor", args: [folderPath] }];
}