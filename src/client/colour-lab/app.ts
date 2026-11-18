import { applyScheme, Hct } from 'material/theme';
import { createSchemeByName } from 'material/theme/variants';
import { LAB_DEFAULT, LAB_ROLES, LAB_VARIANTS, contrastGrade, labCss, labHex, labJavaScript, labSeed, type LabState } from '../../shared/colour-lab';
import { contrastRatio } from '../../shared/color';
import { buildLabPreview, LAB_STATUSES } from './preview';

export function createColourLab(root: HTMLElement): { destroy: () => void } {
  const find = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const stage = find<HTMLElement>('#colour-lab-stage');
  const hex = find<HTMLInputElement>('#lab-hex');
  const picker = find<HTMLInputElement>('#lab-picker');
  const variant = find<HTMLSelectElement>('#lab-variant');
  const contrast = find<HTMLInputElement>('#lab-contrast');
  const help = find<HTMLElement>('#lab-hex-help');
  const codeDrawer = find<HTMLDetailsElement>('#lab-code');
  const getCode = find<HTMLButtonElement>('#lab-get-code');
  const codeContent = find<HTMLElement>('#lab-code-content');
  const copyCode = find<HTMLButtonElement>('#lab-copy-code');
  const sourceImage = find<HTMLImageElement>('#lab-source-image');
  const imageNote = find<HTMLElement>('#lab-image-note');
  const sourceNote = find<HTMLOutputElement>('#lab-hct');
  const signal = new AbortController();
  const state: LabState = { ...LAB_DEFAULT };
  let tokens: Record<string, string> = {};
  let codeFormat: 'js' | 'css' = 'js';
  let sourceRequest = 0;
  let destroyed = false;
  let frame = 0;
  let announcementTimer = 0;
  const announce = (message: string) => {
    if (destroyed) return;
    clearTimeout(announcementTimer);
    find('#lab-announcement').textContent = message;
    announcementTimer = window.setTimeout(() => { find('#lab-announcement').textContent = ''; }, 3500);
  };
  const destroyPreview = buildLabPreview(root, announce);
  const listen = (target: EventTarget, type: string, callback: EventListener) => target.addEventListener(type, callback, { signal: signal.signal });
  const copy = async (value: string, message: string) => {
    try { await navigator.clipboard.writeText(value); announce(message); }
    catch { announce('Could not copy. Select the code or value and copy it manually.'); }
  };
  const renderCode = () => { codeContent.textContent = codeFormat === 'js' ? labJavaScript(state) : labCss(tokens); };
  const render = () => {
    frame = 0;
    if (destroyed) return;
    const scheme = createSchemeByName(state.seed, { variant: state.variant, mode: state.mode, contrast: state.contrast });
    // The only application target: documentation chrome and controls keep their palette.
    applyScheme(scheme, stage);
    stage.style.colorScheme = stage.dataset.mode = state.mode;
    stage.dataset.seed = state.seed;
    stage.dataset.variant = state.variant;
    stage.dataset.contrast = String(state.contrast);
    tokens = Object.fromEntries(LAB_ROLES.map(role => [role, stage.style.getPropertyValue('--mtrl-sys-color-' + role).trim()]));
    picker.value = state.seed;
    picker.parentElement!.style.background = state.seed;
    variant.value = state.variant;
    contrast.value = String(state.contrast);
    const preset = state.contrast === -1 ? 'Reduced' : state.contrast === 0 ? 'Standard' : state.contrast === 0.5 ? 'Medium' : state.contrast === 1 ? 'High' : 'Custom';
    const signed = (state.contrast > 0 ? '+' : '') + state.contrast.toFixed(2);
    find<HTMLOutputElement>('#lab-contrast-value').value = preset + ' · ' + signed;
    contrast.setAttribute('aria-valuetext', signed + ', ' + preset.toLowerCase() + ' contrast');
    for (const input of root.querySelectorAll<HTMLInputElement>('input[name="lab-contrast-preset"]')) input.checked = Number(input.value) === state.contrast;
    for (const input of root.querySelectorAll<HTMLInputElement>('input[name="lab-mode"]')) input.checked = input.value === state.mode;
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-seed]')) button.setAttribute('aria-pressed', String(button.dataset.seed?.toLowerCase() === state.seed));
    const hct = Hct.fromInt(0xff000000 + Number.parseInt(state.seed.slice(1), 16));
    sourceNote.value = 'H ' + hct.hue.toFixed(0) + ' · C ' + hct.chroma.toFixed(0) + ' · T ' + hct.tone.toFixed(0);
    const variantName = LAB_VARIANTS.find(([value]) => value === state.variant)![1];
    find('#lab-preview-caption').textContent = variantName + ' · ' + (state.mode === 'light' ? 'Light' : 'Dark');
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-role-copy]')) {
      const role = button.dataset.roleCopy!;
      button.querySelector<HTMLElement>('.lab-token-colour')!.style.backgroundColor = tokens[role]!;
      button.querySelector('[data-role-hex]')!.textContent = tokens[role]!;
      const format = root.querySelector<HTMLInputElement>('input[name="lab-copy-mode"]:checked')?.value ?? 'variable';
      button.setAttribute('aria-label', 'Copy ' + role + (format === 'hex' ? ' hex ' + tokens[role] : ' CSS variable'));
    }
    for (const { role } of LAB_STATUSES) {
      const ratio = contrastRatio(tokens[role]!, tokens['on-' + role]!)!;
      find('[data-status-ratio="' + role + '"]').textContent = ratio.toFixed(2) + ':1 ' + contrastGrade(ratio);
      find('[data-status="' + role + '"]').dataset.ratio = String(ratio);
    }
    renderCode();
    stage.dataset.ready = 'true';
  };
  const schedule = () => { if (!frame && !destroyed) frame = requestAnimationFrame(render); };
  const clearImage = () => {
    ++sourceRequest;
    sourceImage.hidden = true;
    sourceImage.removeAttribute('src');
    imageNote.textContent = 'Images stay in your browser.';
    root.removeAttribute('aria-busy');
    for (const button of root.querySelectorAll('[data-sample]')) button.setAttribute('aria-pressed', 'false');
  };
  const setSeed = (seed: string, fromImage = false) => {
    if (!fromImage) clearImage();
    state.seed = seed;
    hex.value = seed.toUpperCase();
    hex.removeAttribute('aria-invalid');
    help.removeAttribute('data-error');
    help.textContent = 'Pick a colour, or try one of our favourites.';
    schedule();
  };
  listen(hex, 'input', () => {
    const value = labSeed(hex.value);
    if (value) setSeed(value);
    else {
      // An unfinished or invalid hex never replaces the last usable scheme.
      clearImage();
      hex.setAttribute('aria-invalid', 'true');
      help.dataset.error = '';
      help.textContent = 'Use six hex digits, for example #6750A4.';
    }
  });
  listen(picker, 'input', () => setSeed(picker.value));
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-seed]')) listen(button, 'click', () => setSeed(button.dataset.seed!.toLowerCase()));
  listen(variant, 'change', () => { state.variant = variant.value as LabState['variant']; schedule(); });
  for (const input of root.querySelectorAll<HTMLInputElement>('input[name="lab-mode"]')) listen(input, 'change', () => { state.mode = input.value === 'dark' ? 'dark' : 'light'; schedule(); });
  for (const input of root.querySelectorAll<HTMLInputElement>('input[name="lab-contrast-preset"]')) listen(input, 'change', () => { state.contrast = Number(input.value); schedule(); });
  listen(contrast, 'input', () => { state.contrast = Number(contrast.value); schedule(); });
  for (const input of root.querySelectorAll('input[name="lab-copy-mode"]')) listen(input, 'change', schedule);
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-role-copy]')) listen(button, 'click', () => {
    const role = button.dataset.roleCopy!;
    const asHex = root.querySelector<HTMLInputElement>('input[name="lab-copy-mode"]:checked')?.value === 'hex';
    const value = asHex ? tokens[role]! : 'var(--mtrl-sys-color-' + role + ')';
    void copy(value, 'Copied ' + value);
  });

  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-code-tab]')];
  const selectTab = (tab: HTMLButtonElement) => {
    codeFormat = tab.dataset.codeTab === 'css' ? 'css' : 'js';
    for (const item of tabs) { item.setAttribute('aria-selected', String(item === tab)); item.tabIndex = item === tab ? 0 : -1; }
    find('#lab-code-panel').setAttribute('aria-labelledby', tab.id);
    copyCode.textContent = codeFormat === 'js' ? 'Copy JavaScript' : 'Copy CSS';
    renderCode();
  };
  for (const [index, tab] of tabs.entries()) {
    listen(tab, 'click', () => selectTab(tab));
    listen(tab, 'keydown', event => {
      const key = (event as KeyboardEvent).key;
      const next = key === 'Home' ? 0 : key === 'End' ? tabs.length - 1 : key === 'ArrowRight' ? (index + 1) % tabs.length : key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : null;
      if (next === null) return;
      event.preventDefault();
      selectTab(tabs[next]!);
      tabs[next]!.focus();
    });
  }
  listen(copyCode, 'click', () => { void copy(codeContent.textContent ?? '', codeFormat === 'js' ? 'JavaScript copied' : 'CSS copied'); });
  listen(getCode, 'click', () => {
    codeDrawer.open = !codeDrawer.open;
    if (codeDrawer.open) { codeDrawer.scrollIntoView({ block: 'nearest' }); tabs.find(tab => tab.getAttribute('aria-selected') === 'true')!.focus({ preventScroll: true }); }
  });
  listen(codeDrawer, 'toggle', () => getCode.setAttribute('aria-expanded', String(codeDrawer.open)));

  const readImage = async (src: string, label: string, sample?: string) => {
    const request = ++sourceRequest;
    root.setAttribute('aria-busy', 'true');
    imageNote.textContent = 'Finding a colour…';
    try {
      const image = new Image();
      image.src = src;
      await image.decode();
      // Quantize a small image: avoid running the library's pixel scorer on a full photo.
      const scale = Math.min(1, 128 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const thumbnail = new Image();
      thumbnail.src = canvas.toDataURL('image/png');
      await thumbnail.decode();
      const { sourceColorFromImage } = await import('material/theme/image');
      const seed = await sourceColorFromImage(thumbnail);
      if (destroyed || request !== sourceRequest) return;
      setSeed(labHex(seed.toInt()), true);
      sourceImage.src = thumbnail.src;
      sourceImage.hidden = false;
      imageNote.textContent = label;
      for (const button of root.querySelectorAll<HTMLButtonElement>('[data-sample]')) button.setAttribute('aria-pressed', String(button.dataset.sample === sample));
      announce('Seed extracted from ' + label + '.');
    } catch {
      if (!destroyed && request === sourceRequest) { imageNote.textContent = 'Could not read that image. Try another.'; announce('Could not read that image. Your previous colour is still active.'); }
    } finally { if (!destroyed && request === sourceRequest) root.removeAttribute('aria-busy'); }
  };
  const upload = async (file: File) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) {
      ++sourceRequest;
      root.removeAttribute('aria-busy');
      imageNote.textContent = 'Choose a PNG, JPEG or WebP image under 20 MB.';
      announce(imageNote.textContent);
      return;
    }
    const url = URL.createObjectURL(file);
    try { await readImage(url, file.name); } finally { URL.revokeObjectURL(url); }
  };
  const fileInput = find<HTMLInputElement>('#lab-image');
  listen(fileInput, 'change', () => { const file = fileInput.files?.[0]; fileInput.value = ''; if (file) void upload(file); });
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-sample]')) listen(button, 'click', () => { void readImage(button.dataset.sample!, button.querySelector('span')!.textContent!, button.dataset.sample); });
  const dropzone = find('#lab-dropzone');
  listen(dropzone, 'dragover', event => { if ((event as DragEvent).dataTransfer?.types.includes('Files')) { event.preventDefault(); dropzone.dataset.dragging = ''; } });
  listen(dropzone, 'dragleave', event => { if (!dropzone.contains((event as DragEvent).relatedTarget as Node)) delete dropzone.dataset.dragging; });
  listen(dropzone, 'drop', event => {
    delete dropzone.dataset.dragging;
    const file = (event as DragEvent).dataTransfer?.files[0];
    if (file) { event.preventDefault(); void upload(file); }
  });
  render();
  return { destroy: () => { destroyed = true; ++sourceRequest; signal.abort(); cancelAnimationFrame(frame); clearTimeout(announcementTimer); destroyPreview(); } };
}
