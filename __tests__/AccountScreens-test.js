import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {
  Linking,
  Share,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Auth from '../api/AuthManager';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import {AccountButton} from '../components/AccountForm';

jest.mock('../styles/CommonStyles', () => ({CommonStyles: {}}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
}));
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
  public_id: 9414,
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
const preference = label =>
  tree.root
    .findAllByType(Switch)
    .find(node => node.props.accessibilityLabel === label);
const link = title =>
  tree.root
    .findAllByType(Text)
    .find(
      node =>
        node.props.accessibilityRole === 'link' &&
        node.props.children === title,
    );
const publicPreference = 'Activer la page publique de ma collection';
const adultPreference = 'Afficher le contenu adulte';
const publicUrl = 'https://www.bdovore.com/guest?user=9414';
const renderProfile = async () => {
  Auth.hasSession.mockReturnValue(true);
  await act(async () => {
    tree = renderer.create(
      <ProfileScreen navigation={navigation} onSessionEnded={jest.fn()} />,
    );
  });
};
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
  jest.restoreAllMocks();
});

it.each([
  ['la connexion', false],
  ['le profil', true],
])('ferme %s avec la croix', async (_screen, hasSession) => {
  Auth.hasSession.mockReturnValue(hasSession);
  await act(async () => {
    tree = renderer.create(<LoginScreen navigation={navigation} />);
  });
  const close = tree.root
    .findAllByType(TouchableOpacity)
    .find(node => node.props.accessibilityLabel === 'Fermer');
  await act(async () => close.props.onPress());
  expect(navigation.goBack).toHaveBeenCalledTimes(1);
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
it('récupère les pseudos avec seulement l’e-mail puis revient à la connexion', async () => {
  await act(async () => {
    tree = renderer.create(<LoginScreen navigation={navigation} />);
  });
  await press('Pseudo oublié');
  expect(field('Pseudo')).toBeUndefined();
  expect(field('Mot de passe')).toBeUndefined();
  await type('Adresse e-mail', ' shared@example.test ');
  Auth.request.mockResolvedValueOnce({
    message:
      'Si cette adresse est associée à un compte actif, un e-mail a été envoyé.',
  });
  await press('Recevoir mes pseudos');
  expect(Auth.request).toHaveBeenLastCalledWith('/apiauth/forgotlogin', {
    body: {email: 'shared@example.test'},
  });
  expect(button('Se connecter')).toBeDefined();
  expect(field('Code reçu par e-mail')).toBeUndefined();
});
it('conserve l’e-mail en passant de mot de passe oublié à pseudo oublié', async () => {
  await act(async () => {
    tree = renderer.create(<LoginScreen navigation={navigation} />);
  });
  await press('Mot de passe oublié');
  await type('Adresse e-mail', 'shared@example.test');
  await press('Pseudo oublié');
  expect(field('Adresse e-mail').props.value).toBe('shared@example.test');
  Auth.request.mockRejectedValueOnce(new Error('Réessayez plus tard.'));
  await press('Recevoir mes pseudos');
  expect(button('Recevoir mes pseudos')).toBeDefined();
  expect(field('Adresse e-mail').props.value).toBe('shared@example.test');
});
it('connexion impossible hors ligne sans fabriquer de faux jeton', async () => {
  NetInfo.fetch.mockResolvedValue({isConnected: false});
  await act(async () => {
    tree = renderer.create(<LoginScreen navigation={navigation} />);
  });
  await type('Pseudo ou e-mail', 'tom');
  await type('Mot de passe', 'secret');
  await press('Se connecter');
  expect(Auth.login).not.toHaveBeenCalled();
});

it('demande le pseudo lorsque le backend ne peut identifier le compte par e-mail', async () => {
  Auth.login.mockRejectedValueOnce(
    Object.assign(new Error('Précisez votre pseudo.'), {
      code: 'pseudo_required',
    }),
  );
  await act(async () => {
    tree = renderer.create(<LoginScreen navigation={navigation} />);
  });
  await type('Pseudo ou e-mail', 'shared@example.test');
  await type('Mot de passe', 'mot de passe');
  await press('Se connecter');
  expect(field('Pseudo de la collection')).toBeDefined();
  await type('Pseudo de la collection', 'collection-two');
  Auth.login.mockResolvedValueOnce({});
  await press('Se connecter');
  expect(Auth.login).toHaveBeenLastCalledWith(
    'shared@example.test',
    'mot de passe',
    expect.any(Function),
    'collection-two',
  );
});
it('profil hors ligne en lecture seule avec valeurs mises en cache', async () => {
  NetInfo.fetch.mockResolvedValue({isConnected: false});
  Auth.getUser.mockReturnValue({...user, open_collection: true});
  await renderProfile();
  expect(preference(publicPreference).props.value).toBe(true);
  expect(preference(publicPreference).props.disabled).toBe(true);
  expect(preference(adultPreference).props.disabled).toBe(true);
  expect(link('Changer mon e-mail').props.disabled).toBe(true);
  expect(Auth.refreshProfile).not.toHaveBeenCalled();
});
it('enregistre chaque préférence et partage uniquement la page publique activée', async () => {
  const share = jest.spyOn(Share, 'share').mockResolvedValue({});
  await renderProfile();
  expect(field('Localisation')).toBeUndefined();
  expect(field('Date de naissance (AAAA-MM-JJ)')).toBeUndefined();
  expect(preference('Recevoir la newsletter')).toBeUndefined();
  expect(preference('Carré magique manuel')).toBeUndefined();
  expect(button('Enregistrer mon profil')).toBeUndefined();
  expect(link(publicUrl)).toBeUndefined();

  let finishUpdate;
  Auth.updateProfile.mockReturnValueOnce(
    new Promise(resolve => {
      finishUpdate = resolve;
    }),
  );
  await act(async () => {
    preference(publicPreference).props.onValueChange(true);
  });
  expect(Auth.updateProfile).toHaveBeenLastCalledWith({open_collection: true});
  expect(preference(publicPreference).props.value).toBe(true);
  expect(button('Partager')).toBeUndefined();
  await act(async () => finishUpdate({...user, open_collection: true}));
  expect(link(publicUrl)).toBeDefined();
  await press('Partager');
  expect(share).toHaveBeenCalledWith({message: publicUrl});

  Auth.updateProfile.mockResolvedValueOnce({
    ...user,
    open_collection: true,
    explicit_content: true,
  });
  await act(async () => preference(adultPreference).props.onValueChange(true));
  expect(Auth.updateProfile).toHaveBeenLastCalledWith({explicit_content: true});
  expect(link(publicUrl)).toBeDefined();

  Auth.updateProfile.mockResolvedValueOnce({...user, explicit_content: true});
  await act(async () =>
    preference(publicPreference).props.onValueChange(false),
  );
  expect(Auth.updateProfile).toHaveBeenLastCalledWith({open_collection: false});
  expect(link(publicUrl)).toBeUndefined();
  expect(button('Partager')).toBeUndefined();
});
it('rétablit la préférence enregistrée et affiche l’erreur si la sauvegarde échoue', async () => {
  await renderProfile();
  Auth.updateProfile.mockRejectedValueOnce(new Error('Réessayez plus tard.'));
  await act(async () => preference(publicPreference).props.onValueChange(true));
  expect(preference(publicPreference).props.value).toBe(false);
  expect(preference(publicPreference).props.disabled).toBe(false);
  expect(link(publicUrl)).toBeUndefined();
  expect(
    tree.root
      .findAllByType(Text)
      .some(node => node.props.children === 'Réessayez plus tard.'),
  ).toBe(true);
});
it('ouvre le compte web pour suivre la procédure de suppression', async () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue();
  await renderProfile();
  await act(async () => link('Supprimer mon compte').props.onPress());
  expect(openURL).toHaveBeenCalledWith(
    'https://www.bdovore.com/compte?mobile=T',
  );
  expect(Auth.request).not.toHaveBeenCalled();
  await act(async () => link('Changer mon e-mail').props.onPress());
  expect(field('Nouvelle adresse e-mail').props.value).toBe(user.email);
});
