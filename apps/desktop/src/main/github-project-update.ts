import {
  projectStatusOptionIdForColumn,
  type BoardColumnId,
} from "@trail/core";

const GITHUB_API = "https://api.github.com/graphql";
const TRAIL_USER_AGENT = "Trail-Desktop";

type GraphqlEnvelope<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type ProjectItemRef = {
  itemId: string;
  projectId: string;
};

type IssueProjectItemsResponse = GraphqlEnvelope<{
  repository?: {
    issue?: {
      projectItems?: {
        nodes: Array<{ id: string; project: { id: string } | null }>;
      };
    };
  };
}>;

type ProjectStatusFieldResponse = GraphqlEnvelope<{
  node?: {
    fields?: {
      nodes: Array<{
        id: string;
        name?: string;
        options?: Array<{ id: string; name: string }>;
      }>;
    };
  };
}>;

const ISSUE_PROJECT_ITEMS_QUERY = `
  query ($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) {
        projectItems(first: 20) {
          nodes {
            id
            project { id }
          }
        }
      }
    }
  }
`;

const PROJECT_STATUS_FIELD_QUERY = `
  query ($projectId: ID!) {
    node(id: $projectId) {
      ... on ProjectV2 {
        fields(first: 30) {
          nodes {
            ... on ProjectV2SingleSelectField {
              id
              name
              options { id name }
            }
          }
        }
      }
    }
  }
`;

const UPDATE_STATUS_MUTATION = `
  mutation ($input: UpdateProjectV2ItemFieldValueInput!) {
    updateProjectV2ItemFieldValue(input: $input) {
      projectV2Item { id }
    }
  }
`;

async function githubGraphql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  const response = await fetch(GITHUB_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": TRAIL_USER_AGENT,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    return { ok: false, message: `GitHub GraphQL error (${response.status})` };
  }

  const body = (await response.json()) as GraphqlEnvelope<T>;
  if (body.errors?.length) {
    return { ok: false, message: body.errors[0].message };
  }
  if (!body.data) {
    return { ok: false, message: "GitHub GraphQL returned no data" };
  }
  return { ok: true, data: body.data };
}

async function loadProjectItem(
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<{ ok: true; item: ProjectItemRef } | { ok: false; message: string }> {
  const result = await githubGraphql<IssueProjectItemsResponse["data"]>(
    token,
    ISSUE_PROJECT_ITEMS_QUERY,
    { owner, repo, number: issueNumber },
  );
  if (!result.ok) {
    return result;
  }

  const nodes = result.data?.repository?.issue?.projectItems?.nodes ?? [];
  for (const node of nodes) {
    if (node.project?.id) {
      return {
        ok: true,
        item: { itemId: node.id, projectId: node.project.id },
      };
    }
  }
  return { ok: false, message: "Issue is not on a GitHub Project" };
}

export async function updateIssueProjectStatus(
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
  targetColumn: BoardColumnId,
  statusFieldName: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const itemResult = await loadProjectItem(token, owner, repo, issueNumber);
  if (!itemResult.ok) {
    return itemResult;
  }
  const { itemId, projectId } = itemResult.item;

  const fieldResult = await githubGraphql<ProjectStatusFieldResponse["data"]>(
    token,
    PROJECT_STATUS_FIELD_QUERY,
    { projectId },
  );
  if (!fieldResult.ok) {
    return fieldResult;
  }

  const fields = fieldResult.data?.node?.fields?.nodes ?? [];
  const wantField = statusFieldName.trim().toLowerCase();
  const statusField = fields.find((field) => field.name?.trim().toLowerCase() === wantField);
  if (!statusField?.id || !statusField.options?.length) {
    return { ok: false, message: `Project has no "${statusFieldName}" field` };
  }

  const optionId = projectStatusOptionIdForColumn(targetColumn, statusField.options);
  if (!optionId) {
    return {
      ok: false,
      message: `No Status option matches column "${targetColumn}"`,
    };
  }

  const mutation = await githubGraphql<{ updateProjectV2ItemFieldValue: { projectV2Item: { id: string } } }>(
    token,
    UPDATE_STATUS_MUTATION,
    {
      input: {
        projectId,
        itemId,
        fieldId: statusField.id,
        value: { singleSelectOptionId: optionId },
      },
    },
  );
  if (!mutation.ok) {
    return mutation;
  }
  return { ok: true };
}