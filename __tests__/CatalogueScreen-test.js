import React from 'react';
import { act, create } from 'react-test-renderer';
import { TextInput } from 'react-native';
import SearchScreen from '../screens/SearchScreen';
import * as API from '../api/APIManager';

jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true }));
jest.mock('../components/Icon', () => ({ Icon: () => null }));
jest.mock('../api/Helpers', () => ({ toDict: value => value }));
jest.mock('../api/SettingsManager', () => ({ getConnectionStatus: callback => callback() }));
jest.mock('../api/CollectionManager', () => ({}));
jest.mock('../styles/CommonStyles', () => ({ bdovored: '#900', CommonStyles: { iconStyle: {}, screenStyle: {} } }));
jest.mock('../api/APIManager', () => ({
  bdovoreBaseURL: 'https://test.invalid', getAlbumCoverURL: () => 'cover', catalogueRequest: jest.fn(),
}));

it('explore une série à la demande, ouvre un tome et retrouve la série après une recherche', async () => {
  jest.useFakeTimers();
  global.isConnected = true;
  const navigation = { push: jest.fn() };
  const serie = { id: 1, label: 'Blacksad' };
  const tome = { id: 3, label: 'Arctic-Nation' };
  const group = rows => ({ rows, more: false });
  API.catalogueRequest.mockImplementation(async (resource, params) => {
    if (resource === 'Album') return [{ ID_TOME: 3 }];
    if (params.serie) return { groups: { alb: group([tome]) } };
    return { groups: { ser: group([serie]) }, genres: [] };
  });
  let tree;
  try {
    await act(async () => { tree = create(<SearchScreen navigation={navigation} />); });
    const advance = async ms => act(async () => jest.advanceTimersByTime(ms));
    const press = async predicate => act(async () => tree.root.findAll(node => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function').find(predicate).props.onPress());
    await advance(0);
    await advance(100);
    expect(API.catalogueRequest).toHaveBeenCalledTimes(1);
    await press(node => node.props.accessibilityState?.expanded === false);
    await advance(0);
    await advance(100);
    expect(API.catalogueRequest).toHaveBeenLastCalledWith('Catalogue', { scope: 'alb', serie: 1, offset: 0 }, expect.anything());
    await press(node => node.findAllByProps({ numberOfLines: 2 }).length > 0);
    expect(navigation.push).toHaveBeenCalledWith('Album', { item: { ID_TOME: 3 } });
    const change = async text => act(async () => tree.root.findByType(TextInput).props.onChangeText(text));
    await change('Blacksad');
    await advance(300);
    expect(API.catalogueRequest).toHaveBeenLastCalledWith('Catalogue', { q: 'Blacksad', scope: 'all', offset: 0 }, expect.anything());
    await change('');
    expect(tree.root.findAll(node => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function').some(node => node.props.accessibilityState?.expanded)).toBe(true);
  } finally {
    await act(async () => tree?.unmount());
    jest.useRealTimers();
  }
});
