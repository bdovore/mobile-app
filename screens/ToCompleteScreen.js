/* Copyright 2021-2022 Joachim Pouderoux & Association BDovore
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
import * as Progress from 'react-native-progress';
import { ButtonGroup } from 'react-native-elements';
import { SearchBar } from 'react-native-elements';

import { AlbumItem } from '../components/AlbumItem';
import { bdovored, bdovorlightred, AlbumItemHeight, CommonStyles } from '../styles/CommonStyles';
import { Icon } from '../components/Icon';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SerieItem } from '../components/SerieItem';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';
import CollectionManager from '../api/CollectionManager';


let loadedAlbums = 0;
let loadedSeries = 0;
let collectionGenre = 0;
let albums = [];
let series = [];
let timeout = null;

function ToCompleteScreen({ route, navigation }) {

  const [collectionType, setCollectionType] = useState(0); // 0: Series, 1: Albums
  const [errortext, setErrortext] = useState('');
  const [filteredAlbums, setFilteredAlbums] = useState([]);
  const [filteredSeries, setFilteredSeries] = useState([]);
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressRate, setProgressRate] = useState(0);
  const [scrollPos, setScrollPos] = useState([0, 0]);
  const flatList = useRef();

  let [cachedToken, setCachedToken] = useState('');

  collectionGenre = route.params.collectionGenre;

  const refreshDataIfNeeded = (force = false) => {
    if (CollectionManager.isCollectionEmpty()) {
      albums = [];
      series = [];
    }

    //console.log('refreshing ????? local ' + cachedToken + '/' + global.localTimestamp + ' to server ' + global.token + '/' + global.serverTimestamp);
    if ((global.autoSync || force) && cachedToken != 'fetching' && !global.forceOffline && (cachedToken != global.token || !global.collectionManquantsUpdated)) {
      const savedCachedToken = cachedToken;
      cachedToken = 'fetching';
      APIManager.onConnected(navigation, () => {
        //console.log('refreshing from local ' + savedCachedToken + '/' + global.localTimestamp + ' to server ' + global.token + '/' + global.serverTimestamp);
        fetchData();
      }, () => { cachedToken = savedCachedToken; });
    }

    applyAlbumsFilters();
    applySeriesFilters();
  }

  useEffect(() => {
    navigation.setOptions({
      title: ('Albums manquants' + (collectionGenre > 0 ? (' - ' + CollectionManager.CollectionGenres[collectionGenre][0]) : '')),
    });

    applyAlbumsFilters();
    applySeriesFilters();
  }, [collectionGenre]);

  const applyAlbumsFilters = () => {
    const genre = CollectionManager.CollectionGenres[collectionGenre][0];
    setFilteredAlbums(albums.filter((album) =>
      !CollectionManager.isAlbumExcluded(album) && (collectionGenre == 0 ? true : (album.ORIGINE == genre || (album.NOM_GENRE ? album.NOM_GENRE.startsWith(genre) : false)))));
  }

  const applySeriesFilters = () => {
    const genre = CollectionManager.CollectionGenres[collectionGenre][0];
    setFilteredSeries(series.filter((serie) =>
      serie.IS_EXCLU != 1 && (collectionGenre == 0 ? true : (serie.ORIGINE == genre || (serie.NOM_GENRE ? serie.NOM_GENRE.startsWith(genre) : false)))));
  }

  useEffect(() => {
    //refreshDataIfNeeded();
    // Make sure data is refreshed when login/token changed
    const willFocusSubscription = navigation.addListener('focus', () => {
      refreshDataIfNeeded();
    });
    return () => {
      willFocusSubscription();
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const fetchData = () => {
    if (global.isConnected) {
      if (global.verbose) {
        Helpers.showToast(false, 'Téléchargement des albums/séries manquants...');
      }
      global.collectionManquantsUpdated = true;
      setLoading(true);
      setProgressRate(0);
      setErrortext('');
      setScrollPos([0, 0]);
      fetchSeries();
    } else if (!timeout && series.length == 0 && albums.length == 0) {
      if (verbose) {
        Helpers.showToast(false, 'Will try to fetch tocomplete again in 2sec.');
      }
      timeout = setTimeout(fetchData, 2000);
    }
  }

  const fetchSeries = () => {
    series = [];
    loadedSeries = 0;
    APIManager.fetchSeriesManquants({ navigation: navigation }, onSeriesFetched)
      .then().catch((error) => console.debug(error));
  }

  const onSeriesFetched = async (result) => {
    console.debug('series ' + (result.done ? 'done' : 'in progress'));
    console.debug(result.items.length + ' series to complete fetched')
    series.push(...result.items);
    setErrortext(result.error);
    loadedSeries += result.items.length;

    applySeriesFilters();

    setProgressRate(parseFloat(loadedSeries) / parseFloat(result.totalItems ?? 1));

    if (result.done) {
      fetchAlbums();
    }
  }

  const fetchAlbums = () => {
    albums = [];
    loadedAlbums = 0;
    APIManager.fetchAlbumsManquants({ navigation: navigation }, onAlbumsFetched)
      .then().catch((error) => console.debug(error));
  }

  const onAlbumsFetched = async (result) => {
    console.debug('albums ' + (result.done ? 'done' : 'in progress'));
    console.debug(result.items.length + ' albums fetched so far');
    albums.push(...result.items);
    setErrortext(result.error);
    loadedAlbums += result.items.length;

    applyAlbumsFilters();

    setProgressRate(parseFloat(loadedAlbums) / parseFloat(result.totalItems ?? 1));

    if (result.done) {
      setLoading(false);
      cachedToken = global.token;
    }
  }

  const onPressCollectionType = (selectedIndex) => {
    setCollectionType(parseInt(selectedIndex));
    if (scrollPos[parseInt(selectedIndex)]) {
      Helpers.safeScrollToOffset(flatList, { offset: scrollPos[parseInt(selectedIndex)], animated: false });
    }
  }

  const onSearchChanged = (searchText) => {
    setKeywords(searchText);
  }

  const scrollToTop = (offset = 40) => {
    Helpers.safeScrollToOffset(flatList, { offset, animated: false });
  }

  const onScrollEvent = (event) => {
    if (event && event.nativeEvent && event.nativeEvent.contentOffset) {
      const curPos = event.nativeEvent.contentOffset.y;
      setScrollPos(pos => { pos.splice(collectionType, 1, curPos); return pos; });
    }
  }

  const renderItem = useCallback(({ item, index }) => {
    if (Helpers.isValid(item)) {
      switch (collectionType) {
        case 0: return (<SerieItem navigation={navigation} item={Helpers.toDict(item)} index={index} showExclude={true} />);
        case 1: return (<AlbumItem navigation={navigation} item={Helpers.toDict(item)} index={index} showExclude={true} />);
      }
    }
    return null;
  }, [collectionType]);

  const keyExtractor = useCallback((item, index) =>
    Helpers.isValid(item) ?
      (collectionType == 0 ? item.ID_SERIE : Helpers.getAlbumUID(item)) : index, [collectionType]);

  const getItemLayout = useCallback((data, index) => ({
    length: AlbumItemHeight,
    offset: 40 + AlbumItemHeight * index,
    index
  }), []);

  return (
    <View style={CommonStyles.screenStyle}>
      <View style={{ flexDirection: 'row' }}>
        <ButtonGroup
          onPress={onPressCollectionType}
          selectedIndex={collectionType}
          buttons={[{
            element: () => <Text style={CommonStyles.defaultText}>
              {Helpers.pluralWord(global.isConnected ? filteredSeries.length : 0, 'série')}</Text>
          }, {
            element: () => <Text style={CommonStyles.defaultText}>
              {Helpers.pluralWord(global.isConnected ? filteredAlbums.length : 0, 'album')}</Text>
          }]}
          containerStyle={[{ marginLeft: 8, flex: 1 }, CommonStyles.buttonGroupContainerStyle]}
          buttonStyle={CommonStyles.buttonGroupButtonStyle}
          selectedButtonStyle={CommonStyles.buttonGroupSelectedButtonStyle}
          innerBorderStyle={CommonStyles.buttonGroupInnerBorderStyle}
        />
        {(!global.autoSync && (!global.collectionManquantsUpdated || albums.length == 0)) ?
          <TouchableOpacity onPress={() => refreshDataIfNeeded(true)}><Icon name='refresh' size={25} style={{ marginTop: 6, marginRight: 10 }} /></TouchableOpacity> : null}
      </View>
      <View style={{ marginLeft: 1 }}>
        {loading ? <Progress.Bar animated={false} progress={progressRate} width={null} color={CommonStyles.progressBarStyle.color} style={CommonStyles.progressBarStyle} /> : null}
        {errortext ? (
          <View style={{ alignItems: 'center', marginBottom: 5 }}>
            <Text style={CommonStyles.errorTextStyle}>
              {errortext}
            </Text>
          </View>
        ) : null}
      </View>
      {global.isConnected ?
        (!loading && CollectionManager.isCollectionEmpty() ?
          <View style={[CommonStyles.screenStyle, { alignItems: 'center', height: '50%', flexDirection: 'column' }]}>
            <View style={{ flex: 1 }}></View>
            <Text style={CommonStyles.defaultText}>Aucun album{CollectionManager.CollectionGenres[collectionGenre][1]} dans la collection.{'\n'}</Text>
            <Text style={CommonStyles.defaultText}>Ajoutez vos albums via les onglets Actualité, Recherche</Text>
            <Text style={CommonStyles.defaultText}>ou le scanner de codes-barres.</Text>
            <View style={{ flex: 1 }}></View>
          </View>
          :
          <FlatList
            ref={flatList}
            initialNumToRender={6}
            maxToRenderPerBatch={10}
            windowSize={10}
            data={collectionType == 0 ?
              Helpers.filterSeriesWithSearchKeywords(filteredSeries, keywords) :
              Helpers.filterAlbumsWithSearchKeywords(filteredAlbums, keywords)}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ItemSeparatorComponent={Helpers.renderSeparator}
            getItemLayout={getItemLayout}
            refreshControl={<RefreshControl
              colors={[bdovorlightred, global.isDarkMode ? bdovorlightred : bdovored]}
              tintColor={global.isDarkMode ? bdovorlightred : bdovored}
              refreshing={loading}
              onRefresh={fetchData} />}
            onScroll={onScrollEvent}
            ListHeaderComponent={
              <SearchBar
                placeholder={collectionType == 0 ? 'Rechercher dans les séries incomplètes...' : 'Rechercher dans les albums manquants...'}
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
            }
          />)
        :
        <View style={[CommonStyles.screenStyle, { alignItems: 'center', height: '50%', flexDirection: 'column' }]}>
          <View style={{ flex: 1 }}></View>
          <Text style={CommonStyles.defaultText}>Informations indisponibles en mode non-connecté.{'\n'}</Text>
          <Text style={CommonStyles.defaultText}>Rafraichissez cette page une fois connecté.</Text>
          <TouchableOpacity style={{ flexDirection: 'column', marginTop: 20 }} onPress={fetchData}>
            <Icon name='refresh' size={50} color={CommonStyles.markIconDisabled.color} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}></View>
        </View>}
    </View>);
}

export default ToCompleteScreen;
