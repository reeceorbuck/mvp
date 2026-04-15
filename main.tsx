import { tiny } from "tinytools";

const layoutStyles = new tiny.Styles(import.meta.url, {
  headerStyle: tiny.css`
    background: oklch(70% 90% 200);
    color: white;
  `,
});

const routeStyles = new tiny.Styles(import.meta.url, {
  buttonStyle: tiny.css`
    --hue: attr(data-hue type(<angle>), 180deg);
    background: oklch(70% 90% var(--hue));
    color: white;
  `,
});

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
  },
  basic: function () {
    console.log("Basic function called");
  },
});

const app = new tiny.Hono({ tools: "core" })
  .use(tiny.middleware.layout(async ({ children }) => {
    const { styled } = await tiny.imports(layoutStyles);
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

export { app };
