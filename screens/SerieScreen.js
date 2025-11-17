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
import { Alert, SectionList, Switch, Text, TouchableOpacity, View } from 'react-native';
import { format } from 'react-string-format';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import sectionListGetItemLayout from 'react-native-section-list-get-item-layout';

import { AlbumItem } from '../components/AlbumItem';
import { CollapsableSection } from '../components/CollapsableSection';
import { CommonStyles, AlbumItemHeight } from '../styles/CommonStyles';
import { CoverImage } from '../components/CoverImage';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { RatingStars } from '../components/RatingStars';
import { SerieMarkers } from '../components/SerieMarkers';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';
import CollectionManager from '../api/CollectionManager';


function SerieScreen({ route, navigation }) {

  const [errortext, setErrortext] = useState('');
  const [loading, setLoading] = useState(false);
  const [serie, setSerie] = useState(route.params.item);
  const [serieAlbums, setSerieAlbums] = useState([]);
  const [showAllAuthors, setShowAllAuthors] = useState(false);
  const [showExcludedAlbums, setShowExcludedAlbums] = useState(global.showExcludedAlbums);
  const [showSynopsis, setShowSynopsis] = useState(false);
  const [toggleElement, setToggleElement] = useState(Date.now());
  const sectionListRef = useRef();

  const toggle = () => {
    setToggleElement(Date.now());
  }

  useFocusEffect(useCallback(() => {
     toggle();
  }, []));

  const refreshDataIfNeeded = (force = false) => {
    if (force) {
      console.debug("refresh data serie " + serie.ID_SERIE);
      fetchData();
    } else {
      toggle();
    }
  }

  useEffect(() => {
    refreshDataIfNeeded(true);
  }, [serie]);

  useEffect(() => {
    // Make sure data is refreshed when login/token changed
    const willFocusSubscription = navigation.addListener('focus', () => {
      AsyncStorage.getItem('showExcludedAlbums').then((value) => {
        setShowExcludedAlbums(value != 0);
        toggle();
      }).catch(() => { });
    });
    return willFocusSubscription;
  }, []);

  const fetchData = () => {
    setSerieAlbums([]);
    if (global.verbose) {
      Helpers.showToast(false, 'Téléchargement de la série...');
    }
    if (global.isConnected) {
      setLoading(true);
      setErrortext('');
      APIManager.fetchSerieAlbums(serie.ID_SERIE, onSerieAlbumsFetched);
    } else {
      onSerieAlbumsFetched({ items: CollectionManager.getAlbumsInSerie(serie.ID_SERIE), error: '' });
    }
  }

  const onSerieAlbumsFetched = async (result) => {

    console.debug("serie albums fetched");

    if (!result.error) {

      const CreateSerieSections = () => {
        return [
          { title: 'Album', data: [] },
          { title: 'Intégrale', data: [] },
          { title: 'Coffret', data: [] },
          { title: 'Edition spéciale', data: [] },
        ]
      }
      let newdata = CreateSerieSections();

      // Sort/split albums by type
      for (let i = 0; i < result.items.length; i++) {
        let album = result.items[i];
        const section = CollectionManager.getAlbumType(album);
        //album = CollectionManager.getFirstAlbumEditionOfSerieInCollection(album);
        if (newdata[section].data.findIndex((it) => (it.ID_EDITION == album.ID_EDITION)) == -1) {
          newdata[section].data.push(Helpers.toDict(album));
        }
      }

      // Sort albums by ascending tome number
      newdata.forEach(entry => {
        Helpers.sortByAscendingValue(entry.data);
      });

      setSerieAlbums(newdata);

      if (global.isConnected) {
        // Now fetch the exclude status of the albums of the serie
        APIManager.fetchExcludeStatusOfSerieAlbums(serie.ID_SERIE, (result) => {
          if (!result.error) {
            // Transform the result array into a dictionary for fast&easy access
            let dict = result.items.reduce((a, x) => ({ ...a, [parseInt(x)]: 1 }), {});
            // Save all albums in all sections and set their exclude flag
            newdata.forEach(section => {
              section.data.forEach(album => {
                CollectionManager.setAlbumExcludedFlag(album, dict[parseInt(album.ID_TOME)] == 1);
              })
            })
          }
        });
      }
    }

    setErrortext(result.error);
    setLoading(false);
  }

  const onToggleShowExcludedAlbums = () => {
    Helpers.setAndSaveGlobal('showExcludedAlbums', !showExcludedAlbums);
    setShowExcludedAlbums(global.showExcludedAlbums);
  }

  const onShowSerieImage = () => {
    navigation.push('Image', { source: APIManager.getSerieCoverURL(serie) });
  }

  const getAlbums = () => {
    return serieAlbums.map(serie => serie.data).flat();
  }

 const onShowNumberOfAlbums = () => {
    if (serieAlbums[0] && serieAlbums[0].data.length > 0) {
      const nbAlbums = Math.max(serie.NB_TOME ?? 0, serie.NB_ALBUM);
      const nbOwnTomes = CollectionManager.getNbOfTomesInCollection(serie.ID_SERIE);
      Alert.alert(serie.NOM_SERIE,
        format(
          '{0} album{1} possédé{1} sur un total de {2} paru{3}.\n',
          nbOfUserAlbums, Helpers.plural(nbOfUserAlbums), nbAlbums, Helpers.plural(nbAlbums))
        +
        ((serie.NB_TOME && nbOwnTomes) ? format(
          '{0} tome{1} possédé{1} sur {2}.',
          nbOwnTomes, Helpers.plural(nbOwnTomes), serie.NB_TOME) : ''));
    }
  }

  const getAuthorsLabel = () => {
    let authors = Helpers.getAuthors(getAlbums());
    let len = authors.length;
    if (len == 1 && authors.name == 'Collectif') len++;
    return Helpers.pluralize(len, 'Auteur')
  }

  const onPressAuteur = (auteur) => {
    if (auteur != 'Collectif' && global.isConnected) {
      APIManager.fetchAuteur(auteur.id, (result) => {
        if (!result.error && result.items.length > 0) {
          navigation.push('Auteur', { author: result.items[0] });
        }
      });
    }
  }

  const renderAlbum = useCallback(({ item, index }) =>
    Helpers.isValid(item) && (global.showExcludedAlbums || (!global.showExcludedAlbums && !CollectionManager.isAlbumExcluded(item))) &&
    <AlbumItem navigation={navigation}
      item={Helpers.toDict(CollectionManager.getFirstAlbumEditionOfSerieInCollection(item))}
      index={index}
      dontShowSerieScreen={true}
      showExclude={true}
      refreshCallback={toggle} />, []);

  const keyExtractor = useCallback((item, index) =>
    Helpers.isValid(item) ? Helpers.getAlbumUID(item) : index, []);

  const getItemLayout = sectionListGetItemLayout({
    // The height of the row with rowData at the given sectionIndex and rowIndex
    getItemHeight: (rowData, sectionIndex, rowIndex) => AlbumItemHeight,
    // These four properties are optional
    getSeparatorHeight: () => 1, // The height of your separators
    getSectionHeaderHeight: () => 15, // The height of your section headers
    getSectionFooterHeight: () => 0, // The height of your section footers
    listHeaderHeight: 0, // The height of your list header
  });

  const nbOfUserAlbums = CollectionManager.getNbOfUserAlbumsInSerie(serie.ID_SERIE);

  const renderAuthors = () => {

    const authors = Helpers.getAuthors(getAlbums());
    const nbOfAuthors = authors.length;
    if (!showAllAuthors && nbOfAuthors > 6) {
      return (
        <Text style={CommonStyles.defaultText}>{getAuthorsLabel()} :{' '}
          <Text onPress={() => setShowAllAuthors(true)} style={CommonStyles.linkText}>Collectif</Text>
        </Text>);
    }
    return (nbOfAuthors > 0 ?
      <Text style={CommonStyles.defaultText}>{getAuthorsLabel()} :{' '}
        {nbOfAuthors > 6 ? <Text onPress={() => setShowAllAuthors(false)} style={CommonStyles.linkText}>Collectif : </Text> : null}
        {authors.map((auteur, index, array) => {
          if (auteur.name == 'Collectif') {
            return nbOfAuthors == 1 ? <Text key={index * 2} style={CommonStyles.defaultText}>{auteur.name}{index != (array.length - 1) ? ' / ' : ''}</Text> : null;
          }
          return (
            <Text key={index * 2 + 1} style={CommonStyles.defaultText}>
              <Text onPress={() => onPressAuteur(auteur)} style={global.isConnected ? CommonStyles.linkText : CommonStyles.defaultText}>{Helpers.reverseAuteurName(auteur.name)}</Text>
              {index != (array.length - 1) ? ' / ' : ''}
            </Text>)
        })}
      </Text> : null
    )
  }

  const ignoredSwitch = () => {
    return (
      <View style={{ flex: 1, alignItems: 'center', flexDirection: 'row', position: 'absolute', right: 5 }}>
        <Text style={CommonStyles.sectionTextStyle}>Voir ignorés</Text>
        <Switch value={showExcludedAlbums} onValueChange={onToggleShowExcludedAlbums}
          thumbColor={CommonStyles.switchStyle.color}
          trackColor={{ false: CommonStyles.switchStyle.borderColor, true: CommonStyles.switchStyle.backgroundColor }}
          style={{ marginTop: 2, transform: [{ scaleX: .7 }, { scaleY: .7 }] }} />
      </View >);
  }

  return (
    <View style={CommonStyles.screenStyle}>
      <CollapsableSection sectionName='Infos Série' isCollapsed={false} style={{ marginTop: 0 }} onCollapse={toggle} noAnimation={true} >
        <View style={{ flexDirection: 'row', marginBottom: 0, width: '100%', marginLeft: 0 }} >
          <TouchableOpacity onPress={onShowSerieImage} style={{ marginLeft: -15, marginRight: 5 }}>
            <CoverImage item={serie} category={0} style={{ height: 125 }} noResize={false} />
          </TouchableOpacity>
          <View style={{ flex: 1, flexDirection: 'row', marginRight: 4 }}>
            <View style={{ flex: 1, flexGrow: 2, }}>
              {serie.NOTE_SERIE > 0 ?
                <View style={{ marginVertical: 5 }}>
                  <RatingStars note={serie.NOTE_SERIE} showRate />
                </View> : <View style={{ height: 30 }}></View>}
              {serie.NOM_GENRE ? <Text style={CommonStyles.defaultText}>Genre : {serie.NOM_GENRE} {serie.ORIGINE ? '(' + serie.ORIGINE + ')' : null}</Text> : null}
              <Text style={CommonStyles.defaultText}>Statut : {serie.LIB_FLG_FINI_SERIE}{serie.NB_TOME && serie.LIB_FLG_FINI_SERIE != 'One Shot' ? ' - ' + serie.NB_TOME + ' tomes' : ''}</Text>
              {renderAuthors()}
              {global.showBDovoreIds ? <Text style={[CommonStyles.defaultText, CommonStyles.smallerText]}>ID-BDovore : {serie.ID_SERIE}</Text> : null}
            </View>
            <View style={{ alignContent: 'flex-end', flex: 0, marginRight: -8 }}>
              <Text onPress={onShowNumberOfAlbums} style={[CommonStyles.defaultText, { textAlign: 'right', top: 5 }]}>
                {nbOfUserAlbums + ' / ' + Math.max(serie.NB_TOME, serie.NB_ALBUM)}
                {/*serie.NB_TOME > 0 ? '\n' + CollectionManager.getNbOfTomesInCollection(serie.ID_SERIE) + ' / ' + serie.NB_TOME : ''*/}</Text>
              <SerieMarkers item={serie}
                style={CommonStyles.markersSerieViewStyle}
                reduceMode={true}
                showExclude={true}
                serieAlbums={getAlbums()}
                refreshCallback={toggle} />
            </View>
          </View>
          <View>
          </View>
        </View>
        {serie.HISTOIRE_SERIE ? <View style={{ marginTop: 4 }}>
          {!showSynopsis ? <Text onPress={() => setShowSynopsis(true)} style={CommonStyles.linkText}>Afficher le synopsis</Text> : null}
          {showSynopsis ? <Text>
            <Text style={CommonStyles.linkText} onPress={() => setShowSynopsis(false)}>Synopsis :{' '}</Text>
            <Text style={CommonStyles.defaultText}>{Helpers.removeHTMLTags(serie.HISTOIRE_SERIE)}</Text>
          </Text> : null}
        </View> : null}
      </CollapsableSection>
      {errortext != '' ? (
        <Text style={CommonStyles.errorTextStyle}>
          {errortext}
        </Text>
      ) : null}
      {loading ? <LoadingIndicator /> : (
        <SectionList
          style={{ flex: 1, marginTop: 5, marginHorizontal: 1 }}
          ref={sectionListRef}
          maxToRenderPerBatch={10}
          disableVirtualization={true}
          windowSize={10}
          sections={serieAlbums.filter(s => s.data.length > 0).map((section, index) => ({ ...section, index }))}
          keyExtractor={keyExtractor}
          renderItem={renderAlbum}
          renderSectionHeader={({ section: { title, data, index } }) => (
            <View style={[CommonStyles.sectionStyle, { alignItems: 'center', flex: 1, flexDirection: 'row', backgroundColor: CommonStyles.sectionStyle.backgroundColor }]}>
              <Text style={[CommonStyles.sectionStyle, CommonStyles.sectionTextStyle]}
              >{Helpers.pluralWord(data.length, title)}</Text>
              {/*<Text style={[{ position: 'absolute', right: 10 }, CommonStyles.sectionTextStyle]}>
                <Icon name='menu-down' size={16} color={CommonStyles.markerIconStyle} onPress={() => {
                  console.log(index + ' ... ' + (index + 1) % 4);
                  try {
                    sectionListRef.current.scrollToLocation({
                      animated: false,
                      itemIndex: -1,
                      sectionIndex: (index + 1) % 4,
                      viewPosition: 0
                    });
                  } catch (error) { }
                }}/>
              </Text>*/}
              {index == 0 && nbOfUserAlbums > 0 ? ignoredSwitch() : null}
            </View>)}
          extraData={toggleElement}
          stickySectionHeadersEnabled={true}
          ItemSeparatorComponent={Helpers.renderSeparator}
          getItemLayout={getItemLayout}
        />
      )}
    </View >
  );
}

export default SerieScreen;
