import { boardColumnFromProjectStatus, type BoardColumnId } from "@trail/core";

const GITHUB_API = "https://api.github.com/graphql";
const TRAIL_USER_AGENT = "Trail-Desktop";

type GraphqlIssueRow = {
  number: number;
  state: string;
  projectItems: {
    nodes: Array<{
      fieldValues: {
        nodes: Array<{
          name?: string;
          field?: { name?: string };
        }>;
      };
    }>;
  };
};

type GraphqlResponse = {
  data?: {
    repository?: {
      issues?: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: GraphqlIssueRow[];
      };
    };
  };
  errors?: Array<{ message: string }>;
};

const ISSUES_QUERY = `
  query ($owner: String!, $repo: String!, $cursor: String) {
    repository(owner: $owner, name: $repo) {
      issues(first: 100, after: $cursor, states: [OPEN, CLOSED]) {
        pageInfo { hasNextPage endCursor }
        nodes {
          number
          state
          projectItems(first: 5) {
            nodes {
              fieldValues(first: 20) {
                nodes {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                    field {
                      ... on ProjectV2SingleSelectField { name }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

function readStatusFromIssue(issue: GraphqlIssueRow, statusFieldName: string): string | null {
  const want = statusFieldName.trim().toLowerCase();
  for (const item of issue.projectItems.nodes) {
    for (const field of item.fieldValues.nodes) {
      if (field.field?.name?.toLowerCase() === want && field.name) {
        return field.name;
      }
    }
  }
  return null;
}

export async function fetchIssueBoardColumns(
  token: string,
  owner: string,
  repo: string,
  statusFieldName: string,
): Promise<{ ok: true; byIssue: Map<number, BoardColumnId> } | { ok: false; message: string }> {
  const byIssue = new Map<number, BoardColumnId>();
  let cursor: string | null = null;

  for (let page = 0; page < 20; page += 1) {
    const response = await fetch(GITHUB_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": TRAIL_USER_AGENT,
      },
      body: JSON.stringify({
        query: ISSUES_QUERY,
        variables: { owner, repo, cursor },
      }),
    });

    if (!response.ok) {
      return { ok: false, message: `GitHub GraphQL error (${response.status})` };
    }

    const body = (await response.json()) as GraphqlResponse;
    if (body.errors?.length) {
      return { ok: false, message: body.errors[0].message };
    }

    const connection = body.data?.repository?.issues;
    if (!connection) {
      break;
    }

    for (const issue of connection.nodes) {
      if (issue.state === "CLOSED") {
        byIssue.set(issue.number, "done");
        continue;
      }
      const status = readStatusFromIssue(issue, statusFieldName);
      const column = status ? boardColumnFromProjectStatus(status) : null;
      if (column) {
        byIssue.set(issue.number, column);
      }
    }

    if (!connection.pageInfo.hasNextPage) {
      break;
    }
    cursor = connection.pageInfo.endCursor;
  }

  return { ok: true, byIssue };
}