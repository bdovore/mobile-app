import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import CollectionScreen from '../screens/CollectionScreen';
import CollectionManager from '../api/CollectionManager';

jest.mock('../api/CollectionManager', () => ({
  CollectionGenres: {0: ['Tout', '', ' albums', ' séries']},
  getAlbums: jest.fn(() => []),
  getSeries: jest.fn(() => []),
  isCollectionEmpty: jest.fn(() => true),
  fetchCollection: jest.fn(),
}));
jest.mock('../api/APIManager', () => ({
  onConnected: jest.fn((navigation, success) => success()),
}));
jest.mock('../api/Helpers', () => ({
  sliceSortByDate: jest.fn(() => []),
  safeScrollToOffset: jest.fn(),
}));
jest.mock('../styles/CommonStyles', () => ({
  CommonStyles: {progressBarStyle: {color: 'red'}, iconStyle: {color: 'black'}},
}));
jest.mock('react-native-elements', () => ({
  ButtonGroup: 'ButtonGroup',
  ListItem: 'ListItem',
  SearchBar: 'SearchBar',
}));
jest.mock('react-native-progress', () => ({Bar: 'ProgressBar'}));
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('../components/AlbumItem', () => ({AlbumItem: 'AlbumItem'}));
jest.mock('../components/SerieItem', () => ({SerieItem: 'SerieItem'}));
jest.mock('../components/BottomSheet', () => ({BottomSheet: () => null}));
jest.mock('../components/Icon', () => ({Icon: 'Icon'}));

global.IS_REACT_ACT_ENVIRONMENT = true;

it('arrête le chargement et montre le refus de session même avec une collection vide', async () => {
  let focus;
  let completion;
  global.isConnected = true;
  global.autoSync = true;
  global.forceOffline = false;
  global.collectionFetched = false;
  global.token = 'test-session';
  CollectionManager.fetchCollection.mockImplementation(
    (navigation, callback) => {
      completion = callback;
    },
  );
  const navigation = {
    addListener: jest.fn((name, callback) => {
      focus = callback;
      return () => {};
    }),
    setOptions: jest.fn(),
  };
  let tree;
  await act(async () => {
    tree = renderer.create(
      <CollectionScreen
        route={{params: {collectionGenre: 0}}}
        navigation={navigation}
      />,
    );
  });
  await act(async () => {
    focus();
  });
  expect(tree.root.findAllByType('ProgressBar')).toHaveLength(1);
  const previousCompletion = completion;
  await act(async () => {
    completion({items: [], error: 'Votre session a expiré.', done: true}, 0);
  });
  expect(tree.root.findAllByType('ProgressBar')).toHaveLength(0);
  expect(
    tree.root
      .findAllByType(Text)
      .some(
        node =>
          node.props.accessibilityRole === 'alert' &&
          node.props.children === 'Votre session a expiré.',
      ),
  ).toBe(true);
  await act(async () => {
    focus();
  });
  expect(CollectionManager.fetchCollection).toHaveBeenCalledTimes(2);
  await act(async () => {
    previousCompletion({items: [], error: 'Ancienne erreur.', done: true}, 0);
  });
  expect(tree.root.findAllByType('ProgressBar')).toHaveLength(1);
  await act(async () => {
    tree.unmount();
  });
});
