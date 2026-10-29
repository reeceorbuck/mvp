import { tiny } from "@tinytools/hono-tools";

const counter = new tiny.Signals({ count: 0 });

const testComputed = new tiny.Signals([counter], ({ signal }) => ({
  isEven: () => signal.count.value % 2 === 0,
}));

const base = new tiny.Handlers({
  test() {
    console.log("test");
  },
});

const clicks = new tiny.Handlers([base, counter], ({ signal, fn }) => ({
  add() {
    signal.count.value++;
  },
  testProxy() {
    fn.test();
  },
}));
