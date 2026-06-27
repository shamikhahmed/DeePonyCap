// @ts-check
/** Click bottom nav or desktop sidebar tab (whichever is active). */
function navTab(page, tab) {
  return page.locator(
    `#cap-nav-sidebar .cap-side-btn[data-tab="${tab}"], nav.nav .nav-btn[data-tab="${tab}"]`,
  ).first();
}

module.exports = { navTab };
