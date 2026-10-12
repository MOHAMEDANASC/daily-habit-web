import { expect, test } from "@playwright/test";
import { PASSWORD, createHabitViaUi, registerViaUi, uniqueEmail } from "./helpers";

test.describe("authentication", () => {
  test("redirects signed-out visitors to the login page and back after signing in", async ({ page }) => {
    await page.goto("/tracker");
    await expect(page).toHaveURL(/\/login\?next=%2Ftracker/);

    // Register in this context, sign out, then sign back in through ?next=
    const email = await registerViaUi(page);
    await page.getByRole("button", { name: /Account menu/ }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/tracker");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/tracker/);
    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  });

  test("shows a clear error for wrong credentials and validation messages", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Enter your password.")).toBeVisible();

    await page.getByLabel("Email").fill(uniqueEmail("ghost"));
    await page.getByLabel("Password", { exact: true }).fill("Wrong-pass1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  });

  test("validates the registration form", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Name").fill("Ada");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password", { exact: true }).fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
  });

  test("password reset request shows the same confirmation for any email", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(uniqueEmail("nobody"));
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("Check your inbox")).toBeVisible();

    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: "This link isn't valid" })).toBeVisible();
  });
});

test.describe("habits, tracking and analytics", () => {
  test("create a habit, complete it, and see it reflected on the dashboard, calendar and analytics", async ({ page }) => {
    await registerViaUi(page);
    await createHabitViaUi(page, "Read for 20 minutes");

    // Daily tracker
    await page.goto("/tracker");
    await expect(page.getByText("0 of 1 done")).toBeVisible();
    await page.getByRole("button", { name: "Mark Read for 20 minutes as done" }).click();
    await expect(page.getByText("All done")).toBeVisible();
    await expect(page.getByRole("progressbar", { name: /completion/ })).toHaveAttribute("aria-valuenow", "100");

    // Undo works and the percentage follows
    await page.getByRole("button", { name: "Undo completion of Read for 20 minutes" }).click();
    await expect(page.getByText("0 of 1 done")).toBeVisible();
    await page.getByRole("button", { name: "Mark Read for 20 minutes as done" }).click();
    await expect(page.getByText("All done")).toBeVisible();

    // Dashboard figures come from the database
    await page.goto("/dashboard");
    await expect(page.getByText("1 of 1 done")).toBeVisible();
    await expect(page.getByText("Active habits")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Streaks" })).toBeVisible();

    // Calendar shows today's status and a day summary
    await page.goto("/calendar");
    await expect(page.getByRole("button", { pressed: true })).toContainText(/\d/);
    await expect(page.getByText("Read for 20 minutes").first()).toBeVisible();

    // Analytics: the data table reflects one completion
    await page.goto("/analytics");
    await expect(page.getByText("Completions", { exact: true })).toBeVisible();
    await expect(page.getByText("Habit-wise completion")).toBeVisible();
    await expect(page.getByRole("link", { name: "Read for 20 minutes" }).first()).toBeVisible();
  });

  test("measurable habits only count once the target is reached", async ({ page }) => {
    await registerViaUi(page);
    await createHabitViaUi(page, "Drink water", { quantity: { target: "8", unit: "glasses" } });

    await page.goto("/tracker");
    await page.getByRole("button", { name: "Log an amount or note for Drink water" }).click();
    await page.getByLabel(/Amount/).fill("3");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("3 / 8 glasses")).toBeVisible();
    await expect(page.getByText("0 of 1 done")).toBeVisible();

    await page.getByRole("button", { name: "Log an amount or note for Drink water" }).click();
    await page.getByLabel(/Amount/).fill("8");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("All done")).toBeVisible();
  });

  test("edit, archive, reactivate and delete a habit with confirmation", async ({ page }) => {
    await registerViaUi(page);
    await createHabitViaUi(page, "Stretch");

    await page.getByRole("link", { name: "Edit" }).click();
    await page.getByLabel("Name", { exact: false }).first().fill("Stretch daily");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("heading", { name: "Stretch daily" })).toBeVisible();

    await page.getByRole("button", { name: "Archive" }).click();
    await expect(page.getByText("Archived", { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Reactivate" }).click();
    await expect(page.getByRole("button", { name: "Archive" })).toBeVisible();

    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("alertdialog")).toContainText("permanently removes the habit");
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: "Stretch daily" })).toBeVisible();

    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete habit" }).dispatchEvent("click");
    await expect(page).toHaveURL(/\/habits$/);
    await expect(page.getByText("No habits yet")).toBeVisible();
  });

  test("search and filter the habits list", async ({ page }) => {
    await registerViaUi(page);
    await createHabitViaUi(page, "Morning run");
    await createHabitViaUi(page, "Read a book");

    await page.goto("/habits");
    await expect(page.getByRole("link", { name: "Morning run" })).toBeVisible();
    await page.getByLabel("Search habits by name").fill("book");
    await expect(page.getByRole("link", { name: "Read a book" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Morning run" })).toHaveCount(0);
    await page.getByLabel("Search habits by name").fill("zzz");
    await expect(page.getByText("No habits match")).toBeVisible();
  });

  test("goals: create a goal and see progress move when a habit is completed", async ({ page }) => {
    await registerViaUi(page);
    await createHabitViaUi(page, "Meditate");

    await page.goto("/goals");
    await page.getByRole("button", { name: "Create a goal" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Title").fill("Meditate 3 days");
    await dialog.getByRole("combobox", { name: /Habit/ }).click();
    await page.getByRole("option", { name: "Meditate" }).click();
    await dialog.getByLabel("Target").fill("3");
    await dialog.getByRole("button", { name: "Create goal" }).click();
    await expect(page.getByRole("heading", { name: "Meditate 3 days" })).toBeVisible();
    await expect(page.getByText("0 of 3 completions")).toBeVisible();

    await page.goto("/tracker");
    await page.getByRole("button", { name: "Mark Meditate as done" }).click();
    await expect(page.getByText("All done")).toBeVisible();
    await page.goto("/goals");
    await expect(page.getByText("1 of 3 completions")).toBeVisible();
  });
});

test.describe("settings", () => {
  test("theme choice is applied and survives a reload", async ({ page }) => {
    await registerViaUi(page);
    await page.goto("/settings");
    await page.getByRole("radio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("changes the password and deletes the account after confirming", async ({ page }) => {
    const email = await registerViaUi(page);
    await page.goto("/settings");
    await page.getByLabel("Current password").fill(PASSWORD);
    await page.getByLabel("New password", { exact: true }).fill("Brand-new-pass1");
    await page.getByLabel("Confirm new password").fill("Brand-new-pass1");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText(/Password updated/)).toBeVisible();

    await page.getByRole("button", { name: "Delete my account" }).click();
    await page.getByRole("alertdialog").getByLabel("Password", { exact: true }).fill("Brand-new-pass1");
    await page.getByRole("button", { name: "Delete forever" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("Brand-new-pass1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  });

  test("shows the not-found page for unknown routes", async ({ page }) => {
    await page.goto("/definitely-not-a-page");
    await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
  });
});

test.describe("mobile @mobile", () => {
  test("daily tracking works with the bottom navigation on a phone", async ({ page }) => {
    await registerViaUi(page);
    await createHabitViaUi(page, "Walk");

    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav).toBeVisible();
    await nav.getByRole("link", { name: "Today" }).click();
    await expect(page).toHaveURL(/\/tracker/);

    const check = page.getByRole("button", { name: "Mark Walk as done" });
    const box = await check.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await check.click();
    await expect(page.getByText("All done")).toBeVisible();

    // No horizontal page scroll on a narrow screen
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    await nav.getByRole("button", { name: "More" }).click();
    await expect(page.getByRole("link", { name: "Analytics" })).toBeVisible();
  });
});
