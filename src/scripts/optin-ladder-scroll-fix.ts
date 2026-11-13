/**
 * TEMPORARY: remove after the ENgrid update in January.
 *
 * Mirrors the fix in ENgrid's OptInLadder (fix/prevent-scroll-anchoring):
 * the Opt-In Ladder iFrame collapses to 0px and regrows between steps, and the
 * browser's scroll anchoring then shifts the parent page down to the content
 * below the iFrame. Disabling scroll anchoring keeps the page in place.
 *
 * Must run after `new OptInLadder()`, which injects the iFrame synchronously.
 */
export class OptInLadderScrollFix {
  constructor() {
    if (!document.querySelector(".opt-in-ladder-iframe")) return;
    document.documentElement.style.overflowAnchor = "none";
  }
}
