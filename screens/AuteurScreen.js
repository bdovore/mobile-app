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

import React, { useCallback, useEffect, useState } from 'react';
import { SectionList, Text, TouchableOpacity, View } from 'react-native';

import { AlbumItem } from '../components/AlbumItem';
import { CollapsableSection } from '../components/CollapsableSection';
import { CommonStyles } from '../styles/CommonStyles';
import { CoverImage } from '../components/CoverImage';
import { SmallLoadingIndicator } from '../components/SmallLoadingIndicator';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';
import CollectionManager from '../api/CollectionManager';


function AuteurScreen({ route, navigation }) {

  const [auteurAlbums, setAuteurAlbums] = useState([]);
  const [author, setAuthor] = useState(route.params.author);
  const [errortext, setErrortext] = useState('');
  const [loading, setLoading] = useState(false);
  const [nbAlbums, setNbAlbums] = useState(-1);
  const [nbSeries, setNbSeries] = useState(-1);
  const [nbUserAlbums, setNbUserAlbums] = useState(0);
  const [toggleElement, setToggleElement] = useState(Date.now());

  const toggle = () => {
    setToggleElement(Date.now());
    refreshData();
  }

  useEffect(() => {
    refreshDataIfNeeded();
    // Make sure data is refreshed when login/token changed
    const willFocusSubscription = navigation.addListener('focus', () => {
      toggle();
    });
    return willFocusSubscription;
  }, []);

  const refreshDataIfNeeded = async () => {
    if (nbAlbums < 0) {
      console.debug("refresh author data");
      fetchData();
    }
  }

  const fetchData = () => {
    setLoading(true);
    setAuteurAlbums([]);
    setNbSeries(-1);
    setNbAlbums(-1);
    setErrortext('');
    if (global.verbose) {
      Helpers.showToast(false, 'Téléchargement de la fiche auteur...');
    }
    APIManager.fetchAlbum(onAuteurAlbumsFetched, { id_auteur: author.ID_AUTEUR });
  }

  const onAuteurAlbumsFetched = async (result) => {
    console.debug("author albums fetched");

    // Sort the albums by serie by putting them in a dictionnary of series
    let data = result.items;
    let albums = {};
    data.forEach(album => {
      var key = album.NOM_SERIE;
      if (key in albums) {
        albums[key].data.push(album);
      } else {
        albums[key] = { title: album.NOM_SERIE, id: album.ID_SERIE, data: [album] };
      }
    });

    // Sort the series dictionnary by name
    const sortObjectByKeys = (o) => {
      return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
    }
    albums = sortObjectByKeys(albums);

    // Sort each series by tome number
    const albumsArray = Object.values(albums);
    albumsArray.forEach(album => {
      Helpers.sortByAscendingValue(album.data, 'NUM_TOME');
    });

    CollectionManager.refreshAlbumSeries(albumsArray);
    setNbUserAlbums(CollectionManager.getNbOfUserAlbumsByAuthor(author.ID_AUTEUR));

    setAuteurAlbums(albumsArray);
    setNbSeries(albumsArray.length);
    setNbAlbums(result.totalItems);
    setErrortext(result.error);
    setLoading(false);
  }

  const refreshData = () => {
    CollectionManager.refreshAlbumSeries(auteurAlbums);
    setNbUserAlbums(CollectionManager.getNbOfUserAlbumsByAuthor(author.ID_AUTEUR));
  }

  const renderAlbum = useCallback(({ item, index }) =>
    Helpers.isValid(item) &&
    <AlbumItem navigation={navigation} item={Helpers.toDict(item)} index={index} dontShowSerieScreen={false} refreshCallback={toggle} />);

  const keyExtractor = useCallback((item, index) =>
    Helpers.isValid(item) ? Helpers.getAlbumUID(item) : index);

  const onPressAuthorImage = () =>
    navigation.push('Image', { source: APIManager.getAuteurCoverURL(author) });

  const onPressSerie = (id) => {
    APIManager.fetchSerie(id, (result) => {
      if (result.error == '') {
        navigation.push('Serie', { item: result.items[0] });
      }
    });
  }

  const name = author.PRENOM && author.NOM ? (author.PRENOM + ' ' + author.NOM) : '';

  return (
    <View style={CommonStyles.screenStyle}>
      <CollapsableSection sectionName='Infos Auteur' isCollapsed={false} style={{ marginTop: 0, marginBottom: 5 }} noAnimation={true} >
        <View style={{ flexDirection: 'row', marginTop: -3, marginBottom: -8 }}>
          <TouchableOpacity onPress={onPressAuthorImage} style={{ marginLeft: -15, marginRight: 0 }}>
            <CoverImage item={author} category={2} style={{ height: 125 }} noResize={false} />
          </TouchableOpacity>
          <View style={{flex: 1, marginTop: 2 }}>
            <Text style={[CommonStyles.defaultText, CommonStyles.largerText, { marginBottom: 5 }]} numberOfLines={1} textBreakStrategy='balanced'>
              {Helpers.reverseAuteurName(author.PSEUDO)}{(name != Helpers.reverseAuteurName(author.PSEUDO) && name != '') ? ' (' + name + ')' : null}
            </Text>
            {author.DTE_NAIS || author.DTE_DECES ?
              <Text style={[CommonStyles.defaultText, CommonStyles.smallerText, { marginBottom: 5}]}>
                {author.DTE_NAIS ? Helpers.dateToString(author.DTE_NAIS) : '?'} - {author.DTE_DECES ? Helpers.dateToString(author.DTE_DECES) : '?'}
              </Text> :
              null}
            <Text style={CommonStyles.defaultText}>
              {Helpers.capitalize(Helpers.getAuthorJobs(author))}
            </Text>
            {nbSeries > 0 ?
              <Text style={CommonStyles.defaultText}>
                {'\n'}{Helpers.pluralWord(nbAlbums, 'album')} pour {Helpers.pluralWord(nbSeries, 'série')}
              </Text> :
              null}
            {global.showBDovoreIds ?
              <Text style={[CommonStyles.defaultText, CommonStyles.smallerText]}>
                ID-BDovore : {author.ID_AUTEUR}
              </Text> :
              null}
          </View>
          <View style={{ alignContent: 'flex-end' }}>
            <Text style={[CommonStyles.defaultText, { textAlign: 'right', top: 5 }]}>
              {nbUserAlbums}{' / '}{nbAlbums < 0 ? '?' : nbAlbums}</Text>
          </View>
        </View>
      </CollapsableSection>
      {loading ? <SmallLoadingIndicator /> : null}
      {errortext ? (
        <Text style={CommonStyles.errorTextStyle}>
          {errortext}
        </Text>
      ) : null}
      <SectionList
        style={{ flex: 1, marginHorizontal: 1 }}
        maxToRenderPerBatch={10}
        windowSize={10}
        disableVirtualization={true}
        sections={auteurAlbums}
        keyExtractor={keyExtractor}
        renderItem={renderAlbum}
        renderSectionHeader={({ section: { title, data } }) => (
          <Text style={[CommonStyles.sectionStyle, CommonStyles.sectionTextStyle]} numberOfLines={1} textBreakStrategy='balanced'
            onPress={()=>{onPressSerie(data[0].ID_SERIE)}}>{title}</Text>)}
        stickySectionHeadersEnabled={true}
        ItemSeparatorComponent={Helpers.renderSeparator}
        extraData={toggleElement}
      />
    </View>
  );
}

export default AuteurScreen;
