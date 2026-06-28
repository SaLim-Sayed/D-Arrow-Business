import type { Account, AccountType } from "../schemas/account";

export interface AccountTreeNode {
  account: Account;
  depth: number;
  children: AccountTreeNode[];
}

/** Infer hierarchy level from numeric account code (Odoo-style 4-digit COA). */
export function getCodeTreeDepth(code: string): number {
  const digits = code.replace(/\D/g, "");
  if (!digits) return 0;
  const trailingZeros = digits.match(/0+$/)?.[0]?.length ?? 0;
  return Math.max(0, digits.length - trailingZeros - 1);
}

export function compareAccountCode(a: Account, b: Account): number {
  const na = Number.parseInt(a.code, 10);
  const nb = Number.parseInt(b.code, 10);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
  return a.code.localeCompare(b.code);
}

export function buildAccountForest(accounts: Account[]): AccountTreeNode[] {
  const sorted = [...accounts].sort(compareAccountCode);
  const byId = new Map(sorted.filter((a) => a.id).map((a) => [a.id!, a]));
  const roots: AccountTreeNode[] = [];
  const nodeById = new Map<string, AccountTreeNode>();

  for (const account of sorted) {
    const node: AccountTreeNode = { account, depth: 0, children: [] };
    if (account.id) nodeById.set(account.id, node);

    const parent =
      account.parentId && byId.has(account.parentId)
        ? nodeById.get(account.parentId)
        : undefined;

    if (parent) {
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      node.depth = getCodeTreeDepth(account.code);
      roots.push(node);
    }
  }

  return roots;
}

export interface FlatAccountRow {
  account: Account;
  depth: number;
  hasChildren: boolean;
  branchKey: string;
}

function flattenNodes(
  nodes: AccountTreeNode[],
  collapsedBranches: Set<string>,
  parentKey = ""
): FlatAccountRow[] {
  const rows: FlatAccountRow[] = [];

  for (const node of nodes) {
    const branchKey = `${parentKey}/${node.account.id ?? node.account.code}`;
    const hasChildren = node.children.length > 0;
    rows.push({
      account: node.account,
      depth: node.depth,
      hasChildren,
      branchKey,
    });

    if (hasChildren && !collapsedBranches.has(branchKey)) {
      rows.push(...flattenNodes(node.children, collapsedBranches, branchKey));
    }
  }

  return rows;
}

/** Flat list for tree view grouped by account type. */
export function flattenAccountsForTreeView(
  accounts: Account[],
  typeOrder: AccountType[],
  collapsedTypes: Set<AccountType>,
  collapsedBranches: Set<string>
): Array<
  | { kind: "type-header"; type: AccountType; count: number; total: number }
  | { kind: "row"; row: FlatAccountRow }
> {
  const result: Array<
    | { kind: "type-header"; type: AccountType; count: number; total: number }
    | { kind: "row"; row: FlatAccountRow }
  > = [];

  for (const type of typeOrder) {
    const typeAccounts = accounts.filter((a) => a.type === type);
    if (typeAccounts.length === 0) continue;

    const total = typeAccounts.reduce((s, a) => s + (a.currentBalance ?? 0), 0);
    result.push({
      kind: "type-header",
      type,
      count: typeAccounts.length,
      total,
    });

    if (collapsedTypes.has(type)) continue;

    const forest = buildAccountForest(typeAccounts);
    const flat = flattenNodes(forest, collapsedBranches, type);
    for (const row of flat) {
      result.push({ kind: "row", row });
    }
  }

  return result;
}

export function escapeCsvCell(value: string | number): string {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadAccountsCsv(
  accounts: Account[],
  headers: string[],
  rowBuilder: (account: Account) => (string | number)[]
) {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...accounts.map((a) => rowBuilder(a).map(escapeCsvCell).join(",")),
  ];
  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `chart_of_accounts_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
