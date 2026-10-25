/**
 * One route per framework feature, each using only that feature, so the
 * bytes a page ships can be compared feature by feature. `measure.ts`
 * fetches every route and totals what the browser downloads.
 */
import { Hono } from "hono";
import { tiny } from "tinytools";

const styles = new tiny.Styles(import.meta.url, {
  box: tiny.css`
    padding: 8px;
    border: 1px solid black;
  `,
});

const clickHandlers = new tiny.Handlers(import.meta.url, {
  greet(this: HTMLButtonElement) {
    this.textContent = "Clicked";
  },
});

const lifecycleHandlers = new tiny.Handlers(import.meta.url, {
  ready(this: HTMLElement) {
    this.textContent = "Connected";
  },
});

const countSignals = new tiny.Signals(import.meta.url, ({ Signal }) => ({
  count: new Signal(0),
}));

const nameSignals = new tiny.Signals(import.meta.url, ({ Signal }) => ({
  name: new Signal("world"),
  agreed: new Signal(false),
}));

const hueSignals = new tiny.Signals(import.meta.url, ({ Signal }) => ({
  hue: new Signal("120deg"),
}));

const computedSignals = new tiny.Signals(
  import.meta.url,
  ({ Signal, Computed }) => {
    const count = new Signal(1);
    return { count, doubled: new Computed(() => count.value * 2) };
  },
);

const triggerSignals = new tiny.Signals(import.meta.url, ({ Trigger }) => ({
  ping: new Trigger(),
}));

const triggerHandlers = new tiny.Handlers(import.meta.url, {
  stamp(this: HTMLElement) {
    this.textContent = `Pinged at ${new Date().toISOString()}`;
  },
});

const instanceSignals = new tiny.Signals(
  import.meta.url,
  ({ Signal, perInstance }) => ({
    ...perInstance(() => ({ clicks: new Signal(0) })),
  }),
);

const rowTemplates = new tiny.Templates(import.meta.url, {
  row: () => <li>$[label]</li>,
});

const templateHandlers = new tiny.Handlers(import.meta.url, async () => {
  const { template } = await tiny.imports(rowTemplates);
  return {
    addRow(this: HTMLButtonElement) {
      this.nextElementSibling?.append(template.row({ label: "New row" }));
    },
  };
});

export const compareApp = new Hono()
  .use(...tiny.middleware.core())
  .get("/empty", (c) => c.render(<p>No tools</p>))
  .get("/scoped-styles", async (c) => {
    const { styled } = await tiny.imports(styles);
    return c.render(<p class={styled.box}>Styled</p>);
  })
  .get("/handler", async (c) => {
    const { fn } = await tiny.imports(clickHandlers);
    return c.render(
      <button type="button" onClick={fn.greet}>Click me</button>,
    );
  })
  .get("/custom-element", async (c) => {
    const { fn } = await tiny.imports(lifecycleHandlers);
    return c.render(<ready-box onConnect={fn.ready}>Waiting</ready-box>);
  })
  .get("/builtin-element", async (c) => {
    const { fn } = await tiny.imports(lifecycleHandlers);
    return c.render(<div onConnect={fn.ready}>Waiting</div>);
  })
  .get("/signal-text", async (c) => {
    const { signal } = await tiny.imports(countSignals);
    return c.render(
      <>
        <button type="button" onClick={signal.count}>Count</button>
        <p>Clicked {signal.count} times</p>
      </>,
    );
  })
  .get("/signal-input", async (c) => {
    const { signal } = await tiny.imports(nameSignals);
    return c.render(
      <>
        <input name="name" value={signal.name} onInput={signal.name} />
        <input
          type="checkbox"
          checked={signal.agreed}
          onChange={signal.agreed}
        />
        <p>Hello {signal.name}</p>
      </>,
    );
  })
  .get("/signal-attribute", async (c) => {
    const { signal } = await tiny.imports(hueSignals);
    return c.render(
      <>
        <input name="hue" value={signal.hue} onInput={signal.hue} />
        <p data-hue={signal.hue}>Hue</p>
      </>,
    );
  })
  .get("/computed", async (c) => {
    const { signal } = await tiny.imports(computedSignals);
    return c.render(
      <>
        <button type="button" onClick={signal.count}>Add</button>
        <p>Doubled: {signal.doubled}</p>
      </>,
    );
  })
  .get("/trigger", async (c) => {
    const { fn, signal } = await tiny.imports(triggerSignals, triggerHandlers);
    return c.render(
      <>
        <button type="button" onClick={signal.ping}>Ping</button>
        <p onConnect={signal.ping} onSignal={fn.stamp}>Not pinged</p>
      </>,
    );
  })
  .get("/per-instance", async (c) => {
    const { signal } = await tiny.imports(instanceSignals);
    return c.render(
      <>
        {[1, 2].map(() => (
          <click-counter tt-instance={instanceSignals.instanceKey}>
            <button type="button" onClick={signal.clicks}>Click</button>
            <span>{signal.clicks}</span>
          </click-counter>
        ))}
      </>,
    );
  })
  .get("/template", async (c) => {
    const { fn } = await tiny.imports(templateHandlers);
    return c.render(
      <>
        <button type="button" onClick={fn.addRow}>Add row</button>
        <ul></ul>
      </>,
    );
  })
  .get("/everything", async (c) => {
    const { fn, signal, styled } = await tiny.imports(
      styles,
      clickHandlers,
      lifecycleHandlers,
      computedSignals,
      triggerSignals,
      triggerHandlers,
      templateHandlers,
    );
    return c.render(
      <>
        <p class={styled.box}>Styled</p>
        <button type="button" onClick={fn.greet}>Click me</button>
        <ready-box onConnect={fn.ready}>Waiting</ready-box>
        <button type="button" onClick={signal.count}>Add</button>
        <p>Doubled: {signal.doubled}</p>
        <button type="button" onClick={signal.ping}>Ping</button>
        <p onConnect={signal.ping} onSignal={fn.stamp}>Not pinged</p>
        <button type="button" onClick={fn.addRow}>Add row</button>
        <ul></ul>
      </>,
    );
  });

/** The routes `measure.ts` compares, in order. */
export const compareRoutes = compareApp.routes
  .filter((route) => route.method === "GET")
  .map((route) => route.path);
