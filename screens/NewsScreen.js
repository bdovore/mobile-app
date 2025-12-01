/* Copyright 2021-2025 Joachim Pouderoux, Thomas Cohu & Association BDovore
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { ButtonGroup } from 'react-native-elements';
import { SearchBar } from 'react-native-elements';

import { AlbumItem } from '../components/AlbumItem';
import { bdovored, bdovorlightred, AlbumItemHeight, CommonStyles, red } from '../styles/CommonStyles';
import { Icon } from '../components/Icon';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as APIManager from '../api/APIManager'
import * as Helpers from '../api/Helpers';
import CollectionManager from '../api/CollectionManager';


const newsModeMap = {
  0: '',
  1: 'BD',
  2: 'Mangas',
  3: 'Comics'
};

let cachedToken = '';
let timeout = [null, null];

function NewsScreen({ route, navigation }) {

  const [ascendingSort, setAscendingSort] = useState(true);
  const [collectionGenre, setCollectionGenre] = useState(1);
  const [errortext, setErrortext] = useState('');
  const [filteredForthcomingAlbums, setFilteredForthcomingAlbums] = useState([]);
  const [filteredUserNewsAlbums, setFilteredUserNewsAlbums] = useState([]);
  const [forthcomingAlbums, setForthcomingAlbums] = useState([]);
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [newsMode, setNewsMode] = useState(0);
  const [scrollPos, setScrollPos] = useState([40, 40, 40]);
  const [toggleElement, setToggleElement] = useState(Date.now());
  const [trendAlbums, setTrendAlbums] = useState([]);
  const [userNewsAlbums, setUserNewsAlbums] = useState([]);
  const flatList = useRef();

  if (route.params.collectionGenre != collectionGenre) {
    setCollectionGenre(route.params.collectionGenre);
  }

  useEffect(() => {
    navigation.setOptions({
      title: ('Actualité' + (collectionGenre > 0 ? (' - ' + CollectionManager.CollectionGenres[collectionGenre][0]) : '')),
    });

    // Filter the news according the current collection genre
    setFilteredUserNewsAlbums(
      Helpers.stripNewsByOrigin(userNewsAlbums.slice(), newsModeMap[collectionGenre]));
    if (ascendingSort) {
      filteredUserNewsAlbums.reverse();
    }
    //setFilteredForthcomingAlbums(
    // Helpers.stripNewsByOrigin(forthcomingAlbums.slice(), newsModeMap[collectionGenre]));

    // Fetch the tendency news for current collection genre
    fetchNewsData();
  }, [collectionGenre]);

  const toggle = () => {
    setToggleElement(Date.now());
  }

  const refreshDataIfNeeded = () => {
    if (cachedToken != 'fetching' && !global.forceOffline && (cachedToken != global.token)) {
      const savedCachedToken = cachedToken;
      cachedToken = 'fetching';
      APIManager.onConnected(navigation, () => {
        fetchUserNewsData();
      }, () => { cachedToken = savedCachedToken; });
    }
  }

  useEffect(() => {
    //refreshDataIfNeeded();
    // Make sure data is refreshed when login/token changed
    const willFocusSubscription = navigation.addListener('focus', () => {
      refreshDataIfNeeded();
      toggle();
    });
    return () => {
      willFocusSubscription();
      if (timeout[0]) clearTimeout(timeout[0]);
      if (timeout[1]) clearTimeout(timeout[1]);
    };
  }, []);

  const fetchUserNewsData = async () => {
    if (global.isConnected) {
      if (global.verbose) {
        Helpers.showToast(false, 'Téléchargement des news...');
      }
      setLoading(true);
      setUserNewsAlbums([]);
      setFilteredUserNewsAlbums([]);
      setScrollPos([40, 40, 40]);
      APIManager.fetchUserNews({ navigation: navigation }, onUserNewsFetched, { nb_mois: '0' })
        .then().catch((error) => { setLoading(false); console.debug(error); });
    } else if (!timeout[0] && userNewsAlbums.length == 0) {
      if (verbose) {
        Helpers.showToast(false, 'Will try to fetch user\'s news again in 2sec.');
      }
      timeout[0] = setTimeout(fetchUserNewsData, 2000);
    }
  }

  const fetchNewsData = async () => {
    if (global.isConnected) {
      setTrendAlbums([]);
      APIManager.fetchNews(newsModeMap[collectionGenre], { navigation: navigation }, onTrendFetched)
        .then().catch((error) => console.debug(error));

      setForthcomingAlbums([]);
      setFilteredForthcomingAlbums([]);
      APIManager.fetchNews(newsModeMap[collectionGenre], { navigation: navigation }, onForthcomingAlbumsFetched, { mode: 2, period: '-2' })
        .then().catch((error) => { setLoading(false); console.debug(error); });
    } else if (!timeout[1] && trendAlbums.length == 0) {
      if (verbose) {
        Helpers.showToast(false, 'Will try to fetch news again in 2sec.');
      }
      timeout[1] = setTimeout(fetchNewsData, 2000);
    }
  }

  const onUserNewsFetched = async (result) => {
    console.debug('user news fetched!');
    setUserNewsAlbums(result.items);
    setFilteredUserNewsAlbums(
      Helpers.stripNewsByOrigin(result.items, newsModeMap[collectionGenre]));
    if (ascendingSort) {
      filteredUserNewsAlbums.reverse();
    }
    setErrortext(result.error);
    setLoading(false);
    cachedToken = global.token;
    scrollToTop();
  }

  const onForthcomingAlbumsFetched = async (result) => {
    console.debug('User forthcoming albums fetched!');
    setForthcomingAlbums(result.items);
    if (ascendingSort) {
      result.items.reverse();
    }
    setFilteredForthcomingAlbums(result.items);
    setErrortext(result.error);
    setLoading(false);
  }

  const onTrendFetched = async (result) => {
    console.debug('Trend albums fetched!');
    setTrendAlbums(result.items);
    setErrortext(result.error);
    setLoading(false);
  }

  const toggleAscendingSort = () => {
    const sort = !ascendingSort;
    setAscendingSort(sort);
    filteredUserNewsAlbums.reverse();
    filteredForthcomingAlbums.reverse();
    scrollToTop();
  }

  const onPressNewsMode = (selectedIndex) => {
    setNewsMode(selectedIndex);
    scrollToTop(scrollPos[parseInt(selectedIndex)]);
    onSearchChanged('');
  };

  const scrollToTop = (offset = 40) => {
    Helpers.safeScrollToOffset(flatList, { offset, animated: false });
  }

  const onScrollEvent = useCallback((event) => {
    if (event && event.nativeEvent && event.nativeEvent.contentOffset) {
      const curPos = event.nativeEvent.contentOffset.y;
      setScrollPos(pos => { pos.splice(newsMode, 1, curPos); return pos; });
    }
  });

  const onSearchChanged = (searchText) => {
    setKeywords(searchText);
  }

  const renderAlbum = useCallback(({ item, index }) =>
    Helpers.isValid(item) &&
    <AlbumItem navigation={navigation} item={Helpers.toDict(item)} index={index} showEditionDate={true} showExclude={true} />, []);

  const keyExtractor = useCallback((item, index) =>
    Helpers.isValid(item) ? Helpers.getAlbumUID(item) : index, []);

  const getItemLayout = useCallback((data, index) => ({
    length: AlbumItemHeight,
    offset: 40 + AlbumItemHeight * index,
    index
  }), []);

  return (
    <View style={CommonStyles.screenStyle}>
      <View style={{ flexDirection: 'row', marginBottom: 0 }}>
        <ButtonGroup
          onPress={onPressNewsMode}
          selectedIndex={newsMode}
          buttons={[
            { element: () => <Text style={CommonStyles.defaultText}>Mon actualité</Text> },
            { element: () => <Text style={CommonStyles.defaultText}>Tendances</Text> },
            { element: () => <Text style={CommonStyles.defaultText}>A paraître</Text> }]}
          containerStyle={[{ flex: 1 }, CommonStyles.buttonGroupContainerStyle]}
          buttonStyle={CommonStyles.buttonGroupButtonStyle}
          selectedButtonStyle={CommonStyles.buttonGroupSelectedButtonStyle}
          innerBorderStyle={CommonStyles.buttonGroupInnerBorderStyle}
        />
        {newsMode == 0 || newsMode == 2 ?
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={toggleAscendingSort}>
              <Text style={[CommonStyles.defaultText, { marginLeft: 0, marginRight: 8, marginTop: 8 }]}>
                <Icon name={ascendingSort ? 'sort-numeric-ascending' : 'sort-numeric-descending'} size={25} />
              </Text>
            </TouchableOpacity>
          </View> : null}
      </View>
      <View style={{ flex: 1, marginLeft: 1 }}>
        {errortext ? (
          <Text style={CommonStyles.errorTextStyle}>
            {errortext}
          </Text>
        ) : null}
        {global.isConnected ?
          <FlatList
            ref={flatList}
            initialNumToRender={6}
            maxToRenderPerBatch={10}
            windowSize={10}
            ItemSeparatorComponent={Helpers.renderSeparator}
            data={Helpers.filterAlbumsWithSearchKeywords(newsMode == 0 ? filteredUserNewsAlbums : newsMode == 1 ? trendAlbums : filteredForthcomingAlbums, keywords)}
            keyExtractor={keyExtractor}
            renderItem={renderAlbum}
            extraData={toggleElement}
            refreshControl={<RefreshControl
              colors={[bdovorlightred, bdovored]}
              tintColor={bdovored}
              refreshing={loading}
              onRefresh={() => { fetchUserNewsData(); fetchNewsData(); }} />}
            getItemLayout={getItemLayout}
            onScroll={onScrollEvent}
            ListHeaderComponent={
              <SearchBar
                placeholder='Rechercher dans les albums...'
                onChangeText={onSearchChanged}
                onCancel={() => { onSearchChanged(''); scrollToTop(); }}
                onClear={() => { onSearchChanged(''); scrollToTop(); }}
                value={keywords}
                platform='ios'
                autoCapitalize='none'
                autoCorrect={false}
                inputContainerStyle={[{ height: 30 }, CommonStyles.searchContainerStyle]}
                containerStyle={[CommonStyles.screenStyle, { marginVertical: -8 }]}
                inputStyle={[CommonStyles.defaultText, { fontSize: 12 }]}
                searchIcon={<Ionicons
                                                    name="search"
                                                    size={10}
                                                    color="#888"
                                                  />}
                cancelButtonTitle='Annuler' />
            } />
          :
          <View style={[CommonStyles.screenStyle, { alignItems: 'center', height: '50%', flexDirection: 'column' }]}>
            <View style={{ flex: 1 }}></View>
            <Text style={CommonStyles.defaultText}>Pas d'actualité en mode non-connecté.{'\n'}</Text>
            <Text style={CommonStyles.defaultText}>Rafraichissez cette page une fois connecté.</Text>
            <TouchableOpacity style={{ flexDirection: 'column', marginTop: 20 }} onPress={refreshDataIfNeeded}>
              <Icon name='refresh' size={50} color={CommonStyles.markIconDisabled.color} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}></View>
          </View>}
      </View>
    </View>
  );
}

export default NewsScreen;
