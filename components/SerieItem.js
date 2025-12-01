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

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { CommonStyles, AlbumImageWidth } from '../styles/CommonStyles';
import { CoverImage } from './CoverImage';
import { RatingStars } from './RatingStars';
import { SerieMarkers } from './SerieMarkers';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';
import CollectionManager from '../api/CollectionManager';


export function SerieItem({ navigation, item, index, collectionMode, showExclude }) {

  const onPressSerie = (navigation, item) => {

    const nbtomes = Math.max(item.NB_TOME, item.NB_ALBUM);

    if (isNaN(nbtomes)) {
      APIManager.fetchSerie(item.ID_SERIE, (result) => {
        if (result.error == '') {
          navigation.push('Serie', { item: result.items[0] });
        }
      });
    } else {
      navigation.push('Serie', { item: Helpers.toDict(item) });
    }
  }

  const nbUserAlbums = CollectionManager.getNbOfUserAlbumsInSerie(item.ID_SERIE);

  return (
    <TouchableOpacity key={index} onPress={() => onPressSerie(navigation, item)}>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: AlbumImageWidth, alignItems: 'center'}}>
          <CoverImage item={item} category={0} />
        </View>
        <View style={CommonStyles.itemTextContent} >
          <Text style={[CommonStyles.largerText, CommonStyles.itemTitleText]} numberOfLines={1} textBreakStrategy='balanced'>
            {item.NOM_SERIE}
          </Text>

          {(!collectionMode && item.NOTE_SERIE) ? <RatingStars note={item.NOTE_SERIE} /> : null}

          {(item.LIB_FLG_FINI_SERIE) ?
            <Text style={[CommonStyles.largerText, CommonStyles.itemText, { marginTop: 10 }]}>
              {item.LIB_FLG_FINI_SERIE}{item.NB_TOME && item.LIB_FLG_FINI_SERIE != 'One Shot' ? ' - ' + item.NB_TOME + ' tomes' : ''}
            </Text> : null}

          {(nbUserAlbums > 0 && item.NB_ALBUM > 0) ? (
            <Text style={[CommonStyles.itemTextWidth, CommonStyles.itemText, { marginTop: 15 }]}>
              {Helpers.pluralWord(nbUserAlbums, 'album')} sur {item.NB_ALBUM} dans la base {'\n'}
            </Text>) : null}

          {(item.nb_album) ?
            <Text style={[CommonStyles.largerText, CommonStyles.itemText, { marginTop: 10 }]}>
              {Helpers.pluralWord(item.nb_album, 'album') + ' ' + Helpers.pluralize(item.nb_album, 'manquant')}
            </Text> : null}

          {showExclude ?
            <SerieMarkers item={item} style={CommonStyles.markersViewStyle} reduceMode={true} showExclude={showExclude} />
            : null}
        </View>
      </View>
    </TouchableOpacity >
  );
}
