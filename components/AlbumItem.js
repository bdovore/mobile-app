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

import { AlbumMarkers } from './AlbumMarkers';
import { CommonStyles, AlbumImageWidth } from '../styles/CommonStyles';
import { CoverImage } from './CoverImage';
import { Icon } from './Icon';
import { RatingStars } from './RatingStars';
import * as Helpers from '../api/Helpers';


export function AlbumItem({ navigation, item, index, collectionMode, dontShowSerieScreen, showEditionDate = false, showExclude, refreshCallback }) {

  const onPressAlbum = () => {
    navigation.push('Album', { item: Helpers.toDict(item), dontShowSerieScreen });
  }

  const showDate = () => {
    const albumDate = item.DATE_PARUTION_EDITION ?? item.DTE_PARUTION;
    if (albumDate) {
      const now = Helpers.getNowDateString().substring(0, 10);
      if (albumDate > now || showEditionDate) {
        return (
          <View style={{ flexDirection: 'row' }}>
            <Icon name={albumDate > now ? 'calendar-clock' : 'calendar-check'} size={20} style={[CommonStyles.itemText]} />
            <Text style={[CommonStyles.itemText, { marginLeft: 6 }]}>{Helpers.convertDate(albumDate)}</Text>
          </View>);
      }
    }
    return null;
  }

  return (
    <TouchableOpacity key={index} onPress={onPressAlbum} style={{ flexDirection: 'row' }}>
      <View style={{ width: AlbumImageWidth, alignItems: 'center' }}>
        <CoverImage item={item} category={1} />
      </View>
      <View style={[CommonStyles.itemTextContent, { marginRight: 0 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[CommonStyles.largerText, CommonStyles.itemTitleText]} numberOfLines={1} textBreakStrategy='balanced'>
            {item.TITRE_TOME}
          </Text>
          <RatingStars note={item.MOYENNE_NOTE_TOME} style={{ marginTop: 5 }} />
          <Text style={[CommonStyles.itemTextWidth, CommonStyles.itemText, { marginTop: 5 }]}>
            {(dontShowSerieScreen || !item.NUM_TOME || item.NUM_TOME == 0) ? '' : (item.NOM_SERIE + ' ')}{(item.NUM_TOME > 0) ? "Tome " + item.NUM_TOME : ''}{'\n\n'}
            {(item.DATE_PARUTION_EDITION || item.DTE_PARUTION) ? showDate() : null}
          </Text>
        </View>
      </View>
      {collectionMode ? null :
        <AlbumMarkers item={item}
          style={[CommonStyles.markerAlbumItemStyle]}
          reduceMode={true}
          showExclude={showExclude /*&& CollectionManager.getNbOfUserAlbumsInSerie(item.ID_SERIE) > 0 ? true : false*/}
          refreshCallback={refreshCallback} />
      }

    </TouchableOpacity>
  );
}
