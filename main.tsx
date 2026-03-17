import { Hono } from "hono";
import { ClientTools, css, tiny } from "@tiny-tools/hono";

const layoutTools = new ClientTools(import.meta.url, {
  styles: {
    headerStyle: css`
      background: oklch(70% 90% 200);
      color: white;
    `,
  },
});

const routeTools = new ClientTools(import.meta.url, {
  functions: {
    clickHandler: function (
      this: HTMLButtonElement,
      ev: MouseEvent,
    ) {
      console.log("clicked this: ", this);
      console.log("clicked ev: ", ev);
      this.dataset.hue = (Math.random() * 360).toFixed(0) + "deg";
      this.textContent =
        `clicked at ${Temporal.Now.plainDateTimeISO().toString()}`;
    },
    basic: function () {
      console.log("Basic function called");
    },
  },
  styles: {
    buttonStyle: css`
      --hue: attr(data-hue type(<angle>), 180deg);
      background: oklch(70% 90% var(--hue));
      color: white;
    `,
  },
});

const app = new Hono()
  .use(...tiny.middleware.clientTools())
  .use(tiny.middleware.layout(async ({ children }) => {
    const { styled } = await layoutTools.engage();
    return (
      <div>
        <h1 class={styled.headerStyle}>MVP Layout</h1>
        <main>{children}</main>
      </div>
    );
  }));

app.get("/", async (c) => {
  const { fn, styled } = await routeTools.engage();
  return c.render(
    <button
      type="button"
      data-hue={(Math.random() * 360).toFixed(0) + "deg"}
      class={styled.buttonStyle}
      onClick={fn.clickHandler}
    >
      {`Loaded at ${Temporal.Now.plainDateTimeISO().toString()}`}
    </button>,
  );
});

Deno.serve({ port: 3032 }, app.fetch);
