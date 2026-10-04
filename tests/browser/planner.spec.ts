import { test, expect } from "@playwright/test";
test("landing reservation example updates the plan and budget", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A lovely trip. A clear budget." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Try the interactive Lisbon demo" })
    .click();
  await page.getByRole("button", { name: "Read sample confirmation" }).click();
  await page.getByRole("button", { name: "Confirm reservation" }).click();
  await expect(
    page.getByRole("img", {
      name: "Illustrative route between Lisbon airport and the stay",
    }),
  ).toBeVisible();
  await expect(page.locator(".booking-story-budget")).toContainText("€420");
  await page.getByRole("button", { name: /Add example transfer/ }).click();
  await expect(page.locator(".booking-story-budget")).toContainText("€438");
});
test("one cost appears in itinerary and budget and survives refresh", async ({
  page,
}) => {
  await page.goto("/demo");
  await page
    .getByRole("button", { name: "Add to your day", exact: true })
    .click();
  await page.getByRole("button", { name: "Add activity", exact: true }).click();
  await page
    .getByLabel("What’s the plan?", { exact: true })
    .fill("Four museum tickets");
  await page.getByRole("button", { name: /More details: place/ }).click();
  await page.getByRole("button", { name: "Costs 0", exact: true }).click();
  await page.getByRole("button", { name: "Add a cost line" }).click();
  await page.getByLabel("Price", { exact: true }).fill("30");
  await page.getByLabel("Quantity", { exact: true }).fill("4");
  await page
    .getByRole("combobox", { name: "Price is per", exact: true })
    .click();
  await page.getByRole("option", { name: "ticket", exact: true }).click();
  await page.getByRole("button", { name: "Save to my trip" }).click();
  await expect(
    page.getByRole("button", { name: /Four museum tickets.*€120/ }),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Budget", exact: true })
    .filter({ visible: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Four museum tickets.*€120/ }),
  ).toHaveCount(1);
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Four museum tickets.*€120/ }),
  ).toHaveCount(1);
});
test("decorative motion respects reduced-motion and there is no horizontal page overflow", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A lovely trip. A clear budget." }),
  ).toBeVisible();
  expect(
    await page
      .locator(".paint-splat")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("quick cost and a linked deposit stay in one budget item", async ({
  page,
}) => {
  await page.goto("/demo");
  await page
    .getByRole("button", { name: "Add to your day", exact: true })
    .click();
  await page.getByRole("button", { name: "Add activity", exact: true }).click();
  await page
    .getByLabel("What’s the plan?", { exact: true })
    .fill("Quick museum stop");
  await page
    .getByLabel("Group cost (EUR) · optional", { exact: true })
    .fill("30");
  await page
    .getByRole("button", { name: "Save to my trip", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Budget", exact: true })
    .filter({ visible: true })
    .click();
  const before = await page.locator(".budget-stats").innerText();
  await page.getByRole("button", { name: "Add expense", exact: true }).click();
  await page
    .getByRole("combobox", { name: "What are you adding?", exact: true })
    .click();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("option", { name: /Quick museum stop/ }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("combobox", { name: "What are you adding?", exact: true }),
  ).toContainText("Quick museum stop");
  await page.getByLabel("Payment amount (EUR)", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Save payment", exact: true }).click();
  const row = page
    .locator(".expense-row")
    .filter({ hasText: "Quick museum stop" });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("€30.00");
  await expect(row).toContainText("€10.00");
  const after = await page.locator(".budget-stats").innerText();
  expect(after.split("Paid, after refunds")[0]).toBe(
    before.split("Paid, after refunds")[0],
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Budget", exact: true })
    .filter({ visible: true })
    .click();
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("€10.00");
});
