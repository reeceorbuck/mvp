import { Hono } from "hono";
import { tiny } from "tinytools";
import { signalTools } from "tinytools/handlers";

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

const routeHandlers = new tiny.Handlers(import.meta.url, async () => {
  const { signal } = await tiny.imports(routeSignals);
  return {
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
    setCount: function (
      this: HTMLButtonElement,
    ) {
      signal.count.value = (Number(signal.count.value || 0)) +
        Number(this.value || 0);
    },
  };
});

const routeSignals = new tiny.Signals(
  import.meta.url,
  ({ Signal }) => {
    return {
      count: new Signal<number>(0),
    };
  },
);

const app = new Hono()
  .use(...tiny.middleware.core())
  .use(tiny.middleware.layout(async ({ children }, _c) => {
    const { styled } = await tiny.imports(layoutStyles);
    return (
      <body>
        <h1 class={styled.headerStyle}>MVP Layout</h1>
        <main>{children}</main>
      </body>
    );
  }));

app.get("/", async (c) => {
  const { fn, styled, signal } = await tiny.imports(
    routeStyles,
    routeHandlers,
    routeSignals,
    signalTools,
  );
  return c.render(
    <>
      <button
        type="button"
        data-hue={(Math.random() * 360).toFixed(0) + "deg"}
        class={styled.buttonStyle}
        onClick={fn.clickHandler}
      >
        {`Loaded at ${Temporal.Now.plainDateTimeISO().toString()}`}
      </button>
      <display-count onConnect={signal.count} onSignal={fn.setTextContent}>
        0
      </display-count>
      <button type="button" value="1" onClick={fn.setCount}>+</button>
      <button type="button" value="-1" onClick={fn.setCount}>-</button>
    </>,
  );
});

export { app };
