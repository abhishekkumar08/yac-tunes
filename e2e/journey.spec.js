import { expect, test } from "@playwright/test";

const playerBar = (page) => page.getByRole("region", { name: "Now playing" });
const row = (page, title) => page.getByRole("row").filter({ hasText: title });

test("sign in, play an album, queue, like, build and reorder a playlist", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email").fill("ada@tunes.test");
  await page.getByLabel("Password", { exact: true }).fill("tunes-demo-1");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Good (morning|afternoon|evening)/);

  await page.goto("/album/night-signals");
  await page.getByRole("button", { name: "Play Night Signals" }).click();
  await expect(playerBar(page).getByRole("link", { name: "Night Signals" })).toBeVisible();
  await expect(playerBar(page).getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect(playerBar(page).getByText(/^0:0[1-9]$/).first()).toBeVisible({ timeout: 10000 });

  await row(page, "Exit 14").getByRole("button", { name: /More options for Exit 14/ }).click();
  await page.getByRole("menuitem", { name: "Add to queue" }).click();
  await playerBar(page).getByRole("button", { name: "Next", exact: true }).click();
  await expect(playerBar(page).getByRole("link", { name: "Exit 14" })).toBeVisible();

  await playerBar(page).getByRole("button", { name: "Next", exact: true }).click();
  await expect(playerBar(page).getByRole("link", { name: "Overpass Glow" })).toBeVisible();

  await row(page, "Afterimage").getByRole("button", { name: "Add to Liked Songs" }).click();
  await expect(row(page, "Afterimage").getByRole("button", { name: "Remove from Liked Songs" })).toBeVisible();
  await page.goto("/collection/tracks");
  await expect(row(page, "Afterimage")).toBeVisible();

  await page.getByRole("button", { name: "Create playlist" }).first().click();
  await expect(page).toHaveURL(/\/playlist\/pl-/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/My Playlist #\d+/);
  const find = page.getByRole("textbox", { name: "Search for songs" });
  for (const title of ["Radio Silence", "Kettle On", "Moss"]) {
    await find.fill(title);
    await page.getByRole("listitem").filter({ hasText: title }).getByRole("button", { name: "Add" }).click();
    await expect(row(page, title)).toBeVisible();
  }

  const titles = () => page.locator("[role=grid] [role=row][draggable=true] .text-body-lg").allTextContents();
  await expect.poll(titles).toEqual(["Radio Silence", "Kettle On", "Moss"]);
  await row(page, "Radio Silence").getByRole("button", { name: /More options for Radio Silence/ }).click();
  await page.getByRole("menuitem", { name: "Move down" }).click();
  await expect.poll(titles).toEqual(["Kettle On", "Radio Silence", "Moss"]);

  await page.reload();
  await expect.poll(titles).toEqual(["Kettle On", "Radio Silence", "Moss"]);
  await expect(playerBar(page).getByRole("link", { name: "Overpass Glow" })).toBeVisible();
});
