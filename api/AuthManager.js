import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {Platform} from 'react-native';
import {bdovoreBaseURL} from './Config';

const service = 'com.bdovore.account.v2';
let session = null;
let initialization = null;
let generation = 0;
let secureWrites = Promise.resolve();

function secureWrite(callback) {
  const operation = secureWrites.then(callback);
  secureWrites = operation.catch(() => {});
  return operation;
}

export class AccountError extends Error {
  constructor(message, code = 'network_error', status = 0) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function isSessionToken(token) {
  return typeof token === 'string' && /^bdo2_[a-f0-9]{64}$/.test(token);
}

export function getToken() {
  return session?.token ?? null;
}
export function getUser() {
  return session?.user ?? null;
}
export function hasSession() {
  return isSessionToken(getToken());
}

function applySession(value) {
  session = value;
  global.token = value?.token ?? null;
  global.currentUser = value?.user ?? null;
  if (value?.user) {
    global.login = value.user.username;
    global.openCollection = value.user.open_collection;
    global.explicitContent = value.user.explicit_content;
  }
}

export function initialize() {
  if (initialization) {
    return initialization;
  }
  initialization = (async () => {
    // Read only the old identity to retain ownership of the local collection.
    const values = Object.fromEntries(
      await AsyncStorage.multiGet([
        'token',
        'login',
        'collectionOwnerId',
        'secureAuthMigrated',
      ]),
    );
    const legacyMatch =
      typeof values.token === 'string' &&
      /^([1-9][0-9]*)-[a-f0-9]+$/.exec(values.token);
    if (!values.collectionOwnerId && legacyMatch) {
      await AsyncStorage.setItem('collectionOwnerId', legacyMatch[1]);
    }
    global.collectionOwnerId =
      Number(values.collectionOwnerId ?? legacyMatch?.[1]) || null;
    global.collectionOwnerLogin = values.login || null;
    // No legacy password is read or used for automatic login.
    await AsyncStorage.multiRemove(['passwd', 'token']);
    global.passwd = undefined;
    // iOS Keychain may survive an uninstall. An absent installation marker must
    // not restore an account from a previous installation.
    if (values.secureAuthMigrated !== '1') {
      await Keychain.resetGenericPassword({service});
      await AsyncStorage.setItem('secureAuthMigrated', '1');
      applySession(null);
      return;
    }
    const saved = await Keychain.getGenericPassword({service});
    if (saved) {
      try {
        const value = JSON.parse(saved.password);
        if (
          isSessionToken(value.token) &&
          Number.isInteger(value.user?.user_id) &&
          value.user.user_id > 0 &&
          (!global.collectionOwnerId ||
            global.collectionOwnerId === value.user.user_id)
        ) {
          // Expiry is checked online by the server. Offline cached data remains available.
          if (Date.parse(value.expires_at) > Date.now()) {
            applySession(value);
            global.serverTimestamp = value.collection_timestamp;
            return;
          }
        }
      } catch (_) {
        /* Corrupt secure entry: require a new login. */
      }
      await Keychain.resetGenericPassword({service});
    }
    applySession(null);
  })().catch(() => {
    applySession(null);
    initialization = null;
    throw new AccountError(
      'Le stockage sécurisé est indisponible. Réessayez.',
      'secure_storage_unavailable',
    );
  });
  return initialization;
}

async function persist(value, expectedGeneration = generation) {
  return secureWrite(async () => {
    if (expectedGeneration !== generation) {
      throw new AccountError('La session a changé.', 'session_changed');
    }
    const result = await Keychain.setGenericPassword(
      'bdovore',
      JSON.stringify(value),
      {
        service,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      },
    );
    if (!result) {
      throw new AccountError(
        'Impossible de sécuriser votre session.',
        'secure_storage_unavailable',
      );
    }
    if (expectedGeneration !== generation) {
      throw new AccountError('La session a changé.', 'session_changed');
    }
    applySession(value);
  });
}

export async function clearSession(expectedToken = null) {
  if (expectedToken && getToken() !== expectedToken) {
    return;
  }
  generation += 1;
  applySession(null);
  await secureWrite(() => Keychain.resetGenericPassword({service}));
  await AsyncStorage.multiRemove(['passwd', 'token']);
}

export async function request(
  path,
  {method = 'POST', body = {}, authenticated = false} = {},
) {
  await initialize();
  const token = getToken();
  if (authenticated && !isSessionToken(token)) {
    throw new AccountError('Veuillez vous connecter.', 'invalid_session', 401);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let response;
  try {
    response = await fetch(bdovoreBaseURL + path, {
      method,
      credentials: 'omit',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(authenticated ? {Authorization: 'Bearer ' + token} : {}),
      },
      ...(method === 'GET' ? {} : {body: JSON.stringify(body)}),
      signal: controller.signal,
    });
    const payload = await response.json();
    if (!response.ok || payload.error) {
      const code = payload.error?.code || 'server_error';
      if (authenticated && code === 'invalid_session') {
        await clearSession(token);
      }
      throw new AccountError(
        payload.error?.message || 'Le service est temporairement indisponible.',
        code,
        response.status,
      );
    }
    if (authenticated && getToken() !== token) {
      throw new AccountError(
        'La session a changé. Réessayez.',
        'session_changed',
      );
    }
    return payload.data;
  } catch (error) {
    if (error instanceof AccountError) {
      throw error;
    }
    throw new AccountError(
      'Connexion au serveur impossible. Vérifiez votre accès Internet.',
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function login(username, password, onAccountChange, pseudo = '') {
  await initialize();
  const started = generation;
  const result = await request('/apiauth/login', {
    body: {
      username,
      password,
      device_name: 'BDovore ' + Platform.OS,
      ...(pseudo ? {pseudo} : {}),
    },
  });
  if (started !== generation) {
    throw new AccountError('La session a changé.', 'session_changed');
  }
  if (
    !isSessionToken(result?.token) ||
    !Number.isInteger(result?.user?.user_id) ||
    result.user.user_id < 1 ||
    !(Date.parse(result.expires_at) > Date.now())
  ) {
    throw new AccountError(
      'Réponse de connexion invalide.',
      'invalid_response',
    );
  }
  const previousId = global.collectionOwnerId;
  const changed = previousId
    ? previousId !== result.user.user_id
    : global.collectionOwnerLogin &&
      global.collectionOwnerLogin.toLowerCase() !==
        result.user.username.toLowerCase();
  if (changed) {
    if (!onAccountChange) {
      throw new AccountError(
        'Le compte de la collection locale est différent.',
        'account_changed',
      );
    }
    await onAccountChange();
    global.localTimestamp = null;
    await AsyncStorage.multiRemove(['localTimestamp', 'collectionFetched']);
    global.collectionFetched = false;
  }
  if (started !== generation) {
    throw new AccountError('La session a changé.', 'session_changed');
  }
  generation += 1;
  await persist(result);
  global.collectionOwnerId = result.user.user_id;
  global.collectionOwnerLogin = result.user.username;
  global.serverTimestamp = result.collection_timestamp;
  global.forceOffline = false;
  await AsyncStorage.multiSet([
    ['collectionOwnerId', String(result.user.user_id)],
    ['login', result.user.username],
    ['forceOffline', '0'],
  ]);
  return result;
}

export async function refreshProfile() {
  const token = getToken();
  const started = generation;
  const user = await request('/apicompte/me', {
    method: 'GET',
    authenticated: true,
  });
  if (token !== getToken() || started !== generation) {
    throw new AccountError('La session a changé.', 'session_changed');
  }
  await persist({...session, user});
  return user;
}

export async function updateProfile(body) {
  const started = generation;
  const user = await request('/apicompte/update', {body, authenticated: true});
  await persist({...session, user}, started);
  return user;
}

export async function confirmEmail(body) {
  const started = generation;
  const user = await request('/apicompte/confirmemail', {
    body,
    authenticated: true,
  });
  await persist({...session, user}, started);
  return user;
}

export async function logout() {
  const token = getToken();
  const started = generation;
  let remoteError;
  try {
    if (hasSession()) {
      if (global.forceOffline) {
        throw new AccountError('Mode hors ligne activé.');
      }
      await request('/apiauth/logout', {authenticated: true});
    }
  } catch (error) {
    remoteError = error;
  } finally {
    if (started === generation) {
      await clearSession(token);
    }
  }
  if (remoteError && remoteError.code !== 'invalid_session') {
    throw new AccountError(
      'Déconnexion sur cet appareil effectuée. Le serveur était injoignable ; la session distante expirera automatiquement.',
      'logout_offline',
    );
  }
}

export async function openWeb(body) {
  const result = await request('/apiauth/webticket', {
    body,
    authenticated: true,
  });
  const expected = bdovoreBaseURL + '/apiauth/openweb?ticket=';
  if (
    typeof result?.url !== 'string' ||
    !result.url.startsWith(expected) ||
    !/^[a-f0-9]{64}$/.test(result.url.slice(expected.length))
  ) {
    throw new AccountError(
      'Lien de contribution invalide.',
      'invalid_response',
    );
  }
  return result.url;
}
