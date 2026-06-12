import { App, Notice, Plugin, TFolder } from "obsidian";
import { isRootFolderOrderSupported, sortFoldersDescending, type SortableFileItem } from "./sort";

type FileExplorerItem = SortableFileItem;

type FileExplorerView = {
  app: App;
  requestSort?: () => void;
  getSortedFolderItems: (folder: TFolder) => FileExplorerItem[];
};

type FileExplorerLeaf = {
  view?: FileExplorerView;
};

const FILE_EXPLORER_VIEW_TYPE = "file-explorer";
const PATCH_MARK = Symbol.for("folder-sort-z-to-a.patch");

type PatchState = {
  originalGetSortedFolderItems: FileExplorerView["getSortedFolderItems"];
};

type PatchedPrototype = {
  [PATCH_MARK]?: PatchState;
  getSortedFolderItems: FileExplorerView["getSortedFolderItems"];
};

export default class FolderSortNewestPlugin extends Plugin {
  private patchedPrototype: PatchedPrototype | null = null;
  private warningShown = false;

  async onload(): Promise<void> {
    this.applyPatchAndSort();
    this.registerEvent(this.app.workspace.on("layout-change", () => this.applyPatchAndSort()));
    this.app.workspace.onLayoutReady(() => this.applyPatchAndSort());
  }

  onunload(): void {
    this.restoreFileExplorer();
    this.requestFileExplorerSort();
  }

  private applyPatchAndSort(): void {
    if (this.patchFileExplorer()) {
      this.requestFileExplorerSort();
    }
  }

  private patchFileExplorer(): boolean {
    const view = this.getFileExplorerView();
    if (!view) return false;

    const prototype = Object.getPrototypeOf(view) as PatchedPrototype;
    if (prototype[PATCH_MARK]) {
      this.patchedPrototype = prototype;
      return true;
    }

    if (!isRootFolderOrderSupported(prototype)) {
      this.warnUnsupportedInternals();
      return false;
    }

    const originalGetSortedFolderItems = prototype.getSortedFolderItems;
    prototype[PATCH_MARK] = { originalGetSortedFolderItems };
    prototype.getSortedFolderItems = function patchedGetSortedFolderItems(folder: TFolder): FileExplorerItem[] {
      const items = originalGetSortedFolderItems.call(this, folder);
      return sortFoldersDescending(items, (item) => isFolderItem(this as FileExplorerView, item));
    };

    this.patchedPrototype = prototype;
    return true;
  }

  private restoreFileExplorer(): void {
    const state = this.patchedPrototype?.[PATCH_MARK];
    if (!state || !this.patchedPrototype) return;

    this.patchedPrototype.getSortedFolderItems = state.originalGetSortedFolderItems;
    delete this.patchedPrototype[PATCH_MARK];
    this.patchedPrototype = null;
  }

  private getFileExplorerView(): FileExplorerView | null {
    const leaf = this.app.workspace.getLeavesOfType(FILE_EXPLORER_VIEW_TYPE)[0] as unknown as FileExplorerLeaf | undefined;
    return leaf?.view ?? null;
  }

  private requestFileExplorerSort(): void {
    const view = this.getFileExplorerView();
    if (typeof view?.requestSort === "function") view.requestSort();
  }

  private warnUnsupportedInternals(): void {
    if (this.warningShown) return;
    this.warningShown = true;
    console.warn("Folder Sort Z to A: File Explorer internals are not supported in this Obsidian version.");
    new Notice("Folder Sort Z to A cannot patch this Obsidian File Explorer version.");
  }
}

function isFolderItem(view: FileExplorerView, item: FileExplorerItem): boolean {
  if (!item.file?.path) return false;
  return view.app.vault.getAbstractFileByPath(item.file.path) instanceof TFolder;
}
