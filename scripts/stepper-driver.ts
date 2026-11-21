import assert from 'node:assert/strict';
import type { Frame, Page } from 'playwright';

/** Exercise the copyable demo, not just its initial appearance, in any rendering. */
export async function checkStepperWorkflow(scope: Page | Frame, account: boolean) {
  const next = () => scope.getByRole('button', { name: 'Next', exact: true }).click();
  const back = () => scope.getByRole('button', { name: 'Back', exact: true }).click();
  const heading = (name: string) => scope.getByRole('heading', { name, exact: true }).waitFor();
  if (account) {
    await heading('Create your account');
    await next();
    await scope.locator('input[name="name"]:invalid').waitFor();
    await scope.getByLabel('Full name', { exact: true }).fill('Ada Lovelace');
    await scope.getByLabel('Email', { exact: true }).fill('not-an-email');
    await next();
    await scope.locator('input[name="email"]:invalid').waitFor();
    await heading('Create your account');
    await scope.getByLabel('Email', { exact: true }).fill('ada@example.com');
    await next();
    await heading('Name your workspace');
    await next();
    await scope.locator('input[name="workspace"]:invalid').waitFor();
    await heading('Name your workspace');
    await scope.getByLabel('Workspace name', { exact: true }).fill('Studio team');
    await next();
    await heading('Review your account');
    assert.match(await scope.locator('[data-demo-summary]').innerText(), /Ada Lovelace.*ada@example\.com.*Studio team/);
    await back();
    await heading('Name your workspace');
    assert.equal(await scope.getByLabel('Workspace name', { exact: true }).inputValue(), 'Studio team');
    await next();
    await heading('Review your account');
  } else {
    await heading('Choose a pickup shop');
    assert.equal(await scope.getByRole('radio').count(), 3);
    await scope.getByRole('radio', { name: /Riverside/ }).check();
    await next();
    await heading('Choose your pickup time');
    await scope.getByLabel('Pickup date', { exact: true }).fill('2026-12-12');
    await scope.getByLabel('Pickup time', { exact: true }).fill('18:15');
    await back();
    await heading('Choose a pickup shop');
    assert.equal(await scope.getByRole('radio', { name: /Riverside/ }).isChecked(), true);
    await next();
    await heading('Choose your pickup time');
    assert.equal(await scope.getByLabel('Pickup date', { exact: true }).inputValue(), '2026-12-12');
    assert.equal(await scope.getByLabel('Pickup time', { exact: true }).inputValue(), '18:15');
    await next();
    await heading('Review your pickup');
    assert.match(await scope.locator('[data-demo-summary]').innerText(), /Riverside[\s\S]*2026-12-12 at 18:15/);
  }
  await scope.getByRole('button', { name: 'Confirm', exact: true }).click();
  const status = scope.locator('[data-demo-confirmation]');
  await status.waitFor();
  assert.equal(await status.innerText(), account ? 'Account setup complete.' : 'Pickup confirmed.');
}
