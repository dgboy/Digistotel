import { ItemView, WorkspaceLeaf } from "obsidian";
export { TagView, VIEW_TYPE_TAG_VIEW }

const VIEW_TYPE_TAG_VIEW = "tag-view";

class TagView extends ItemView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType(): string {
        return VIEW_TYPE_TAG_VIEW;
    }

    getDisplayText(): string {
        return "Сюжет";
    }

    async onOpen() {
        // Здесь будем рендерить содержимое
        this.render();
    }

    async render() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();
        container.addClass("tag-view-container");

        const refreshButton = container.createEl('button', { text: 'Обновить' });
        const counterEl = container.createDiv({ cls: "tag-counter" });
        const squaresContainer = container.createDiv({ cls: "tag-squares" });

        const updateContent = () => {
            const files = this.app.vault.getMarkdownFiles();
            const tag = "#дело/структура/сцена";
            
            const search = files.filter(file => {
                const cache = this.app.metadataCache.getFileCache(file);
                const tags = cache?.tags?.map(t => t.tag) || [];
                return tags.includes(tag);
            });

            counterEl.setText(`Найдено записей: ${search.length}`);
            squaresContainer.empty();

            search.forEach(file => {
                const square = squaresContainer.createDiv({ cls: "tag-square" });
                square.setText(file.basename);
                square.addEventListener("click", () => {
                    this.app.workspace.openLinkText(file.path, "", false);
                });
            });
            
            console.log("Обновление контента");
        };

        updateContent();
        refreshButton.addEventListener('click', updateContent);
    }
}