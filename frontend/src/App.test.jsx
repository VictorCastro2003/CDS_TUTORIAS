import { render, screen } from "@testing-library/react";
import App from "./App";

test("renderiza el texto principal", () => {
  render(<App />);
  const element = screen.getByText(/react/i);
  expect(element).toBeInTheDocument();
});
