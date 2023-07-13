import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

// import ArcoVue from "@arco-design/web-vue";
import "@arco-design/web-vue/dist/arco.css";

import Blocks from "./components/blocks/index";
import DocsIcons from "./components/icons/index";

const app = createApp(App);

app.use(createPinia());
app.use(router);

// app.use(ArcoVue);

Blocks.install(app)
DocsIcons.install(app);

app.mount("#app");
