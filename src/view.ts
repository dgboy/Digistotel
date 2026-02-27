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
        // Очистим контейнер
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();
        container.addClass("tag-view-container");

        // Здесь получим заметки по тегу
        const files = this.app.vault.getMarkdownFiles();
        const tag = "#дело/структура/сцена"; // можно взять из настроек плагина или фиксированный
        const filtered = files.filter(file => {
            const cache = this.app.metadataCache.getFileCache(file);
            const tags = cache?.tags?.map(t => t.tag) || [];
            return tags.includes(tag);
        });
        
        const counterEl = container.createDiv({ cls: "tag-counter" });
        counterEl.setText(`Найдено записей: ${filtered.length}`);

        // Отображаем квадраты
        filtered.forEach(file => {
            const square = container.createDiv({ cls: "tag-square" });
            square.setText(file.basename);
            square.addEventListener("click", () => {
                // Открыть заметку при клике
                this.app.workspace.openLinkText(file.path, "", false);
            });
        });
    }
}