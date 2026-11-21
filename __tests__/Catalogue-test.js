import React from 'react';
import { act, create } from 'react-test-renderer';
import { catalogueRequest } from '../api/APIManager';
import { useCatalogue } from '../api/useCatalogue';

jest.mock('../api/APIManager', () => ({ catalogueRequest: jest.fn() }));

let latest, tree;
function Probe({ params }) {
  latest = useCatalogue(params);
  return null;
}
async function render(params) {
  await act(async () => {
    if (tree) tree.update(<Probe params={params} />);
    else tree = create(<Probe params={params} />);
  });
}
beforeEach(() => {
  jest.useFakeTimers();
  catalogueRequest.mockReset();
});
afterEach(async () => {
  await act(async () => tree?.unmount());
  tree = null;
  jest.useRealTimers();
});
it('regroupe la saisie et écarte une réponse dépassée', async () => {
  let finish;
  catalogueRequest.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  await render({ q: 'bl', scope: 'all' });
  await act(async () => jest.advanceTimersByTime(299));
  expect(catalogueRequest).not.toHaveBeenCalled();
  await render({ q: 'bla', scope: 'all' });
  await act(async () => jest.advanceTimersByTime(300));
  const signal = catalogueRequest.mock.calls[0][2];
  await render({ q: 'black', scope: 'all' });
  expect(signal.aborted).toBe(true);
  const page = { groups: { ser: { rows: [{ id: 2 }], more: false } } };
  catalogueRequest.mockResolvedValueOnce(page);
  await act(async () => jest.advanceTimersByTime(300));
  await act(async () => finish({ groups: {} }));
  expect(latest.page).toEqual(page);
});
it('recherche une édition exacte sans lancer la recherche textuelle', async () => {
  catalogueRequest.mockResolvedValue([{ ID_EDITION: 12, TITRE_TOME: 'Album' }]);
  await render({ q: '978-2205056978', scope: 'all' });
  await act(async () => jest.advanceTimersByTime(0));
  expect(catalogueRequest).toHaveBeenCalledTimes(1);
  expect(catalogueRequest).toHaveBeenCalledWith('Album', { EAN: '9782205056978', mode: 2 }, expect.anything());
  expect(latest.page.groups.alb.rows[0].edition.ID_EDITION).toBe(12);
});
it('ajoute une page à son groupe en conservant les autres', async () => {
  const author = { rows: [{ id: 1 }], more: false };
  catalogueRequest.mockResolvedValueOnce({ groups: { aut: author, alb: { rows: [{ id: 2 }], more: true } } });
  await render({ scope: 'all', q: 'Tintin' });
  await act(async () => jest.advanceTimersByTime(300));
  catalogueRequest.mockResolvedValueOnce({ groups: { alb: { rows: [{ id: 3 }], more: false } } });
  await act(async () => latest.load(1, 'alb'));
  expect(latest.page.groups).toEqual({ aut: author, alb: { rows: [{ id: 2 }, { id: 3 }], more: false } });
});
