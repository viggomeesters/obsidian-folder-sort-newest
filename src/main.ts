import { App, Plugin, TFolder } from "obsidian";

type FileExplorerItem = {
  file?: {
    name?: string;
    path?: string;
  };
};

type FileExplorerView = {
  app: App;
  requestSort?: () => void;
  getSortedFolderItems: (folder: TFolder) => FileExplorerItem[];
};

type FileExplorerLeaf = {
  view?: FileExplorerView;
};

const FILE_EXPLORER_VIEW_TYPE = "file-explorer";
const PATCH_MARK = Symbol.for("folder-sort-newest.patch");

type PatchedPrototype = {
  [PATCH_MARK]?: {
    originalGetSortedFolderItems: FileExplorerView["getSortedFolderItems"];
  };
  getSortedFolderItems: FileExplorerView["getSortedFolderItems"];
};

export default class FolderSortNewestPlugin extends Plugin {
  private patchedPrototype: PatchedPrototype | null = null;

  async onload(): Promise<void> {
    this.applyPatchAndSort();
    this.app.workspace.onLayoutReady(() => {
      this.applyPatchAndSort();
    });
  }

  onunload(): void {
    this.restoreFileExplorer();
    this.requestFileExplorerSort();
  }

  private applyPatchAndSort(): void {
    this.patchFileExplorer();
    this.requestFileExplorerSort();
  }

  private patchFileExplorer(): void {
    const view = this.getFileExplorerView();
    if (!view) {
      console.warn("Folder Sort Newest: native File Explorer view was not found; patch not applied.");
      return;
    }

    const prototype = Object.getPrototypeOf(view) as PatchedPrototype;
    if (prototype[PATCH_MARK]) {
      this.patchedPrototype = prototype;
      return;
    }

    const originalGetSortedFolderItems = prototype.getSortedFolderItems;
    if (typeof originalGetSortedFolderItems !== "function") {
      console.warn("Folder Sort Newest: File Explorer internals changed; getSortedFolderItems is unavailable.");
      return;
    }

    prototype[PATCH_MARK] = { originalGetSortedFolderItems };
    prototype.getSortedFolderItems = function patchedGetSortedFolderItems(folder: TFolder): FileExplorerItem[] {
      const items = originalGetSortedFolderItems.call(this, folder);
      const folders: FileExplorerItem[] = [];
      const others: FileExplorerItem[] = [];

      for (const item of items) {
        if (isFolderItem(this as FileExplorerView, item)) {
          folders.push(item);
        } else {
          others.push(item);
        }
      }

      folders.sort(compareFolderItemsDescending);
      return [...folders, ...others];
    };

    this.patchedPrototype = prototype;
  }

  private restoreFileExplorer(): void {
    if (!this.patchedPrototype?.[PATCH_MARK]) return;

    this.patchedPrototype.getSortedFolderItems = this.patchedPrototype[PATCH_MARK].originalGetSortedFolderItems;
    delete this.patchedPrototype[PATCH_MARK];
    this.patchedPrototype = null;
  }

  private getFileExplorerView(): FileExplorerView | null {
    const leaf = this.app.workspace.getLeavesOfType(FILE_EXPLORER_VIEW_TYPE)[0] as unknown as FileExplorerLeaf | undefined;
    return leaf?.view ?? null;
  }

  private requestFileExplorerSort(): void {
    const view = this.getFileExplorerView();
    if (typeof view?.requestSort === "function") {
      view.requestSort();
    }
  }
}

function isFolderItem(view: FileExplorerView, item: FileExplorerItem): boolean {
  if (!item.file?.path) return false;
  return view.app.vault.getAbstractFileByPath(item.file.path) instanceof TFolder;
}

function compareFolderItemsDescending(left: FileExplorerItem, right: FileExplorerItem): number {
  const leftName = left.file?.name ?? "";
  const rightName = right.file?.name ?? "";
  return rightName.localeCompare(leftName, undefined, { sensitivity: "base", numeric: true });
}
