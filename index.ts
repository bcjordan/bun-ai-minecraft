import calculator from "./calculator.html";

Bun.serve({
  routes: {
    "/": calculator,
  },
  development: {
    hmr: true,
  }
});