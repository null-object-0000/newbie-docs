import { type App } from "vue";
const modules = import.meta.glob("./*.vue");

function install(app: App) {
    const blocks = Object.keys(modules)
    Promise.all(blocks.map((item) => modules[item]())).then((res) => {
        res.forEach((module: any, index) => {
            const item = blocks[index];
            const name = item.replace(/(\.\/|\.vue)/g, '')

            // eb-header -> header.vue
            app.component('eb-' + name, module.default);
        });
    })
}

export default {
    install,
};
