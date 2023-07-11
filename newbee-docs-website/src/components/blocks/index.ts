import header from "./header.vue";
import paragraph from "./paragraph.vue";
import delimiter from "./delimiter.vue";
import table from "./table.vue";
import warning from "./warning.vue";
import list from "./list.vue";
import linkTool from "./linkTool.vue";
import embed from "./embed.vue";
import checklist from "./checklist.vue";
import image from "./image.vue";
import raw from "./raw.vue";
import code from "./code.vue";
import type { App } from "vue";

function install(app: App) {
    app.component("eb-header", header);
    app.component("eb-paragraph", paragraph);
    app.component("eb-delimiter", delimiter);
    app.component("eb-table", table);
    app.component("eb-warning", warning);
    app.component("eb-list", list);
    app.component("eb-linkTool", linkTool);
    app.component("eb-embed", embed);
    app.component("eb-checklist", checklist);
    app.component("eb-image", image);
    app.component("eb-raw", raw);
    app.component("eb-code", code);
}

export default {
    install,
};
