import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";
import Hidden from "./components/Hidden.vue";
import PostList from "./components/PostList.vue";
import Slideshow from "./components/Slideshow.vue";
import "./custom.css";

const theme: Theme = {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("Hidden", Hidden);
    app.component("PostList", PostList);
    app.component("Slideshow", Slideshow);
  },
};

export default theme;
