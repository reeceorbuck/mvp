import { Hono } from "hono";
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
    color: oklch(70% 90% var(--hue));
    padding: 8px;
  `,
  countStyle: tiny.css`
    display: block;
    font-size: 1.5rem;
    margin: 16px 0;
    padding: 8px;
    border: 1px solid black;
  `,
  incrementStyle: tiny.css`
    margin: 16px;
    display: flex;
    gap: 4px;
    button {
      --hue: attr(data-hue type(<angle>), 180deg);
      color: oklch(70% 90% var(--hue));
      padding: 8px;
      flex: 1;
    }
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
    updateCount: function (
      this: HTMLButtonElement,
    ) {
      signal.count.value += Number(this.value || 0);
    },
  };
});

const routeSignals = new tiny.Signals(
  import.meta.url,
  ({ Signal }) => {
    return {
      count: new Signal(0),
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

function randomHue() {
  return (Math.random() * 360).toFixed(0) + "deg";
}

const IncrementButton = async (props: { value: number | string }) => {
  const { fn } = await tiny.imports(routeHandlers);
  return (
    <button
      type="button"
      data-hue={randomHue()}
      value={props.value}
      onClick={fn.updateCount}
    >
      {props.value}
    </button>
  );
};

app.get("/", async (c) => {
  const { fn, styled, signal } = await tiny.imports(
    routeStyles,
    routeHandlers,
    routeSignals,
  );
  return c.render(
    <>
      <button
        type="button"
        data-hue={randomHue()}
        class={styled.buttonStyle}
        onClick={fn.clickHandler}
      >
        {`Loaded at ${Temporal.Now.plainDateTimeISO().toString()}`}
      </button>
      <display-count class={styled.countStyle}>{signal.count}</display-count>
      <increment-count class={styled.incrementStyle}>
        <IncrementButton value={-10} />
        <IncrementButton value={-1} />
        <IncrementButton value="+1" />
        <IncrementButton value="+10" />
      </increment-count>
    </>,
  );
});

export { app };
