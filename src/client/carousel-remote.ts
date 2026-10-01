// The carousel playground's remote: mtrl icon buttons and a slider driving the
// carousel through its public API (next, prev, goTo, getCurrentSlide, slides.getCount),
// and following it through its `change` event, so swiping, the keyboard and the
// trackpad move the remote as well. Created and destroyed with each carousel.
import createIconButton from 'mtrl/components/icon-button';
import createSlider from 'mtrl/components/slider';
import type { CarouselComponent } from 'mtrl/components/carousel';
import { symbols } from '../shared/icons';

export function createCarouselRemote(carousel: CarouselComponent): { element: HTMLElement; destroy: () => void } {
  const count = carousel.slides.getCount();
  const last = Math.max(0, count - 1);
  const button = (icon: string, ariaLabel: string, go: () => void) => {
    const control = createIconButton({ icon, ariaLabel, variant: 'standard' });
    control.on('click', go);
    return control;
  };
  const first = button(symbols.firstPage, 'First slide', () => carousel.goTo(0));
  const previous = button(symbols.chevronLeft, 'Previous slide', () => carousel.prev());
  const next = button(symbols.chevronRight, 'Next slide', () => carousel.next());
  const end = button(symbols.lastPage, 'Last slide', () => carousel.goTo(last));
  // One step per slide, numbered from 1 as the counter reads.
  const slider = createSlider({ min: 1, max: Math.max(1, count), step: 1, value: carousel.getCurrentSlide() + 1, disabled: count < 2 });
  // Named on its handle: the slider's `label` would also show a visible label.
  slider.element.querySelector('[role="slider"]')?.setAttribute('aria-label', 'Slide');
  slider.on('input', () => carousel.goTo(slider.getValue() - 1));
  const counter = document.createElement('span');
  counter.className = 'carousel-remote__counter';

  const reflect = (index: number) => {
    counter.textContent = `${index + 1} / ${count}`;
    if (slider.getValue() !== index + 1) slider.setValue(index + 1);
    for (const [control, off] of [[first, index <= 0], [previous, index <= 0], [next, index >= last], [end, index >= last]] as const) {
      if (off) control.disabled.disable(); else control.disabled.enable();
    }
  };
  const onChange = ({ index }: { index: number }) => reflect(index);
  carousel.on('change', onChange);
  reflect(carousel.getCurrentSlide());

  const element = document.createElement('div');
  element.className = 'carousel-remote';
  element.setAttribute('role', 'group');
  element.setAttribute('aria-label', 'Carousel remote');
  element.append(first.element, previous.element, slider.element, next.element, end.element, counter);
  return {
    element,
    destroy: () => {
      carousel.off('change', onChange);
      [first, previous, next, end].forEach(control => control.destroy());
      slider.destroy();
    },
  };
}
