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
import { View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { ListItem } from 'react-native-elements';

import { BottomSheet } from '../components/BottomSheet';
import { CommonStyles } from '../styles/CommonStyles';
import CollectionManager from '../api/CollectionManager';
import * as Helpers from '../api/Helpers';


function CollectionPanel({ route, navigation, isVisible, visibleSetter, collectionGenre, setCollectionGenre, noAllEntry = false }) {

  const onCollectionGenreChanged = (route, navigation, mode) => {
    setCollectionGenre(mode);
    visibleSetter(false);
    navigation.dispatch({
      ...CommonActions.setParams({
        collectionGenre: mode
      }),
      source: route.key,
    });
  }

  return (
    <BottomSheet
      isVisible={isVisible}
      containerStyle={CommonStyles.bottomSheetContainerStyle}>
      <View style={[CommonStyles.modalViewStyle, { height: '80%', paddingTop: 10, paddingBottom: 10, marginBottom: -10 }]}>

        {Helpers.renderAnchor()}

        <ListItem key='0' containerStyle={CommonStyles.bottomSheetTitleStyle}>
          <ListItem.Content>
            <ListItem.Title style={[CommonStyles.bottomSheetItemTextStyle, CommonStyles.defaultText]}>Collection à afficher</ListItem.Title>
          </ListItem.Content>
        </ListItem>
        {Object.entries(CollectionManager.CollectionGenres).slice(noAllEntry ? 1 : 0).map(([mode, title], index) => (
          <ListItem key={index + 1}
            containerStyle={collectionGenre == mode ? CommonStyles.bottomSheetSelectedItemContainerStyle : CommonStyles.bottomSheetItemContainerStyle}
            onPress={() => onCollectionGenreChanged(route, navigation, mode)}>
            <ListItem.Content>
              <ListItem.Title style={collectionGenre == mode ? CommonStyles.bottomSheetSelectedItemTextStyle : CommonStyles.bottomSheetItemTextStyle}>
                {title[0]}
              </ListItem.Title>
            </ListItem.Content>
          </ListItem>
        ))}
      </View>
    </BottomSheet>
  );
}

export default CollectionPanel;
