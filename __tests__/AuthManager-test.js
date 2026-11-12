jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map();
  return {
    values,
    multiGet: jest.fn(async keys =>
      keys.map(key => [key, values.get(key) ?? null]),
    ),
    multiRemove: jest.fn(async keys => keys.forEach(key => values.delete(key))),
    multiSet: jest.fn(async pairs =>
      pairs.forEach(([key, value]) => values.set(key, value)),
    ),
    setItem: jest.fn(async (key, value) => values.set(key, value)),
  };
});
jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only'},
  getGenericPassword: jest.fn(async () => false),
  setGenericPassword: jest.fn(async () => ({service: 'test'})),
  resetGenericPassword: jest.fn(async () => true),
}));

const storage = require('@react-native-async-storage/async-storage');
const keychain = require('react-native-keychain');
let auth;
const user = {
  user_id: 7,
  public_id: 9414,
  username: 'tom',
  email: 'tom@example.test',
  open_collection: true,
  explicit_content: false,
};
const token = 'bdo2_' + 'a'.repeat(64);
const result = (id = 7, letter = 'a') => ({
  token: 'bdo2_' + letter.repeat(64),
  expires_at: '2099-01-01T00:00:00Z',
  collection_timestamp: '2026-01-01 12:00:00',
  user: {...user, user_id: id, username: id === 7 ? 'tom' : 'autre'},
});
const reply = data => ({
  ok: true,
  status: 200,
  json: async () => ({data, error: null}),
});
const failure = (code, status = 401) => ({
  ok: false,
  status,
  json: async () => ({data: null, error: {code, message: 'Erreur attendue'}}),
});
const deferred = () => {
  let resolve;
  const promise = new Promise(done => {
    resolve = done;
  });
  return {promise, resolve};
};

beforeEach(() => {
  jest.clearAllMocks();
  storage.values.clear();
  keychain.getGenericPassword.mockReset().mockResolvedValue(false);
  keychain.setGenericPassword.mockReset().mockResolvedValue({service: 'test'});
  keychain.resetGenericPassword.mockReset().mockResolvedValue(true);
  global.fetch = jest.fn();
  for (const name of [
    'token',
    'currentUser',
    'collectionOwnerId',
    'collectionOwnerLogin',
    'login',
    'passwd',
    'localTimestamp',
    'serverTimestamp',
    'collectionFetched',
    'forceOffline',
  ]) {
    delete global[name];
  }
  jest.isolateModules(() => {
    auth = require('../api/AuthManager');
  });
});

it('migre les secrets historiques sans effacer la collection', async () => {
  storage.values.set('token', '7-abcdef1234');
  storage.values.set('passwd', 'secret');
  storage.values.set('login', 'tom');
  storage.values.set('localTimestamp', 'preserved');
  await auth.initialize();
  expect(storage.values.has('passwd')).toBe(false);
  expect(storage.values.has('token')).toBe(false);
  expect(storage.values.get('localTimestamp')).toBe('preserved');
  expect(global.collectionOwnerId).toBe(7);
  expect(auth.hasSession()).toBe(false);
  expect(global.passwd).toBeUndefined();
});
it('ne restaure pas un trousseau provenant d’une installation précédente', async () => {
  keychain.getGenericPassword.mockResolvedValue({
    password: JSON.stringify(result()),
  });
  await auth.initialize();
  expect(keychain.resetGenericPassword).toHaveBeenCalled();
  expect(keychain.getGenericPassword).not.toHaveBeenCalled();
  expect(auth.hasSession()).toBe(false);
  expect(storage.values.get('secureAuthMigrated')).toBe('1');
});
it('restaure une session du stockage sécurisé', async () => {
  storage.values.set('secureAuthMigrated', '1');
  keychain.getGenericPassword.mockResolvedValue({
    password: JSON.stringify(result()),
  });
  await auth.initialize();
  expect(auth.getToken()).toBe(token);
  expect(auth.getUser().user_id).toBe(7);
  expect(global.serverTimestamp).toBe(result().collection_timestamp);
});
it('refuse une session expirée', async () => {
  storage.values.set('secureAuthMigrated', '1');
  keychain.getGenericPassword.mockResolvedValue({
    password: JSON.stringify({...result(), expires_at: '2020-01-01'}),
  });
  await auth.initialize();
  expect(auth.hasSession()).toBe(false);
});

it('refuse de restaurer une session qui ne correspond pas au cache local', async () => {
  storage.values.set('secureAuthMigrated', '1');
  storage.values.set('collectionOwnerId', '3');
  keychain.getGenericPassword.mockResolvedValue({
    password: JSON.stringify(result()),
  });
  await auth.initialize();
  expect(auth.hasSession()).toBe(false);
  expect(global.collectionOwnerId).toBe(3);
});

it('une connexion tardive ne restaure pas une session après déconnexion', async () => {
  await auth.initialize();
  const delayed = deferred();
  fetch.mockReturnValueOnce(delayed.promise);
  const pending = auth.login('tom', 'secret');
  await new Promise(resolve => setImmediate(resolve));
  await auth.logout();
  delayed.resolve(reply(result()));
  await expect(pending).rejects.toMatchObject({code: 'session_changed'});
  expect(auth.hasSession()).toBe(false);
});
it('stocke uniquement le jeton et le profil dans le trousseau après connexion', async () => {
  fetch.mockResolvedValue(reply(result()));
  await auth.login('tom', 'un secret');
  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe('https://www.bdovore.com/apiauth/login');
  expect(url).not.toContain('secret');
  expect(options.credentials).toBe('omit');
  expect(options.headers.Authorization).toBeUndefined();
  expect(JSON.parse(options.body).password).toBe('un secret');
  const saved = JSON.parse(keychain.setGenericPassword.mock.calls[0][1]);
  expect(saved.token).toBe(token);
  expect(JSON.stringify(saved)).not.toContain('un secret');
  expect(storage.values.has('passwd')).toBe(false);
  expect(storage.values.has('token')).toBe(false);
});
it('conserve le cache lors de la reconnexion au même compte', async () => {
  storage.values.set('collectionOwnerId', '7');
  storage.values.set('login', 'tom');
  storage.values.set('localTimestamp', 'preserved');
  fetch.mockResolvedValue(reply(result()));
  const reset = jest.fn();
  await auth.login('tom', 'secret', reset);
  expect(reset).not.toHaveBeenCalled();
  expect(storage.values.get('localTimestamp')).toBe('preserved');
});
it('efface le cache d’un autre compte avant de rendre sa session disponible', async () => {
  storage.values.set('collectionOwnerId', '3');
  storage.values.set('login', 'ancien');
  storage.values.set('localTimestamp', 'old');
  fetch.mockResolvedValue(reply(result()));
  const reset = jest.fn(async () => {
    expect(auth.hasSession()).toBe(false);
  });
  await auth.login('tom', 'secret', reset);
  expect(reset).toHaveBeenCalledTimes(1);
  expect(storage.values.has('localTimestamp')).toBe(false);
  expect(global.collectionOwnerId).toBe(7);
});
it('bloque un changement de compte sans nettoyage du cache', async () => {
  storage.values.set('collectionOwnerId', '3');
  fetch.mockResolvedValue(reply(result()));
  await expect(auth.login('tom', 'secret')).rejects.toMatchObject({
    code: 'account_changed',
  });
  expect(auth.hasSession()).toBe(false);
});
it('ne conserve pas de session si l’écriture sécurisée échoue', async () => {
  fetch.mockResolvedValue(reply(result()));
  keychain.setGenericPassword.mockResolvedValue(false);
  await expect(auth.login('tom', 'secret')).rejects.toMatchObject({
    code: 'secure_storage_unavailable',
  });
  expect(auth.hasSession()).toBe(false);
});
it('utilise Bearer et invalide une session refusée par le serveur', async () => {
  fetch.mockResolvedValueOnce(reply(result()));
  await auth.login('tom', 'secret');
  fetch.mockResolvedValueOnce(failure('invalid_session'));
  await expect(auth.refreshProfile()).rejects.toMatchObject({
    code: 'invalid_session',
  });
  expect(fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer ' + token);
  expect(auth.hasSession()).toBe(false);
});
it('un mauvais mot de passe de confirmation ne déconnecte pas la session', async () => {
  fetch.mockResolvedValueOnce(reply(result()));
  await auth.login('tom', 'secret');
  fetch.mockResolvedValueOnce(failure('invalid_credentials'));
  await expect(
    auth.request('/apicompte/password', {authenticated: true, body: {}}),
  ).rejects.toMatchObject({code: 'invalid_credentials'});
  expect(auth.getToken()).toBe(token);
});
it('une indisponibilité du backend ne détruit pas la session', async () => {
  fetch.mockResolvedValueOnce(reply(result()));
  await auth.login('tom', 'secret');
  fetch.mockResolvedValueOnce(failure('api_unavailable', 503));
  await expect(auth.refreshProfile()).rejects.toMatchObject({
    code: 'api_unavailable',
  });
  expect(auth.getToken()).toBe(token);
});
it('une réponse 401 ancienne ne déconnecte pas la nouvelle session', async () => {
  fetch.mockResolvedValueOnce(reply(result()));
  await auth.login('tom', 'secret');
  const delayed = deferred();
  fetch.mockReturnValueOnce(delayed.promise);
  const pending = auth.refreshProfile();
  await new Promise(resolve => setImmediate(resolve));
  fetch.mockResolvedValueOnce(reply(result(7, 'b')));
  await auth.login('tom', 'secret');
  delayed.resolve(failure('invalid_session'));
  await expect(pending).rejects.toMatchObject({code: 'invalid_session'});
  expect(auth.getToken()).toBe(result(7, 'b').token);
});
it('une réponse de profil tardive ne restaure pas une session déconnectée', async () => {
  fetch.mockResolvedValueOnce(reply(result()));
  await auth.login('tom', 'secret');
  const delayed = deferred();
  fetch.mockReturnValueOnce(delayed.promise);
  const pending = auth.refreshProfile();
  await new Promise(resolve => setImmediate(resolve));
  await auth.clearSession();
  delayed.resolve(reply(user));
  await expect(pending).rejects.toMatchObject({code: 'session_changed'});
  expect(auth.hasSession()).toBe(false);
});
it('déconnexion hors ligne : efface les accès locaux et explique la limite distante', async () => {
  fetch.mockResolvedValueOnce(reply(result()));
  await auth.login('tom', 'secret');
  fetch.mockRejectedValueOnce(new Error('offline'));
  await expect(auth.logout()).rejects.toMatchObject({code: 'logout_offline'});
  expect(auth.hasSession()).toBe(false);
});
it('ouvre uniquement les tickets web temporaires du domaine BDovore', async () => {
  fetch.mockResolvedValueOnce(reply(result()));
  await auth.login('tom', 'secret');
  const url =
    'https://www.bdovore.com/apiauth/openweb?ticket=' + 'c'.repeat(64);
  fetch.mockResolvedValueOnce(reply({url}));
  expect(await auth.openWeb({type: 'album'})).toBe(url);
  fetch.mockResolvedValueOnce(reply({url: 'https://evil.test/'}));
  await expect(auth.openWeb({})).rejects.toMatchObject({
    code: 'invalid_response',
  });
});
