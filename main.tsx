import { Hono } from "hono";
import { tiny } from "tinytools";
import { compareApp } from "./compare.tsx";

performance.mark("startup:importsComplete");

const layoutStyles = new tiny.Styles({
  headerStyle: tiny.css`
    background: oklch(70% 90% 200);
    color: white;
  `,
});

const routeStyles = new tiny.Styles({
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
  hoverDivStyle: tiny.css`
    padding: 16px;
    border: 1px solid black;
    margin: 8px 0;
    --hue: attr(data-hue type(<angle>), 180deg);
    background: oklch(70% 90% var(--hue));
  `,
});

const routeHandlers = new tiny.Handlers(async () => {
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
    incrementCount: function (
      this: HTMLButtonElement,
    ) {
      signal.count.value += Number(this.value || 0);
    },
    updateCount: function (
      this: HTMLInputElement,
    ) {
      signal.count.value = Number(this.value || 0);
    },
    adjustCount: function (
      this: HTMLInputElement,
    ) {
      if (this.checked && signal.isEven.value === false) {
        signal.count.value += 1;
      }
      if (!this.checked && signal.isEven.value === true) {
        signal.count.value -= 1;
      }
    },
    writeTime: function (
      this: HTMLDivElement,
    ) {
      this.textContent =
        `Hovered at ${Temporal.Now.plainDateTimeISO().toString()}`;
    },
  };
});

const routeSignals = new tiny.Signals(
  ({ Signal, Computed, Trigger }) => {
    const count = new Signal(5);
    const hovered = new Trigger();
    return {
      count,
      isEven: new Computed(() => count.value % 2 === 0),
      hovered,
      hue: new Computed(() => (Math.random() * 360).toFixed(0) + "deg", [
        hovered,
      ]),
    };
  },
);

const app = new Hono()
  .route("/compare", compareApp)
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
      onClick={fn.incrementCount}
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
      <input
        type="number"
        name="count"
        value={signal.count}
        onInput={fn.updateCount}
      />
      <label>
        Is count even?
        <input
          type="checkbox"
          name="is-even-better"
          checked={signal.isEven}
          onChange={fn.adjustCount}
        />
      </label>
      <increment-count class={styled.incrementStyle}>
        <IncrementButton value={-10} />
        <IncrementButton value={-1} />
        <IncrementButton value="+1" />
        <IncrementButton value="+10" />
      </increment-count>

      <div class={styled.hoverDivStyle} onMouseOver={signal.hovered}>
        Hover over me
      </div>
      <div
        class={styled.hoverDivStyle}
        data-hue={signal.hue}
      >
        And watch my background color change
      </div>
      <div onConnect={signal.hovered} onSignal={fn.writeTime}>
        And I'll set the time
      </div>
    </>,
  );
});

performance.mark("startup:routesRegistered");

export { app };
