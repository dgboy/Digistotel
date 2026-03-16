import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
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
                return file.path.contains(folderPath);
            });

            counterLabel.setText(`Найдено записей: ${search.length}`);
            // counterLabel.setText(`Найдено записей (${folderPath}): ${search.length}`);
            viewport.empty();

            search.forEach(file => {
                const cache = this.app.metadataCache.getFileCache(file);
                const frontmatter = cache?.frontmatter;

                let actors: string[] = [];
                if (frontmatter && frontmatter["Персонажи"]) {
                    const raw = frontmatter["Персонажи"];
                    if (Array.isArray(raw)) {
                        actors = raw;
                    } else if (typeof raw === "string") {
                        // Если строка, разбиваем по запятой (можно настроить)
                        actors = raw.split(',').map(s => s.trim()).filter(s => s);
                    }
                }

                const block = viewport.createDiv({ cls: "tag-square" });
                block.setText(file.basename);
                // block.setText(file.basename + " (" + participants.length + ")");

                if (actors.length > 0) {
                    const chipsContainer = block.createDiv({ cls: "chips-container" });

                    actors.forEach(p => {
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

    topologicalSort(events: Array<TFile>) {
        // Карта для быстрого доступа к событию по id
        const eventMap = new Map();
        events.forEach(e => eventMap.set(e.name, e));

        // Список смежности: для каждого id храним массив id следствий
        const adjacency = new Map();
        // Входящие степени (сколько причин ведут к событию)
        const inDegree = new Map();

        // Инициализация
        events.forEach(e => {
            const cache = this.app.metadataCache.getFileCache(e);
            const frontmatter = cache?.frontmatter;

            let actors: string[] = [];
            if (frontmatter && frontmatter["Персонажи"]) {
                const raw = frontmatter["Персонажи"];
                if (Array.isArray(raw)) {
                    actors = raw;
                } else if (typeof raw === "string") {
                    // Если строка, разбиваем по запятой (можно настроить)
                    actors = raw.split(',').map(s => s.trim()).filter(s => s);
                }
            }

            adjacency.set(e.name, []);
            inDegree.set(e.name2, 0);
        });

        // Заполнение графа
        events.forEach(e => {
            if (e.causeIds && Array.isArray(e.causeIds)) {
                e.causeIds.forEach(causeId => {
                    // Проверяем, что причина существует
                    if (!eventMap.has(causeId)) {
                        throw new Error(`Причина с id "${causeId}" не найдена`);
                    }
                    // Добавляем ребро causeId → e.id
                    adjacency.get(causeId).push(e.id);
                    // Увеличиваем входящую степень e.id
                    inDegree.set(e.id, inDegree.get(e.id) + 1);
                });
            }
        });

        // Очередь для событий, у которых нет необработанных причин (входящая степень = 0)
        const queue = [];
        events.forEach(e => {
            if (inDegree.get(e.id) === 0) {
                queue.push(e.id);
            }
        });

        const result = [];
        let queueIndex = 0; // указатель для эффективного извлечения из очереди

        while (queueIndex < queue.length) {
            const currentId = queue[queueIndex++];
            result.push(eventMap.get(currentId)); // добавляем событие в результат

            // Все следствия текущего события
            const children = adjacency.get(currentId) || [];
            children.forEach(childId => {
                // Уменьшаем счётчик входящей степени следствия
                inDegree.set(childId, inDegree.get(childId) - 1);
                // Если все причины следствия обработаны, добавляем его в очередь
                if (inDegree.get(childId) === 0) {
                    queue.push(childId);
                }
            });
        }

        // Если не все события попали в результат, значит есть цикл
        if (result.length !== events.length) {
            throw new Error('Обнаружен цикл в причинно-следственных связях');
        }

        return result;
    }
}