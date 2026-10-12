import { expect, type Page } from "@playwright/test";

let counter = 0;

export function uniqueEmail(prefix = "e2e") {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@example.com`;
}

export const PASSWORD = "Sup3rSecret!";

/** Register through the UI and land on the "create your first habit" page. */
export async function registerViaUi(page: Page, name = "Ada Lovelace") {
  const email = uniqueEmail();
  await page.goto("/register");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/habits\/new/);
  return email;
}

/** Create a habit through the form (must already be signed in). */
export async function createHabitViaUi(page: Page, name: string, options: { quantity?: { target: string; unit: string } } = {}) {
  await page.goto("/habits/new");
  await page.getByLabel("Name", { exact: false }).first().fill(name);
  if (options.quantity) {
    await page.getByRole("switch", { name: "Track a quantity" }).click();
    await page.getByLabel("Daily target").fill(options.quantity.target);
    await page.getByLabel("Unit").fill(options.quantity.unit);
  }
  await page.getByRole("button", { name: "Create habit" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
}
