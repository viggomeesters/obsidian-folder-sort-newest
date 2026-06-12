export interface SortableFileItem {
  file?: {
    name?: string;
    path?: string;
  };
}

export type FolderPredicate<T extends SortableFileItem> = (item: T) => boolean;

export function sortFoldersDescending<T extends SortableFileItem>(items: readonly T[], isFolder: FolderPredicate<T>): T[] {
  const folders: T[] = [];
  const others: T[] = [];

  for (const item of items) {
    if (isFolder(item)) folders.push(item);
    else others.push(item);
  }

  folders.sort(compareItemsByNameDescending);
  return folders.concat(others);
}

export function isRootFolderOrderSupported(view: unknown): view is { getSortedFolderItems: unknown } {
  return typeof view === "object" && view !== null && typeof (view as { getSortedFolderItems?: unknown }).getSortedFolderItems === "function";
}

function compareItemsByNameDescending(left: SortableFileItem, right: SortableFileItem): number {
  return getItemName(right).localeCompare(getItemName(left), undefined, { sensitivity: "base", numeric: true });
}

function getItemName(item: SortableFileItem): string {
  return item.file?.name ?? "";
}
