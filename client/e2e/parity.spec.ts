import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const pngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAwAAAAICAIAAADN5B7xAAAAGUlEQVR4nGP8z8AARLJgwi1GqGkY1TAAAM6pAqzH/2GfAAAAAElFTkSuQmCC";

test("core local workflow parity", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("banner").getByText("Hotel Breakfast Campaign")).toBeVisible();

  await page.getByLabel("AI Brief").fill("高級ホテルの朝食広告");
  await page.getByRole("button", { name: /AI Brief から構造化/ }).click();
  await expect(page.getByRole("textbox", { name: "Intent" })).toHaveValue(/premium editorial/);

  await page
    .getByRole("textbox", { name: "Subject" })
    .fill("croissant and coffee on refined tableware");
  await page.getByRole("button", { name: "Compile (Alt+Shift+Enter)", exact: true }).click();
  await expect(page.getByLabel("Compiled Prompt")).toContainText("croissant and coffee");

  await page.getByRole("button", { name: "Prompt Doctorで確認する" }).click();
  await expect(page.getByText(/構図の比較軸/)).toBeVisible();
  await page.getByText(/構図の比較軸/).click();
  await page.getByRole("button", { name: "適用" }).click();
  await expect(page.getByRole("textbox", { name: "Composition" })).toHaveValue(
    /close-to-medium/
  );

  await page.getByRole("button", { name: "AIにパラメータを提案してもらう" }).click();
  const parameterDialog = page.getByRole("dialog", { name: "パラメータを適用しますか？" });
  await expect(parameterDialog.getByText("Stylize", { exact: true })).toBeVisible();
  await expect(parameterDialog).not.toContainText("profile_name");
  await page.getByRole("button", { name: "適用" }).click();
  await expect(page.getByText("提案されたパラメータを適用し、Compiled Promptを更新しました。内容を確認できます。")).toBeVisible();

  await page.getByRole("tab", { name: /既存Promptを整える/ }).click();
  await page.getByLabel("Japanese Source").fill("高級感のある朝食");
  await page.getByRole("button", { name: /英語Prompt化/ }).click();
  await expect(page.getByLabel("変換結果")).toHaveValue(/premium editorial/);

  const imagePath = writeImage("reference.png");
  await page.getByRole("tab", { name: /参考画像を使う/ }).click();
  await page.getByLabel("Reference Library").locator('input[type="file"]').setInputFiles(imagePath);
  await expect(page.getByRole("button", { name: "Analyze reference" })).toBeVisible();
  await page.getByRole("button", { name: "Analyze reference" }).click();
  await expect(page.getByText("soft morning window light")).toBeVisible();
  await page.getByText("soft morning window light").click();
  await page.getByRole("button", { name: "適用" }).click();
  await page.getByRole("tab", { name: /プロンプトを作る/ }).click();
  await expect(page.getByRole("textbox", { name: "Style" })).toHaveValue(
    /soft morning window light/
  );

  await page.getByRole("tab", { name: /複数案を比較する/ }).click();
  await page.getByLabel("Objective").fill("スタイルと構図の比較");
  await page.getByRole("button", { name: /AI Plan/ }).click();
  await expect(page.getByText("stylize", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Generate/ }).click();
  await expect(page.getByRole("cell", { name: /--s/ }).first()).toBeVisible();
  await page.getByRole("button", { name: /All/ }).click();
  await page.getByRole("button", { name: "閉じる" }).click();
  await page.getByRole("button", { name: /CSV/ }).click();
  await page.getByRole("button", { name: "閉じる" }).click();
  await page.getByRole("button", { name: /Markdown/ }).click();
  await page.getByRole("button", { name: "閉じる" }).click();

  await page.getByRole("tab", { name: /生成結果を見直す/ }).click();
  await page.getByLabel("Result Review").locator('input[type="file"]').setInputFiles(imagePath);
  await expect(page.getByText(/Source Prompt/)).toBeVisible();
  await page.getByRole("button", { name: /AI Review/ }).click();
  await expect(page.getByText(/全体に高品質/)).toBeVisible();
  await page.getByRole("button", { name: /Next Prompt/ }).click();
  await page.getByRole("button", { name: "適用" }).click();
  await page.getByRole("tab", { name: /生成結果を見直す/ }).click();
  await page.getByRole("button", { name: /Final Audit/ }).click();
  await expect(page.getByText(/コピー前の最終監査/)).toBeVisible();

  await page.getByLabel("Main tabs").getByRole("tab", { name: /設定/ }).click();
  const executionProfile = page.getByLabel("AI execution profile");
  await expect(executionProfile.getByText("GPT-5.6 Luna", { exact: true })).toBeVisible();
  await expect(executionProfile.getByText("High", { exact: true })).toBeVisible();
  await expect(executionProfile.getByText("Low", { exact: true })).toBeVisible();
  await page.getByLabel("語彙補助 vocabulary amount").selectOption("rich");
  await page.getByRole("button", { name: /語彙設定を保存/ }).click();
  await expect(page.getByText("AI支援の語彙設定を保存しました。次のAI支援から反映されます。")).toBeVisible();
  const privacyMode = page.getByLabel("Settings").getByLabel("Privacy modeを有効にする");
  await privacyMode.click();
  await page.getByRole("button", { name: "Privacy modeを有効にする" }).click();
  await expect(page.getByText("Privacy modeの設定を保存しました。以後の実API呼び出しに反映されます。")).toBeVisible();
  await expect(privacyMode).toBeChecked();
  await page.reload();
  await page.getByLabel("Main tabs").getByRole("tab", { name: /設定/ }).click();
  await expect(page.getByLabel("Settings").getByLabel("Privacy modeを有効にする")).toBeChecked();
});

function writeImage(filename: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mjps-e2e-"));
  const imagePath = path.join(dir, filename);
  fs.writeFileSync(imagePath, Buffer.from(pngBase64, "base64"));
  return imagePath;
}
