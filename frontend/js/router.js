/** Hash router: #/overview, #/farmers, #/verify, #/about, with the scenario in the query so links are shareable. */
export const VIEWS = ['overview', 'farmers', 'verify', 'about', 'demo'];

export function current() {
  const [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  return { view: VIEWS.includes(path) ? path : 'overview', query: new URLSearchParams(query) };
}

/** Update the address bar without adding history entries or firing hashchange. */
export function sync(view, state) {
  history.replaceState(null, '', '#/' + view + '?' + new URLSearchParams(state));
}

export function onRoute(callback) {
  addEventListener('hashchange', () => callback(current().view));
}
