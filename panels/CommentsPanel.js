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
import { ScrollView, Text, TouchableOpacity,  View } from 'react-native';

import { BottomSheet } from '../components/BottomSheet';
import { CommonStyles, windowHeight } from '../styles/CommonStyles';
import { RatingStars } from '../components/RatingStars';
import * as Helpers from '../api/Helpers';


function CommentsPanel({ comments, isVisible, visibleSetter }) {

  const getCommentDate = (item) => {
    if (!item.DTE_POST) { return ''; }
    const date = item.DTE_POST.split(' ');
    return 'le ' + Helpers.convertDate(date[0])/* + ' à ' + date[1].substring(0, 5)*/;
  }

  const renderComment = (item) => {
    return (
      item[1].NOTE > 0 ?
        <View key={item[0]} style={{
          marginHorizontal: 10,
          marginTop: 0,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: parseInt(item[0]) == 0 ? 0 : 1.0,
          borderTopColor: CommonStyles.separatorStyle.borderBottomColor
        }}>
          <View style={{ flexDirection: 'row' }}>
            <RatingStars note={item[1].NOTE} style={{ marginLeft: -2 }} showRate/>
            <Text style={CommonStyles.commentsTextStyle}>{item[1].username} {getCommentDate(item[1])}</Text>
          </View>
          <Text style={CommonStyles.defaultText}>{item[1].COMMENT}</Text>
        </View> : null);
  }

  return (
    <BottomSheet
      isVisible={isVisible}
      visibleSetter={visibleSetter}
      containerStyle={CommonStyles.bottomSheetContainerStyle}>
      <View style={[CommonStyles.modalViewStyle, { marginBottom: -10, paddingTop: 10, height: windowHeight * 0.9 }]}>

        {Helpers.renderAnchor()}

        <ScrollView style={{ flex: 1, width: '100%', marginTop: 10, marginBottom: 0 }}>
          <TouchableOpacity activeOpacity={1}>
            {Object.entries(comments).map((item) => renderComment(item))}
          </TouchableOpacity>
        </ScrollView>
          <View style={{ marginTop: 15, marginBottom: 20, alignContent: 'center', alignItems: 'center' }}>
            <Text style={[CommonStyles.linkText, CommonStyles.center]} onPress={() => visibleSetter(false)}>Fermer</Text>
          </View>
      </View>
    </BottomSheet>
  );
}

export default CommentsPanel;
