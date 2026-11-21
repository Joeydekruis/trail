export function agentStreamRunKey(workspaceId: string, issueNumber: number): string {
  return `${workspaceId}:${issueNumber}`;
}