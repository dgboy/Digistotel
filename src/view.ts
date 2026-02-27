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

        const topbar = container.createDiv({ cls: "topbar" });
        const counterLabel = topbar.createDiv({ cls: "tag-counter" });
        const refreshButton = topbar.createEl('button', { text: 'Обновить' });

        const viewport = container.createDiv({ cls: "tag-squares" });

        const updateContent = () => {
            const files = this.app.vault.getMarkdownFiles();
            // const tag = "#дело/структура/сцена";
            const folder = "сцены";
            let folderPath = folder && !folder.endsWith('/') ? folder + '/' : folder;

            const search = files.filter(file => {
                // const cache = this.app.metadataCache.getFileCache(file);
                // const tags = cache?.tags?.map(t => t.tag) || [];
                // return tags.includes(tag);
                return file.path.startsWith(folderPath);
            });

            counterLabel.setText(`Найдено записей: ${search.length}`);
            viewport.empty();

            search.forEach(file => {
                const cache = this.app.metadataCache.getFileCache(file);
                const frontmatter = cache?.frontmatter;

                let participants: string[] = [];
                if (frontmatter && frontmatter["Участники"]) {
                    const raw = frontmatter["Участники"];
                    if (Array.isArray(raw)) {
                        participants = raw;
                    } else if (typeof raw === "string") {
                        // Если строка, разбиваем по запятой (можно настроить)
                        participants = raw.split(',').map(s => s.trim()).filter(s => s);
                    }
                }

                const block = viewport.createDiv({ cls: "tag-square" });
                block.setText(file.basename);
                // block.setText(file.basename + " (" + participants.length + ")");

                if (participants.length > 0) {
                    const chipsContainer = block.createDiv({ cls: "chips-container" });

                    participants.forEach(p => {
                        const chip = chipsContainer.createSpan({ cls: "chip" });
                        chip.setText(this.extractAliasFromLink(p));
                    });
                }
                block.addEventListener("click", () => {
                    this.app.workspace.openLinkText(file.path, "", false);
                });
            });

            console.log("Обновление контента");
        };

        updateContent();
        refreshButton.addEventListener('click', updateContent);
    }

    extractAliasFromLink(linkText: string): string {
        // Формат: [[Заметка|Алиас]]
        const match = linkText.match(/\[\[[^|\]]+\|([^\]]+)\]\]/);
        return match ? match[1] || "" : linkText.replace(/\[\[|\]\]/g, '');
    }
}