import { Hono } from "hono";
import { css, tiny } from "@tinytools/hono-tools";

const sharedHandlersExample = new tiny.Handlers(import.meta.url, {
  logTimestamp: function () {
    console.log("timestamp: ", Temporal.Now.plainDateTimeISO().toString());
  },
});

const routeStyles = new tiny.Styles(import.meta.url, {
  buttonStyle: tiny.css`
    --hue: attr(data-hue type(<angle>), 180deg);
    background: oklch(70% 90% var(--hue));
    color: white;
  `,
  headerStyle: css`
    background: oklch(70% 90% 200);
    color: white;
  `,
});

const _globalStylesExample = new tiny.Styles(import.meta.url, {
  testStyle: tiny.css`
    color: red;
  `,
}, { global: true });

const routeHandlers = new tiny.Handlers(import.meta.url, {
  clickHandler: function (
    this: HTMLButtonElement,
    ev: MouseEvent,
  ) {
    console.log("clicked this: ", this);
    console.log("clicked ev: ", ev);
    this.dataset.hue = (Math.random() * 360).toFixed(0) + "deg";
    this.textContent =
      `clicked at ${Temporal.Now.plainDateTimeISO().toString()}`;
    logTimestamp();
  },
  basic: function () {
    console.log("Basic function called");
  },
}, {
  imports: [sharedHandlersExample],
});

const testStyleTools = new tiny.Styles(import.meta.url, {
  buttonStyle: css`
    background: oklch(78% 0.18 155);
    color: white;
  `,
});

const testHandlerTools = new tiny.Handlers(import.meta.url, {
  testHandler: function (this: HTMLButtonElement) {
    this.textContent = "Test route clicked";
  },
});

const { logTimestamp } = routeHandlers.getFunctionReferences;

const app = new Hono()
  .use(...tiny.middleware.core())
  .use(tiny.middleware.layout(async ({ children }) => {
    const { styled } = await tiny.imports(routeStyles);
    return (
      <div>
        <h1 class={styled.headerStyle}>MVP Layout</h1>
        <main>{children}</main>
      </div>
    );
  }));

app.get("/", async (c) => {
  const { fn, styled } = await tiny.imports(routeStyles, routeHandlers);
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

app.get("/test", async (c) => {
  const { fn, styled } = await tiny.imports(testHandlerTools, testStyleTools);
  return c.render(
    <button
      type="button"
      class={styled.buttonStyle}
      onClick={fn.testHandler}
    >
      Test Button
    </button>,
  );
});

Deno.serve({ port: 3032 }, app.fetch);
