jest.mock('react-native-inappbrowser-reborn', () => ({InAppBrowser: {}}));
jest.mock('../api/Helpers', () => ({}));
jest.mock('../api/SettingsManager', () => ({
  getConnectionStatus: callback => callback(),
}));
jest.mock('../api/AuthManager', () => ({
  initialize: jest.fn(async () => {}),
  getToken: jest.fn(),
  hasSession: jest.fn(),
  clearSession: jest.fn(),
  AccountError: class extends Error {
    constructor(message, code) {
      super(message);
      this.code = code;
    }
  },
}));
const auth = require('../api/AuthManager');
const api = require('../api/APIManager');
const tick = () => new Promise(resolve => setImmediate(resolve));
let token;
beforeEach(() => {
  jest.clearAllMocks();
  token = 'test-session';
  global.token = token;
  global.isConnected = true;
  global.forceOffline = false;
  auth.getToken.mockImplementation(() => token);
  auth.hasSession.mockImplementation(() => !!token);
  auth.clearSession.mockImplementation(async () => {
    token = null;
  });
  global.fetch = jest.fn();
});
it('signale la session invalidée par une requête concurrente au lieu de perdre le callback', async () => {
  fetch.mockImplementation(async () => {
    token = null;
    return {status: 200, ok: true, json: async () => ({data: []})};
  });
  const callback = jest.fn();
  api.fetchCollectionData(
    'Userserie',
    {navigation: {navigate: jest.fn()}},
    callback,
  );
  await tick();
  await tick();
  expect(callback).toHaveBeenCalledWith(
    expect.objectContaining({done: true, items: [], error: expect.any(String)}),
  );
  expect(callback.mock.calls[0][0].error).not.toBe('');
});
it('un refus 401 rend la main et dirige vers la connexion', async () => {
  fetch.mockResolvedValue({status: 401});
  const callback = jest.fn(),
    navigate = jest.fn();
  api.fetchCollectionData('Userserie', {navigation: {navigate}}, callback);
  await tick();
  await tick();
  expect(navigate).toHaveBeenCalledWith('Login');
  expect(callback).toHaveBeenCalledWith(
    expect.objectContaining({done: true, error: expect.any(String)}),
  );
});
it('une page suivante en échec termine aussi le chargement', async () => {
  fetch.mockResolvedValueOnce({
    status: 200,
    ok: true,
    json: async () => ({data: [], nbserie: 1500}),
  });
  fetch.mockRejectedValueOnce(new Error('Téléchargement interrompu.'));
  const callback = jest.fn();
  api.fetchCollectionData('Userserie', null, callback);
  await tick();
  await tick();
  await tick();
  expect(callback).toHaveBeenLastCalledWith(
    expect.objectContaining({done: true, error: 'Téléchargement interrompu.'}),
  );
});
