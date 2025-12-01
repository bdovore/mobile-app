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

import { CommonStyles } from '../styles/CommonStyles';
import { CoverImage } from './CoverImage';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';


export function AuteurItem({ navigation, author, nbAlbums, nbSeries, noPressAction, index, canViewFullscreenImage, showId = false }) {

  return (
    <TouchableOpacity key={index} disabled={noPressAction ? true : false} onPress={() => navigation.push('Auteur', { author })}>
      <View style={{ flexDirection: 'row' }}>
        {canViewFullscreenImage ?
          <TouchableOpacity onPress={() => navigation.push('Image', { source: APIManager.getAuteurCoverURL(author) })}>
            <CoverImage item={author} category={2} />
          </TouchableOpacity> :
          <CoverImage item={author} category={2} />
        }
        <View style={[CommonStyles.itemTextContent, { marginTop: 15 }]}>
          <Text style={[CommonStyles.itemTextWidth, CommonStyles.largerText, CommonStyles.itemTitleText]} numberOfLines={1} textBreakStrategy='balanced'>
            {Helpers.reverseAuteurName(author.PSEUDO)}
          </Text>
          <Text style={[CommonStyles.itemTextWidth, CommonStyles.itemText, { fontSize: 16, marginTop: 10 }]}>
            {Helpers.capitalize(Helpers.getAuthorJobs(author))}
          </Text>
          {nbSeries && nbSeries > 0 ?
            <Text style={[CommonStyles.itemTextWidth, CommonStyles.itemText, { fontSize: 16, marginTop: 10 }]}>
              {Helpers.pluralWord(nbAlbums, 'album')} pour {Helpers.pluralWord(nbSeries, 'série')}
            </Text> :
            null}
          {showId && global.showBDovoreIds ?
            <Text style={[CommonStyles.defaultText, CommonStyles.smallerText]}>{'\n'}ID-BDovore : {author.ID_AUTEUR}</Text> :
            null}
        </View>
      </View>
    </TouchableOpacity >
  );
}
