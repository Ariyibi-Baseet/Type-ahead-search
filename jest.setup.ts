import "@testing-library/jest-dom";

// jsdom doesn't implement scrollIntoView; the component calls it to keep
// the highlighted option visible, so stub it for the test environment.
if (typeof window !== "undefined") {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
}
