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
import { ButtonGroup, ListItem, SearchBar } from 'react-native-elements';
import * as Progress from 'react-native-progress';
import { format } from 'react-string-format';

import { AlbumItem } from '../components/AlbumItem';
import { bdovored, bdovorlightred, AlbumItemHeight, CommonStyles } from '../styles/CommonStyles';
import { BottomSheet } from '../components/BottomSheet';
import { Icon } from '../components/Icon';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SerieItem } from '../components/SerieItem';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';
import CollectionManager from '../api/CollectionManager';


const defaultSortMode = 1;

const sortModes = {
  0: 'Tri par série',
  1: 'Tri par date d\'ajout',
}

const serieFilterModes = {
  0: 'Toutes',
  1: 'Complètes',
  2: 'Incomplètes',
  3: 'One shot',
  4: 'Terminées',
  5: 'En cours',
  6: 'Interrompues',
}

const filterModes = {
  0: 'Tous',
  1: 'Non lus',
  2: 'Prêtés',
  3: 'Numériques',
}

const filterModesAlbumsSearch = {
  0: 'Rechercher dans mes{0}...',
  1: 'Rechercher dans mes{0} non lus...',
  2: 'Rechercher dans mes{0} prêtés...',
  3: 'Rechercher dans mes{0} numériques...',
}

const filterModesSeriesSearch = {
  0: 'Rechercher dans mes{0}...',
  1: 'Rechercher dans mes{0} complètes...',
  2: 'Rechercher dans mes{0} incomplètes...',
  3: 'Rechercher dans mes{0} one shot...',
  4: 'Rechercher dans mes{0} terminées...',
  5: 'Rechercher dans mes{0} en cours...',
  6: 'Rechercher dans mes{0} interrompues...',
}

let cachedToken = '';
let collectionGenre = 0;
let loadingSteps = 0;
let loadTime = 0;
let loadedItems = 0;

function CollectionScreen({ route, navigation }) {

  const [collectionType, setCollectionType] = useState(0); // 0: Series, 1: Albums
  const [errortext, setErrortext] = useState('');
  const [filteredAlbums, setFilteredAlbums] = useState(null);
  const [filteredSeries, setFilteredSeries] = useState(null);
  const [filterMode, setFilterMode] = useState(0);
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressRate, setProgressRate] = useState(0);
  const [scrollPos, setScrollPos] = useState([40, 40]);
  const [serieFilterMode, setSerieFilterMode] = useState(0);
  const [showFilterChooser, setShowFilterChooser] = useState(false);
  const [showSerieFilterChooser, setShowSerieFilterChooser] = useState(false);
  const [showSortChooser, setShowSortChooser] = useState(false);
  const [sortMode, setSortMode] = useState(defaultSortMode);  // 0: Default, 1: Sort by date
  const [toggleElement, setToggleElement] = useState(Date.now());
  const flatList = useRef();
  const stateRefKeywords = useRef();
  stateRefKeywords.current = keywords;

  collectionGenre = route.params.collectionGenre;

  const toggle = () => {
    setToggleElement(Date.now());
  }

  const refreshDataIfNeeded = (force = false) => {
    //console.log('refreshing ????? local ' + cachedToken + '/' + global.localTimestamp + ' to server ' + global.token + '/' + global.serverTimestamp);
    //console.log(' autoSync: ' + global.autoSync + ' collectFetched: ' + global.collectionFetched);
    //console.log(' forceOffline: ' + global.forceOffline + ' collectFetched: ' + global.collectionFetched);
    if ((force || global.autoSync) &&
      !global.forceOffline && cachedToken != 'fetching' &&
      (cachedToken != global.token || global.localTimestamp != global.serverTimestamp || !global.collectionFetched)) {
      const savedCachedToken = cachedToken;
      APIManager.onConnected(navigation, () => {
        cachedToken = 'fetching';
        if (global.localTimestamp != global.serverTimestamp || !global.collectionFetched) {
          //console.log('refreshing from local ' + savedCachedToken + '/' + global.localTimestamp + ' to server ' + global.token + '/' + global.serverTimestamp);
          fetchData();
        } else {
          cachedToken = global.token;
        }
      }, () => { cachedToken = savedCachedToken; });
    }
  }

  useEffect(() => {
    //refreshDataIfNeeded();
    // Make sure data is refreshed when login/token changed
    const willFocusSubscription = navigation.addListener('focus', () => {
      refreshDataIfNeeded();
      applyFilters();
      toggle();
    });
    return willFocusSubscription;
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: collectionGenre == 0  ? 'Ma collection' : 'Mes ' + CollectionManager.CollectionGenres[collectionGenre][0],
    });
    applyFilters();
    setScrollPos([40, 40]);
    scrollToTop();
  }, [collectionGenre]);

  useEffect(() => {
    applyFilters();
  }, [collectionType, filterMode, serieFilterMode, sortMode, keywords]);

  const filterCollection = (collection, mode) => {

    const lowerSearchText = Helpers.lowerCaseNoAccentuatedChars(stateRefKeywords.current);

    return collection.filter((item) => {
      // Search for keywords if provided
      if (lowerSearchText != '') {
        // search text in lowercase title without taking accents
        if ((mode == 1 ? !Helpers.lowerCaseNoAccentuatedChars(item.TITRE_TOME).includes(lowerSearchText) : true)
          && !Helpers.lowerCaseNoAccentuatedChars(item.NOM_SERIE).includes(lowerSearchText)) {
          return false;
        }
      }
      if (mode == 0) {
        // Filter serie according there completeness status and requested filter mode
        const fMode = parseInt(serieFilterMode);
        if (fMode > 0) {
          const isComplete = CollectionManager.isSerieComplete(item.ID_SERIE);
          const flagStatus = item.LIB_FLG_FINI_SERIE;
          switch (fMode) {
            case 1: return isComplete;
            case 2: return !isComplete;
            case 3: return flagStatus == 'One Shot';
            case 4: return flagStatus == 'Fini';
            case 5: return flagStatus == 'En cours';
            case 6: return flagStatus == 'Interrompue';
            default: return false;
          }
        }
      }
      else {
        // For albums, check the status of selected filter modes
        switch (parseInt(filterMode)) {
          case 1: return item.FLG_LU == 'N';
          case 2: return item.FLG_PRET == 'O';
          case 3: return item.FLG_NUM == 'O';
        }
      }
      return true;
    });
  }

  const applyFilters = () => {
    if (stateRefKeywords.current == '' && collectionGenre == 0 && filterMode == 0) {
      setFilteredAlbums(sortMode == 1 ? Helpers.sliceSortByDate(CollectionManager.getAlbums()) : null);
    } else {
      const filteredAlbums = filterCollection(CollectionManager.getAlbums(collectionGenre), 1);
      setFilteredAlbums(sortMode == 1 ? Helpers.sliceSortByDate(filteredAlbums) : filteredAlbums);
    }

    if (stateRefKeywords.current == '' && collectionGenre == 0 && serieFilterMode == 0) {
      setFilteredSeries(null);
    }
    else {
      setFilteredSeries(filterCollection(CollectionManager.getSeries(collectionGenre), 0));
    }
  }

  const fetchData = () => {
    if (!loading && global.isConnected) {
      setKeywords('');
      setSortMode(defaultSortMode);
      setLoading(true);
      setFilteredSeries(null);
      setFilteredAlbums(null);
      setProgressRate(0);
      setScrollPos([0, 0]);
      loadedItems = 0;
      loadingSteps = 3;
      loadTime = Date.now();
      CollectionManager.fetchCollection(navigation, onFetchCollection);
      if (global.verbose) {
        Helpers.showToast(false, 'Téléchargement de la collection...');
      }
    }
  }

  const onFetchCollection = (result, type) => {
    setErrortext(result.error);

    if (result.items) {
      loadedItems += parseFloat(result.items.length);
    }

    switch (type) {
      case 0:
        let nbTotalSeries = result.totalItems ?? result.items.length;
        setProgressRate(loadedItems / (nbTotalSeries ?? 1));
        applyFilters();
        break;
      case 1:
        let nbTotalAlbums = result.totalItems ?? result.items.length;
        setProgressRate(loadedItems / (nbTotalAlbums ?? 1));
        applyFilters();
        break;
      case 2:
        break;
    }

    if (loadedItems == result.totalItems) {
      loadedItems = 0;
    }
    loadingSteps -= (result.done ? 1 : 0);
    setLoading(loadingSteps > 0);
    if (loadingSteps == 0) {
      const millis = Date.now() - loadTime;
      console.debug('Collection loaded in ' + millis / 1000 + ' seconds');
      cachedToken = global.token;
      if (global.verbose) {
        Helpers.showToast(false, 'Collection téléchargée en ' + Math.round(millis / 1000.0) + ' secondes');
      }
    }
  }

  const onPressCollectionType = (selectedIndex) => {
    setCollectionType(parseInt(selectedIndex));
    Helpers.safeScrollToOffset(flatList, { offset: scrollPos[parseInt(selectedIndex)], animated: false });
  }

  const onSerieFilterModePress = () => {
    setShowSerieFilterChooser(true);
  }

  const onFilterModePress = () => {
    setShowFilterChooser(true);
  }

  const onSortModePress = () => {
    setShowSortChooser(true);
  }

  const onSearchChanged = (searchText) => {
    setKeywords(searchText);
  }

  const scrollToTop = (offset = 40) => {
    Helpers.safeScrollToOffset(flatList, { offset, animated: false });
  }

  const renderItem = useCallback(({ item, index }) => {
    if (Helpers.isValid(item)) {
      switch (collectionType) {
        case 0: return (<SerieItem navigation={navigation} item={Helpers.toDict(item)} index={index} collectionMode={true} />);
        case 1: return (<AlbumItem navigation={navigation} item={Helpers.toDict(item)} index={index} collectionMode={true} refreshCallback={toggle} />);
      }
    }
    return null;
  }, [collectionType]);

  const keyExtractor = useCallback((item, index) =>
    Helpers.isValid(item) ? (collectionType == 0 ? parseInt(item.ID_SERIE) : Helpers.makeAlbumUID(item)) : index,
    [collectionType]);

  const getItemLayout = useCallback((data, index) => ({
    length: AlbumItemHeight,
    offset: 40 + AlbumItemHeight * index,
    index
  }), []);

  const onScrollEvent = (event) => {
    if (event && event.nativeEvent && event.nativeEvent.contentOffset) {
      const curPos = event.nativeEvent.contentOffset.y;
      setScrollPos(pos => { pos.splice(collectionType, 1, curPos); return pos; });
    }
  }

  return (
    <View style={CommonStyles.screenStyle}>
      <View style={{ flexDirection: 'row', flex: 0 }}>
        <ButtonGroup
          onPress={onPressCollectionType}
          selectedIndex={collectionType}
          buttons={[{
            element: () => <Text style={CommonStyles.defaultText}>
              {Helpers.pluralWord(CollectionManager.numberOfSeries(collectionGenre), 'série')}</Text>
          }, {
            element: () => <Text style={CommonStyles.defaultText}>
              {Helpers.pluralWord(CollectionManager.numberOfAlbums(collectionGenre), 'album')}</Text>
          }]}
          containerStyle={[{ marginLeft: 8, flex: 1 }, CommonStyles.buttonGroupContainerStyle]}
          buttonStyle={CommonStyles.buttonGroupButtonStyle}
          selectedButtonStyle={CommonStyles.buttonGroupSelectedButtonStyle}
          innerBorderStyle={CommonStyles.buttonGroupInnerBorderStyle}
        />
        {(!global.autoSync && global.serverTimestamp != global.localTimestamp) ?
          <TouchableOpacity onPress={() => refreshDataIfNeeded(true)}>
            <Icon name='refresh' size={25} style={{ marginTop: 6, marginRight: 10 }} />
          </TouchableOpacity> : null}
      </View>
      {loading ?
        <Progress.Bar animated={false} progress={progressRate} width={null} color={CommonStyles.progressBarStyle.color} style={CommonStyles.progressBarStyle} /> :
        null}
      {!loading && CollectionManager.isCollectionEmpty() ?
        <View style={[CommonStyles.screenStyle, { height: '50%', flexDirection: 'column' }]}>
          <View style={{ flex: 1 }}></View>
          <Text style={[CommonStyles.defaultText, CommonStyles.center]}>Aucun album{CollectionManager.CollectionGenres[collectionGenre][1]} dans la collection.{'\n'}</Text>
          <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
            <Text style={[CommonStyles.defaultText, CommonStyles.center, {textAlign: 'center'}]}>
              <Text style={CommonStyles.defaultText}>Ajoutez vos albums via les onglets{'\n'}</Text>
              <Text style={CommonStyles.linkText} onPress={() => navigation.navigate('Actualité')}>Actualité</Text>
              <Text style={CommonStyles.defaultText}>{' '}et{' '}</Text>
              <Text style={CommonStyles.linkText} onPress={() => navigation.navigate('Rechercher')}>Rechercher</Text>
              <Text style={CommonStyles.defaultText}>.{'\n'}</Text>
            </Text>
          </View>
          <Text style={[CommonStyles.defaultText, CommonStyles.center]}>
            Le mode ajout automatique du scanner{'\n'}
            de codes-barres vous permet de référencer{'\n'}
            rapidement votre collection.</Text>
          <TouchableOpacity onPress={() =>
            { if (global.isConnected) { navigation.push('BarcodeScanner'); }}}
            title="Search"
            style={{ marginLeft: 5, marginRight: 8, marginVertical: 0, alignSelf:'center' }}>
            <Icon
              name='barcode-scan'
              size={42}
              color={CommonStyles.iconStyle.color} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}></View>
        </View>
        :
        <View style={{ flex: 1, marginTop: 0 }}>
          {errortext ? (
            <Text style={CommonStyles.errorTextStyle}>
              {errortext}
            </Text>
          ) : null}
          {<FlatList
            ref={flatList}
            initialNumToRender={6}
            maxToRenderPerBatch={10}
            windowSize={10}
            data={(collectionType == 0 ? (filteredSeries ? filteredSeries : CollectionManager.getSeries()) : (filteredAlbums ? filteredAlbums : CollectionManager.getAlbums()))}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            extraData={toggleElement}
            ItemSeparatorComponent={Helpers.renderSeparator}
            getItemLayout={getItemLayout}
            refreshControl={<RefreshControl
              colors={[bdovorlightred, global.isDarkMode ? bdovorlightred : bdovored]}
              tintColor={global.isDarkMode ? bdovorlightred : bdovored}
              refreshing={loading}
              onRefresh={fetchData} />}
            onScroll={onScrollEvent}
            ListHeaderComponent={
              <View style={{ flexDirection: 'row', marginTop: 0, height: 40 }}>
                <SearchBar
                  placeholder={(collectionType == 0) ?
                    format(filterModesSeriesSearch[serieFilterMode], CollectionManager.CollectionGenres[collectionGenre][3]) :
                    format(filterModesAlbumsSearch[filterMode], CollectionManager.CollectionGenres[collectionGenre][2])}
                  onChangeText={onSearchChanged}
                  value={keywords}
                  platform='ios'
                  autoCapitalize='none'
                  autoCorrect={false}
                  inputContainerStyle={[{ height: 30 }, CommonStyles.searchContainerStyle]}
                  containerStyle={[CommonStyles.screenStyle]}
                  inputStyle={[CommonStyles.defaultText, { fontSize: 12 }]}
                  cancelButtonTitle='Annuler'
                  searchIcon={<Ionicons
                                    name="search"
                                    size={10}
                                    color="#888"
                                  />}
                />
                {collectionType == 0 ?
                  <View style={{ flexDirection: 'row', flex: 0, marginTop: 5, marginLeft: 0, marginRight: 5 }}>
                    <TouchableOpacity onPress={onSerieFilterModePress} style={{ flex: 0, marginRight: 5 }}>
                      <Icon name={serieFilterMode == 0 ? 'filter-outline' : 'filter-remove'} size={25} color={serieFilterMode == 0 ? CommonStyles.iconStyle.color : CommonStyles.iconEnabledStyle.color} />
                    </TouchableOpacity>
                  </View>
                  :
                  <View style={{ flexDirection: 'row', flex: 0, marginTop: 5, marginLeft: 0, marginRight: 5 }}>
                    <TouchableOpacity onPress={onSortModePress} style={{ flex: 0 }}>
                      <Icon name={sortMode == defaultSortMode ? 'sort-variant' : 'sort-variant-remove'} size={25} color={sortMode == defaultSortMode ? CommonStyles.iconStyle.color : CommonStyles.iconEnabledStyle.color} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onFilterModePress} style={{ flex: 0, marginHorizontal: 5 }}>
                      <Icon name={filterMode == 0 ? 'filter-outline' : 'filter-remove'} size={25} color={filterMode == 0 ? CommonStyles.iconStyle.color : CommonStyles.iconEnabledStyle.color} />
                    </TouchableOpacity>
                  </View>
                }
              </View>
            }
          />}
        </View>}

      {/* Serie filter chooser */}
      <BottomSheet
        isVisible={showSerieFilterChooser}
        visibleSetter={setShowSerieFilterChooser}
        containerStyle={CommonStyles.bottomSheetContainerStyle}>
        <ListItem key='0' containerStyle={CommonStyles.bottomSheetTitleStyle}>
          <ListItem.Content>
            <ListItem.Title style={[CommonStyles.bottomSheetItemTextStyle, CommonStyles.defaultText]}>Filtrer</ListItem.Title>
          </ListItem.Content>
        </ListItem>
        {Object.entries(serieFilterModes).map(([mode, title], index) => (
          <ListItem key={index + 1}
            containerStyle={serieFilterMode == mode ? CommonStyles.bottomSheetSelectedItemContainerStyle : CommonStyles.bottomSheetItemContainerStyle}
            onPress={() => {
              setSerieFilterMode(mode); setShowSerieFilterChooser(false);
            }}>
            <ListItem.Content>
              <ListItem.Title style={serieFilterMode == mode ? CommonStyles.bottomSheetSelectedItemTextStyle : CommonStyles.bottomSheetItemTextStyle}>
                {title}
              </ListItem.Title>
            </ListItem.Content>
          </ListItem>
        ))}
      </BottomSheet>

      {/* Filter chooser */}
      <BottomSheet
        isVisible={showFilterChooser}
        visibleSetter={setShowFilterChooser}
        containerStyle={CommonStyles.bottomSheetContainerStyle}>
        <ListItem key='0' containerStyle={CommonStyles.bottomSheetTitleStyle}>
          <ListItem.Content>
            <ListItem.Title style={[CommonStyles.bottomSheetItemTextStyle, CommonStyles.defaultText]}>Filtrer</ListItem.Title>
          </ListItem.Content>
        </ListItem>
        {Object.entries(filterModes).map(([mode, title], index) => (
          <ListItem key={index + 1}
            containerStyle={filterMode == mode ? CommonStyles.bottomSheetSelectedItemContainerStyle : CommonStyles.bottomSheetItemContainerStyle}
            onPress={() => {
              setFilterMode(mode); setShowFilterChooser(false);
            }}>
            <ListItem.Content>
              <ListItem.Title style={filterMode == mode ? CommonStyles.bottomSheetSelectedItemTextStyle : CommonStyles.bottomSheetItemTextStyle}>
                {title}
              </ListItem.Title>
            </ListItem.Content>
          </ListItem>
        ))}
      </BottomSheet>

      {/* Sort chooser */}
      <BottomSheet
        isVisible={showSortChooser}
        visibleSetter={setShowSortChooser}
        containerStyle={CommonStyles.bottomSheetContainerStyle}>
        <ListItem key='0' containerStyle={CommonStyles.bottomSheetTitleStyle}>
          <ListItem.Content>
            <ListItem.Title style={[CommonStyles.bottomSheetItemTextStyle, CommonStyles.defaultText]}>Trier</ListItem.Title>
          </ListItem.Content>
        </ListItem>
        {Object.entries(sortModes).map(([mode, title], index) => (
          <ListItem key={index + 1}
            containerStyle={sortMode == mode ? CommonStyles.bottomSheetSelectedItemContainerStyle : CommonStyles.bottomSheetItemContainerStyle}
            onPress={() => {
              setSortMode(mode); setShowSortChooser(false);
            }}>
            <ListItem.Content style={{ flexDirection: 'column' }}>
              <ListItem.Title style={sortMode == mode ? CommonStyles.bottomSheetSelectedItemTextStyle : CommonStyles.bottomSheetItemTextStyle}>
                {title}
              </ListItem.Title>
            </ListItem.Content>
          </ListItem>
        ))}
      </BottomSheet>
    </View>
  );
}

export default CollectionScreen;
