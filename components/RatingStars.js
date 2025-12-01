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
import { Text, View } from 'react-native';
import { Rating } from 'react-native-elements';

import { CommonStyles } from '../styles/CommonStyles';
import * as Helpers from '../api/Helpers';
import Star from './Star';


export function RatingStars({ note, nbNotes, editable, callback, style, showRate, starColor = CommonStyles.ratingStarColor.color }) {

  // Note: in view only mode we use the simple & fast Star component
  return ((note && note > 0) ?
    <View style={[{ alignItems: 'baseline' }, style]}>
      {editable ?
        <View style={{ flexDirection: 'column' }}>
          <View style={{ flexDirection: 'row' }}>
            <Rating
              fractions={1}
              ratingCount={5}
              imageSize={20}
              startingValue={note}
              //tintColor={global.isDarkMode ? DarkTheme.colors.card : DefaultTheme.colors.card}
              readonly={editable ? false : true}
              onFinishRating={callback ? callback : (rate) => { }}
            />
            {showRate && <Text style={[CommonStyles.defaultText, { marginLeft: 10, marginTop: 1 }]}>
              {(Number.parseFloat(note)).toFixed(1)}</Text>}
          </View>
          {showRate && <Text style={[CommonStyles.defaultText, CommonStyles.center, { marginTop: 3 }]}>
            {Helpers.noteToString(note)} {nbNotes > 0 ? ' (' + nbNotes + ' notes)' : null}</Text>}
        </View> :
        <View style={{ flexDirection: 'row' }}>
          <Star score={parseInt(note)} totalScore={10} style={{ width: 100, height: 20, marginRight: 10 }} starColor={starColor} />
          {showRate && <Text style={[CommonStyles.defaultText, { marginTop: 1 }]}>{(Number.parseFloat(note) / 2.).toFixed(1)}</Text>}
          {showRate && nbNotes > 0 ? <Text style={[CommonStyles.defaultText, CommonStyles.evenSmallerText, { marginLeft: 5, marginTop: 1 }]}>{Helpers.pluralWord(nbNotes, 'note')}</Text> : null}
        </View>
      }
    </View> : null);
}
