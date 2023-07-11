import BookTypeDefaultIcon from "./IconBookTypeDefault.vue";
import ArrowDownIcon from "./IconArrowDown.vue";
import ArrowUpIcon from "./IconArrowUp.vue";
import ArrowLeftIcon from "./IconArrowLeft.vue";
import ArrowRightIcon from "./IconArrowRight.vue";
import PlusIcon from "./IconPlus.vue";
import PencilIcon from "./IconPencil.vue";
import CopyIcon from "./IconCopy.vue";
import CheckIcon from "./IconCheck.vue";
import type { App } from "vue";

function install(app: App) {
  app.component("docs-icon-book-type-default", BookTypeDefaultIcon);
  app.component("docs-icon-arrow-down", ArrowDownIcon);
  app.component("docs-icon-arrow-up", ArrowUpIcon);
  app.component("docs-icon-arrow-left", ArrowLeftIcon);
  app.component("docs-icon-arrow-right", ArrowRightIcon);
  app.component("docs-icon-plus", PlusIcon);
  app.component("docs-icon-pencil", PencilIcon);
  app.component("docs-icon-copy", CopyIcon);
  app.component("docs-icon-check", CheckIcon);
}

export default {
  install,
};
