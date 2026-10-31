import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import LandingPage from "./page";

afterEach(cleanup);

it("introduces all four input types and links users to /analyze", () => {
  render(LandingPage());
  expect(screen.getByRole("heading", { name: /Kiểm tra trước khi tin/ })).toBeVisible();
  expect(screen.getByRole("link", { name: "Bắt đầu kiểm tra" })).toHaveAttribute("href", "/analyze");
  expect(screen.getByText("Tin nhắn")).toBeVisible();
  expect(screen.getByText("Email", { selector: "h3" })).toBeVisible();
  expect(screen.getByText("Ảnh chụp")).toBeVisible();
});
