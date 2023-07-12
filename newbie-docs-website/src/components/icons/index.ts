import type { App } from "vue";
const modules = import.meta.glob("./*.vue");

function install(app: App) {
  const icons = Object.keys(modules)

  Promise.all(icons.map((item) => modules[item]())).then((res) => {
    res.forEach((module: any, index) => {
      const item = icons[index];
      const name = item.replace(/(\.\/|\.vue)/g, '')

      // docs-icon-book-type-default -> IconBookTypeDefault.vue
      app.component("docs-icon" + name.replace('Icon', '').replace(/([A-Z])/g, '-$1').toLowerCase(), module.default);
    });
  })
}

export default {
  install,
};
