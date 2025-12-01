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
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';

import { CommonStyles, bdovored, bdovorlightred } from '../styles/CommonStyles';
import { Icon } from '../components/Icon';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';
import CollectionManager from '../api/CollectionManager';

const pBits = {
  'addingall': 1,
  'excluding': 2,
};

export function SerieMarkers({ item, serieAlbums, style, showExclude, refreshCallback = () => { } }) {

  const [isExcluded, setIsExcluded] = useState(false);
  const [processingState, setProcessingState] = useState(0);
  const [serie, setSerie] = useState(item);

  const setProcessingBit = (flag, value) => {
    if (value) {
      setProcessingState(processingState => processingState | pBits[flag]);
    } else {
      setProcessingState(processingState => processingState & ~pBits[flag]);
    }
  }

  const isProcessing = (flag) => {
    return processingState & pBits[flag];
  }

  const refresh = () => {
    setIsExcluded(CollectionManager.isSerieExcluded(serie));
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    refresh();
  }, [serieAlbums]);

  const addEverything = () => {
    if (!Helpers.checkConnection()) { return; }

    setProcessingBit('addingall', true);
    CollectionManager.addSerieToCollection(serie, serieAlbums, () => {
      refreshCallback();
      setProcessingBit('addingall', false);
    });
  }

  const addAlbums = () => {
    if (!Helpers.checkConnection()) { return; }

    setProcessingBit('addingall', true);
    CollectionManager.addSerieAlbumsToCollection(serie, serieAlbums, () => {
      refreshCallback();
      setProcessingBit('addingall', false);
    });
  }

  const onHaveAll = () => {
    if (!global.isConnected) { return; }

    Alert.alert(
      serie.NOM_SERIE,
      "Que souhaitez-vous ajouter à votre collection ?",
      [{
        text: "Tout",
        onPress: () => addEverything()
      }, {
        text: "Que les albums",
        onPress: () => addAlbums()
      }, {
        text: "Annuler",
        onPress: () => { },
        style: "cancel"
      }],
      { cancelable: true });
  }

  const onExcludeIt = async () => {
    if (!global.isConnected) { return; }

    const exclude = !(serie.IS_EXCLU == 1);
    setProcessingBit('excluding', true);
    const callback = (result) => {
      if (!result.error) {
        global.db.write(() => {
          serie.IS_EXCLU = exclude ? 1 : 0;
        });
        setIsExcluded(exclude == 1);
        refreshCallback();
        setProcessingBit('excluding', false);
      }
    };
    if (exclude) {
      APIManager.excludeSerie(serie, callback);
      CollectionManager.setSerieExcludeFlag(serie, true);
    } else {
      APIManager.includeSerie(serie, callback);
      CollectionManager.setSerieExcludeFlag(serie, false);
    }
  }

  const MarkerLoadingIndicator = () => (
    <View style={[CommonStyles.markerStyle]}>
      <ActivityIndicator size="small" color={global.isDarkMode ? bdovorlightred : bdovored} style={CommonStyles.markerIconStyle} />
      <Text style={CommonStyles.markerTextStyle}>{' '}</Text>
    </View>);

  const nbOfUserAlbums = CollectionManager.getNbOfUserAlbumsInSerie(serie.ID_SERIE);
  const isSerieComplete = CollectionManager.isSerieComplete(serie.ID_SERIE);
  const isSerieExcluded = serie.IS_EXCLU == 1;

  return (
    <View style={[{ flexDirection: 'row' }, style, { marginRight: 3 }]}>

      {isProcessing('addingall') ? <MarkerLoadingIndicator /> :
        (nbOfUserAlbums == 0 && serieAlbums && serieAlbums.length > 0 ?
          <TouchableOpacity onPress={onHaveAll} title="" style={CommonStyles.markerStyle}>
            <Icon name={isSerieComplete ? 'check-bold' : 'check'} size={25} color={isSerieComplete ? CommonStyles.markIconEnabled.color : CommonStyles.markIconDisabled.color} style={[CommonStyles.markerIconStyle, { width: 30 }]} />
            <Text style={[CommonStyles.markerTextStyle, isSerieComplete ? CommonStyles.markIconEnabled : CommonStyles.markIconDisabled]}>J'ai tout !</Text>
          </TouchableOpacity> : null)}

      {isProcessing('excluding') ? <MarkerLoadingIndicator /> :
        (nbOfUserAlbums > 0 && showExclude ?
          <TouchableOpacity onPress={onExcludeIt} title="" style={CommonStyles.markerStyle}>
            <Icon name='cancel' size={25} color={isSerieExcluded ? CommonStyles.markWishIconEnabled.color : CommonStyles.markIconDisabled.color} style={[CommonStyles.markerIconStyle, isSerieExcluded ? { fontWeight: 'bold' } : null]} />
            <Text style={[CommonStyles.markerTextStyle, isSerieExcluded ? CommonStyles.markWishIconEnabled : CommonStyles.markIconDisabled]}>Ignorer</Text>
          </TouchableOpacity> : null)}

    </View>);
}
