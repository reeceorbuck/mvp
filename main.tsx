import { Hono } from "hono";
import { addTinyTools, ClientTools, css } from "@tiny-tools/hono";
import { buildScriptFiles } from "@tiny-tools/hono/build";

const clientTools = new ClientTools(import.meta.url, {
  functions: {
    clickHandler: function (_e: Event) {
      console.log("clicked");
    },
  },
  styles: {
    buttonStyle: css`
      background: #ff00c8;
      color: white;
    `,
  },
});

const testTools = new ClientTools(import.meta.url, {
  functions: {
    clickHandler: function (_e: Event) {
      console.log("clicked alt test");
    },
  },
  styles: {
    buttonStyle: css`
      background: orange;
      color: white;
    `,
  },
});

const app = new Hono()
  .use(...addTinyTools());

app.get("/", (c) => {
  const { fn, styled } = clientTools.engage();
  return c.render(
    <button type="button" class={styled.buttonStyle} onClick={fn.clickHandler}>
      Hello World!
    </button>,
  );
});

app.get("/alt", (c) => {
  const { fn, styled } = testTools.engage();
  return c.render(
    <button type="button" class={styled.buttonStyle} onClick={fn.clickHandler}>
      Hello World!
    </button>,
  );
});

await buildScriptFiles();

Deno.serve({ port: 3032 }, app.fetch);
