/** Lets a code block's full screen button toggle it into a viewport-filling overlay. */

const FULLSCREEN_BUTTON_SELECTOR = 'div[class*="language-"] > button.fullscreen';

/** Set on the code block while it fills the viewport. */
const FULLSCREEN_BLOCK_CLASS = "is-fullscreen";

/** Set on <html> while any code block fills the viewport, to stop the page behind it from scrolling. */
const FULLSCREEN_ROOT_CLASS = "has-fullscreen-code";

export interface FullscreenCode {
  /** Returns the page to normal if a code block is currently full screen. */
  exit(): void;
}

export function setupFullscreenCode(): FullscreenCode {
  let fullscreenBlock: HTMLElement | null = null;

  function exit(): void {
    if (fullscreenBlock === null) {
      return;
    }
    fullscreenBlock.classList.remove(FULLSCREEN_BLOCK_CLASS);
    document.documentElement.classList.remove(FULLSCREEN_ROOT_CLASS);
    fullscreenBlock = null;
  }

  function enter(block: HTMLElement): void {
    block.classList.add(FULLSCREEN_BLOCK_CLASS);
    document.documentElement.classList.add(FULLSCREEN_ROOT_CLASS);
    fullscreenBlock = block;
  }

  window.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.matches(FULLSCREEN_BUTTON_SELECTOR)) {
      return;
    }
    const block = target.parentElement;
    if (block === null) {
      throw new Error("A full screen button must sit inside its code block");
    }
    const wasFullscreen = block === fullscreenBlock;
    exit();
    if (!wasFullscreen) {
      enter(block);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      exit();
    }
  });

  return { exit };
}
