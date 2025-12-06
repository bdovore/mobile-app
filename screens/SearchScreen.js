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
import { FlatList, Text, TouchableOpacity, View, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
//import { ButtonGroup, SearchBar } from 'react-native-elements';
import { SearchBar, ButtonGroup } from '@rneui/themed';

import { AlbumItem } from '../components/AlbumItem';
import { AuteurItem } from '../components/AuteurItem';
import { AlbumItemHeight, CommonStyles } from '../styles/CommonStyles';
import { Icon } from '../components/Icon';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { SerieItem } from '../components/SerieItem';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';
import CollectionManager from '../api/CollectionManager';


function SearchScreen({ navigation }) {

  const [data, setData] = useState([]);
  const [errortext, setErrortext] = useState('');
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(0);
  const [toggleElement, setToggleElement] = useState(Date.now());

  const stateRefKeywords = useRef();
  stateRefKeywords.current = keywords;
  const stateRefSearchMode = useRef();
  stateRefSearchMode.current = searchMode;

  const toggle = () => {
    setToggleElement(Date.now());
  }

  useFocusEffect(() => {
    if (searchMode == 1) {
     // CollectionManager.selectOwnAlbum(data);
    }
  });

  useEffect(() => {
    // Make sure data is refreshed when login/token changed
    const willFocusSubscription = navigation.addListener('focus', () => {
      toggle();
    });
    return willFocusSubscription;
  }, []);

  useEffect(() => {
    onSearch(keywords);
  }, [searchMode]);

  const onSearchFetched = (searchedText, mode, result) => {
    // As many requests are sent to the server while typing the keywords,
    // it may happen that answers are not received in order. So we make
    // sure to only take into account the result of the request for
    // the last provided keywords.
    if (searchedText == stateRefKeywords.current && mode == stateRefSearchMode.current) {
      if (!result.error && stateRefSearchMode.current == 1) {
        CollectionManager.selectOwnAlbum(result.items);
      }
      setData(result.items);
      setErrortext(result.error);
      setLoading(false);
    }

    if (stateRefKeywords.current == '') {
      setLoading(false);
    }
  }

  const onSearch = (searchText) => {

    if (!global.isConnected) { return; }

    setKeywords(searchText);
    if (searchText == '') {
      setLoading(false);
      setData([]);
      return;
    }

    const mode = parseInt(searchMode);
    const callback = (result) => onSearchFetched(searchText, mode, result);
    setLoading(true);
    switch (mode) {
      case 0:
        APIManager.fetchSerieByTerm(searchText, callback);
        break;
      case 1:
        {
          if (searchText.length >= 8 && Helpers.isNumeric(searchText)) {
            let params = (searchText.length > 10) ? { EAN: searchText } : { ISBN: searchText };
            APIManager.fetchAlbum(callback, params);
          }
          APIManager.fetchAlbum(callback, { term: searchText });
        }
        break;
      case 2:
        APIManager.fetchAuteurByTerm(searchText, callback);
        break;
    }
  }

  const onSearchCancel = () => {
    setKeywords('');
    setData([]);
  }

  const onPressTypeButton = (selectedIndex) => {
    if (selectedIndex != searchMode) {
      setSearchMode(selectedIndex);
      setData([]);
    }
  }

  const onBarcodeSearch = () => {
    if (global.isConnected) {
      navigation.push('BarcodeScanner');
    }
  }

  const keyExtractor = useCallback((item, index) => {
    if (Helpers.isValid(item)) {
      switch (parseInt(searchMode)) {
        case 0: return parseInt(item.ID_SERIE);
        case 1: return Helpers.getAlbumUID(item);
        case 2: return parseInt(item.ID_AUTEUR);
      }
    }
    return index;
  }, [searchMode]);

  const renderItem = useCallback(({ item, index }) => {
    if (Helpers.isValid(item)) {
      switch (parseInt(searchMode)) {
        case 0: return (<SerieItem navigation={navigation} item={Helpers.toDict(item)} index={index} />);
        case 1: return (<AlbumItem navigation={navigation} item={Helpers.toDict(CollectionManager.getFirstAlbumEditionOfSerieInCollection(item))} index={index} refreshCallback={toggle}/>);
        case 2: return (<AuteurItem navigation={navigation} author={item} index={index} />);
      }
    }
    return null;
  }, [searchMode]);

  const getItemLayout = useCallback((data, index) => ({
    length: AlbumItemHeight,
    offset: AlbumItemHeight * index,
    index
  }), []);

  const onAddProposition =  async () => {
    APIManager.addProposition(keywords)
  };

  return (
    <View style={CommonStyles.screenStyle}>
      <View>
        <View style={[{ flexDirection: 'row', margin: 0, marginTop: 5 }, CommonStyles.screenStyle, { flex: 0 }]}>
          <View style={{ flex: 1 }}>
            <SearchBar
              placeholder={parseInt(searchMode) == 0 ? 'Nom de la série...' : parseInt(searchMode) == 1 ? "Nom de l'album ou ISBN..." : "Nom de l'auteur..."}
              searchIcon={
                <Ionicons
                  name="search"
                  size={20}
                  color="#888"
                />}
               clearIcon={
                keywords ?
                  <Ionicons
                    name="close-circle"  // ou "close" pour une croix simple
                    size={20}
                    color="#888"
                    onPress={onSearchCancel}
                  /> : null
                }
              onChangeText={onSearch}
              onCancel={onSearchCancel}
              onClear={onSearchCancel}
              value={keywords}
              platform='ios'
              autoCapitalize='none'
              autoCorrect={false}
              inputContainerStyle={[{ height: 30 }, CommonStyles.searchContainerStyle]}
              containerStyle={[CommonStyles.screenStyle]}
              cancelButtonTitle='Annuler'
              showLoading={loading}
              inputStyle={[CommonStyles.defaultText, { marginTop: 5 }]}
            />
          </View>
          <TouchableOpacity
            onPress={onBarcodeSearch}
            title="Search"
            style={{ marginLeft: 5, marginRight: 8, marginVertical: 0 }}>
            <Icon
              name='barcode-scan'
              size={36}
              color={CommonStyles.iconStyle.color} />
          </TouchableOpacity>
        </View>
        <View style={{ marginLeft: -2, marginRight: -2, marginTop: 0, marginBottom: 0 }}>
          <ButtonGroup
            onPress={onPressTypeButton}
            selectedIndex={searchMode}
            buttons={[
              { element: () => <Text style={CommonStyles.defaultText}>Séries</Text> },
              { element: () => <Text style={CommonStyles.defaultText}>Albums</Text> },
              { element: () => <Text style={CommonStyles.defaultText}>Auteurs</Text> }]}
            containerStyle={CommonStyles.buttonGroupContainerStyle}
            buttonStyle={CommonStyles.buttonGroupButtonStyle}
            selectedButtonStyle={CommonStyles.buttonGroupSelectedButtonStyle}
            innerBorderStyle={CommonStyles.buttonGroupInnerBorderStyle}
          />
        </View>
      </View>
    {global.isConnected ?
       <View style={{ flex: 1, marginHorizontal: 1 }}>
        {errortext ? (
          <Text style={CommonStyles.errorTextStyle}>
            {errortext}
          </Text>
        ) : null}
        {loading ? <LoadingIndicator style={{ height: '100%' }} /> : (
          <FlatList
            maxToRenderPerBatch={10}
            windowSize={10}
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            ItemSeparatorComponent={Helpers.renderSeparator}
            extraData={toggleElement}
          />
        )}

        {/* Bouton "Proposer un ajout" */}
        {keywords && !loading ? (
          <View style={{
            padding: 15,
            backgroundColor: CommonStyles.screenStyle.backgroundColor,
            borderTopWidth: 1,
            borderTopColor: '#ccc'
          }}>
            <Text
              onPress={onAddProposition}
              style={[CommonStyles.linkText, { textAlign: 'center', marginBottom: 10 }]}>
                Rien trouvé ? Vous pouvez proposer un ajout
              </Text>

          </View>
        ) : null}
      </View>:
            <View style={[CommonStyles.screenStyle, { alignItems: 'center', height: '50%', flexDirection: 'column' }]}>
              <View style={{ flex: 1 }}></View>
              <Text style={CommonStyles.defaultText}>Recherche indisponible en mode non-connecté.{'\n'}</Text>
              <Text style={CommonStyles.defaultText}>Rafraichissez cette page une fois connecté.</Text>
              <TouchableOpacity style={{ flexDirection: 'column', marginTop: 20 }} onPress={onSearch}>
                <Icon name='refresh' size={50} color={CommonStyles.markIconDisabled.color} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}></View>
            </View>}
        </View>
      );
}

export default SearchScreen;
