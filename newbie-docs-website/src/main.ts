import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

import "./assets/base.css";

import ArcoVue from "@arco-design/web-vue";
import ArcoVueIcon from '@arco-design/web-vue/es/icon';
import "@arco-design/web-vue/dist/arco.css";

import Blocks from "./components/blocks/index";
import DocsIcons from "./components/icons/index";

const app = createApp(App);

app.use(createPinia());

app.use(ArcoVue);
app.use(ArcoVueIcon);

Blocks.install(app)
DocsIcons.install(app);

app.use(router);

app.mount("#app");