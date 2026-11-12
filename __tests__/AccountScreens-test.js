import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {TextInput} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Auth from '../api/AuthManager';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import {AccountButton} from '../components/AccountForm';

jest.mock('../styles/CommonStyles', () => ({CommonStyles: {}}));
jest.mock('../api/CollectionManager', () => ({clearDatabase: jest.fn()}));
jest.mock('../api/APIManager', () => ({fetchSponsors: jest.fn()}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));
jest.mock('@react-native-community/netinfo', () => ({fetch: jest.fn()}));
jest.mock('../api/AuthManager', () => ({
  initialize: jest.fn(),
  hasSession: jest.fn(),
  getUser: jest.fn(),
  login: jest.fn(),
  request: jest.fn(),
  refreshProfile: jest.fn(),
  updateProfile: jest.fn(),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;
const user = {
  user_id: 7,
  username: 'tom',
  email: 'tom@example.test',
  location: 'Paris',
  birthday: '',
  open_collection: false,
  explicit_content: false,
  newsletter: false,
  square_type: 0,
};
let tree;
let navigation;
const button = title =>
  tree.root
    .findAllByType(AccountButton)
    .find(node => node.props.title === title);
const field = label =>
  tree.root
    .findAllByType(TextInput)
    .find(node => node.props.accessibilityLabel === label);
const type = async (label, value) =>
  act(async () => field(label).props.onChangeText(value));
const press = async title => act(async () => button(title).props.onPress());
beforeEach(() => {
  jest.clearAllMocks();
  tree = null;
  global.forceOffline = false;
  global.collectionOwnerLogin = null;
  global.collectionFetched = false;
  navigation = {
    canGoBack: () => true,
    goBack: jest.fn(),
    navigate: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  };
  Auth.initialize.mockResolvedValue();
  Auth.hasSession.mockReturnValue(false);
  Auth.getUser.mockReturnValue(user);
  Auth.refreshProfile.mockResolvedValue(user);
  Auth.updateProfile.mockResolvedValue(user);
  NetInfo.fetch.mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
  });
});
afterEach(async () => {
  if (tree) {
    await act(async () => tree.unmount());
  }
});

it('inscription et confirmation sont entièrement natives', async () => {
  await act(async () => {
    tree = renderer.create(<LoginScreen navigation={navigation} />);
  });
  await press('Créer un compte');
  await type('Pseudo', 'nouveau');
  await type('Adresse e-mail', 'new@example.test');
  await type('Mot de passe', 'une phrase de passe longue');
  await type('Confirmer le mot de passe', 'une phrase de passe longue');
  Auth.request.mockResolvedValueOnce({challenge_id: 'challenge'});
  await press('Créer mon compte');
  expect(Auth.request).toHaveBeenLastCalledWith(
    '/apiauth/register',
    expect.objectContaining({
      body: expect.objectContaining({username: 'nouveau'}),
    }),
  );
  expect(field('Code reçu par e-mail')).toBeDefined();
  expect(field('Mot de passe')).toBeUndefined();
  await type('Code reçu par e-mail', '12345678');
  Auth.request.mockResolvedValueOnce({});
  await press('Confirmer mon compte');
  expect(Auth.request).toHaveBeenLastCalledWith('/apiauth/verify', {
    body: {challenge_id: 'challenge', code: '12345678'},
  });
  expect(button('Se connecter')).toBeDefined();
  expect(field('Mot de passe').props.value).toBe('');
});
it('refuse une confirmation de mot de passe différente avant l’envoi', async () => {
  await act(async () => {
    tree = renderer.create(<LoginScreen navigation={navigation} />);
  });
  await press('Créer un compte');
  await type('Mot de passe', 'une phrase de passe longue');
  await type('Confirmer le mot de passe', 'différent');
  await press('Créer mon compte');
  expect(Auth.request).not.toHaveBeenCalled();
});
it('connexion impossible hors ligne sans fabriquer de faux jeton', async () => {
  NetInfo.fetch.mockResolvedValue({isConnected: false});
  await act(async () => {
    tree = renderer.create(<LoginScreen navigation={navigation} />);
  });
  await type('Pseudo', 'tom');
  await type('Mot de passe', 'secret');
  await press('Se connecter');
  expect(Auth.login).not.toHaveBeenCalled();
});
it('profil hors ligne en lecture seule avec valeurs mises en cache', async () => {
  NetInfo.fetch.mockResolvedValue({isConnected: false});
  await act(async () => {
    tree = renderer.create(
      <ProfileScreen navigation={navigation} onSessionEnded={jest.fn()} />,
    );
  });
  expect(field('Localisation').props.value).toBe('Paris');
  expect(field('Localisation').props.editable).toBe(false);
  expect(button('Enregistrer mon profil').props.disabled).toBe(true);
  expect(Auth.refreshProfile).not.toHaveBeenCalled();
});
it('modifie le profil natif en envoyant uniquement les champs autorisés', async () => {
  Auth.hasSession.mockReturnValue(true);
  await act(async () => {
    tree = renderer.create(
      <ProfileScreen navigation={navigation} onSessionEnded={jest.fn()} />,
    );
  });
  await type('Localisation', 'Lyon');
  await press('Enregistrer mon profil');
  expect(Auth.updateProfile).toHaveBeenCalledWith({
    location: 'Lyon',
    birthday: '',
    open_collection: false,
    explicit_content: false,
    newsletter: false,
    square_type: 0,
  });
});
