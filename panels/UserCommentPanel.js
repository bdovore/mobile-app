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

import React, { useEffect, useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '../components/BottomSheet';
import { CommonStyles, windowHeight } from '../styles/CommonStyles';
import { RatingStars } from '../components/RatingStars';
import { SmallLoadingIndicator } from '../components/SmallLoadingIndicator';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';


function MakeComment(album, comment, rate) {
  return {
    "COMMENT": comment,
    "DTE_POST": Helpers.getNowDateString(),
    "ID_SERIE": album.ID_SERIE,
    "ID_TOME": album.ID_TOME,
    "IMG_COUV": album.IMG_COUV,
    "NOM_SERIE": album.NOM_SERIE ?? '',
    "NOTE": rate,
    "NUM_TOME": album.NUM_TOME,
    "TITRE_TOME": album.TITRE_TOME ?? '',
    "user_id": "???",
    "username": global.login
  }
}

function UserCommentPanel({ album, comments, isVisible, visibleSetter }) {

  const [comment, setComment] = useState('');
  const [errortext, setErrortext] = useState('');
  const [loading, setLoading] = useState(false);
  const [rate, setRate] = useState(5);

  const tome = ((album.NUM_TOME > 0) ? 'T' + album.NUM_TOME + ' - ' : '') + album.TITRE_TOME;

  useEffect(() => {
    let comment = '';
    let rate = 5;
    comments.forEach(entry => {
      if (entry.username == global.login) {
        comment = entry.COMMENT;
        rate = entry.NOTE;
      }
    });
    setComment(comment);
    setRate(rate / 2.);
  }, [isVisible]);

  const onSaveComment = () => {
    setLoading(true);
    setErrortext('');
    APIManager.sendAlbumComment(album.ID_TOME, onCommentSaved, rate * 2., comment).then(() => { }).catch(() => { });
  }

  const onCommentSaved = (result) => {
    setErrortext(result.error);
    setLoading(false);
    if (!result.error) {
      // Add the updated or new comment into the local/temporary copy of album comments
      const existingComment = comments.find((item) => item.username == global.login);
      if (existingComment) {
        existingComment.COMMENT = comment;
        existingComment.NOTE = rate * 2.;
        existingComment.DTE_POST = Helpers.getNowDateString();
      } else {
        comments.unshift(MakeComment(album, comment, rate * 2.));
      }
      visibleSetter(false);
    }
  }

  const onDeleteComment = () => {
    setLoading(true);
    setErrortext('');
    APIManager.sendAlbumComment(album.ID_TOME, onDeleteCommentSaved, 0, '').then(() => { }).catch(() => { });
  }

  const onDeleteCommentSaved = (result) => {
    setErrortext(result.error);
    setLoading(false);
    if (!result.error) {
      // Add the updated or new comment into the local/temporary copy of album comments
      const existingComment = comments.find((item) => item.username == global.login);
      if (existingComment) {
        comments.splice(existingComment, 1);
      }
      visibleSetter(false);
    }
  }

  return (
    <BottomSheet isVisible={isVisible} visibleSetter={visibleSetter} containerStyle={CommonStyles.bottomSheetContainerStyle}>
      <View style={[CommonStyles.modalViewStyle, { paddingTop: 10, marginBottom: -10, height: Platform.OS == 'ios' ? windowHeight * 0.95 : null }]}>

        {Helpers.renderAnchor()}

        <View style={{ marginTop: 10, marginBottom: 10, width: '80%' }}>
          <View style={{ margin: 0, alignItems: 'center' }}>
            <Text style={[CommonStyles.defaultText, CommonStyles.bold, CommonStyles.largerText, { textAlign: 'center' }]}>{tome}</Text>
            <View style={{ marginVertical: 10 }}>
              <RatingStars note={rate} editable={true} callback={setRate} showRate />
            </View>
            <TextInput
              multiline={true}
              placeholder='Entrez votre commentaire ici'
              numberOfLines={10}
              editable
              textContentType='none'
              autoCapitalize='sentences'
              style={[CommonStyles.commentsTextInputStyle, { flex: 0, width: '100%', margin: 0, height: 200 }]}
              onChangeText={(comment) => setComment(comment)}
              value={comment}
              autoFocus={true}
            />

            <View style={{ flexDirection: 'row', marginVertical: 15 }}>
              <Text style={CommonStyles.linkText} onPress={onDeleteComment}>Supprimer</Text>
              <View style={{ width: '30%' }}></View>
              <Text style={CommonStyles.linkText} onPress={onSaveComment}>Enregistrer</Text>
            </View>

          </View>
          {loading ? <SmallLoadingIndicator /> : null}
          {errortext ? (
            <Text style={CommonStyles.errorTextStyle}>
              {errortext}
            </Text>
          ) : null}
        </View>
      </View>
    </BottomSheet>
  );
}

export default UserCommentPanel;
