import CollectionManager from '../api/CollectionManager';

jest.mock('../api/APIManager', () => ({}));
jest.mock('../api/Helpers', () => ({}));
jest.mock('realm', () => ({
  open: jest.fn(() => Promise.resolve({close: jest.fn()})),
}));

beforeEach(() => {
  jest.spyOn(CollectionManager, 'clearDatabase').mockImplementation(() => {});
  jest.spyOn(CollectionManager, 'fetchSeries').mockImplementation(() => {});
  jest.spyOn(CollectionManager, 'fetchAlbums').mockImplementation(() => {});
  jest.spyOn(CollectionManager, 'fetchWishlist').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

it('un refus de session sur les séries termine le téléchargement sans lancer les albums', () => {
  const callback = jest.fn();
  CollectionManager.fetchCollection({}, callback);
  const failure = {items: [], done: true, error: 'Votre session a expiré.'};
  CollectionManager.fetchSeries.mock.calls[0][1](failure);
  expect(callback).toHaveBeenCalledWith(failure, 0);
  CollectionManager.fetchSeries.mock.calls[0][1]({
    items: [],
    done: true,
    error: '',
  });
  expect(callback).toHaveBeenCalledTimes(1);
  expect(CollectionManager.fetchAlbums).not.toHaveBeenCalled();
});
it('un refus sur les albums empêche le lancement des envies', () => {
  const callback = jest.fn();
  CollectionManager.fetchCollection({}, callback);
  CollectionManager.fetchSeries.mock.calls[0][1]({
    items: [],
    done: true,
    error: '',
  });
  const failure = {items: [], done: true, error: 'Connexion requise.'};
  CollectionManager.fetchAlbums.mock.calls[0][1](failure);
  expect(callback).toHaveBeenLastCalledWith(failure, 1);
  expect(CollectionManager.fetchWishlist).not.toHaveBeenCalled();
});
it('une synchronisation valide enchaîne toujours les trois étapes', () => {
  const callback = jest.fn();
  CollectionManager.fetchCollection({}, callback);
  const result = {items: [], done: true, error: ''};
  CollectionManager.fetchSeries.mock.calls[0][1](result);
  CollectionManager.fetchAlbums.mock.calls[0][1](result);
  CollectionManager.fetchWishlist.mock.calls[0][1](result);
  expect(callback.mock.calls.map(call => call[1])).toEqual([0, 1, 2]);
});
