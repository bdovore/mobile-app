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
import { Platform, Text, View } from 'react-native';
import { Image } from 'react-native-elements';
import SettingsManager from '../api/SettingsManager';

import { CommonStyles, AlbumImageHeight, AlbumImageWidth, FullAlbumImageHeight, FullAlbumImageWidth } from '../styles/CommonStyles';
import { Icon } from '../components/Icon';
import * as APIManager from '../api/APIManager';


export function CoverImage({ item, category, style, noResize, largeMode }) {

  const [width, setWidth] = useState(AlbumImageWidth);
  const [height, setHeight] = useState(AlbumImageHeight);
  const [source, setSource] = useState(null);

  useEffect(() => {
    switch (parseInt(category)) {
      case 0:
        setSource(APIManager.getSerieCoverURL(item));
        break;
      case 2:
        setSource(APIManager.getAuteurCoverURL(item));
        break;
      case 1:
      default:
        setSource(APIManager.getAlbumCoverURL(item));
        break;
    }
    if (largeMode) {
      Image.getSize(source, (srcWidth, srcHeight) => {
        if (srcWidth > srcHeight) {
          setWidth(FullAlbumImageHeight * 2);
          setHeight(FullAlbumImageHeight);
        } else {
          setWidth(FullAlbumImageWidth);
          setHeight(FullAlbumImageHeight);
        }
      }, (error) => { console.debug(error); });
    }
  }, [item]);

  const nodownload = !global.isConnected || (global.imageOnWifi && !SettingsManager.isWifiConnected());

  return (nodownload && Platform.OS == 'android' ?
    <View style={{ width, height, backgroundColor: 'lightgrey' }}>
      <Text style={[CommonStyles.defaultText, CommonStyles.evenSmallerText, { textAlign: 'center', height: '100%', textAlignVertical: 'center' }]}>
        <Icon name='MaterialIcons/image-not-supported' size={20} />{'\n'}
        Image{'\n'}non disponible{'\n'}hors {!global.isConnected ? 'connexion' : 'WiFi'}
      </Text>
    </View > :
    <Image
      source={{
        uri: source,
        cache: nodownload && Platform.OS == 'ios' ? 'only-if-cached' : 'default',
      }}
      style={[CommonStyles.albumImageStyle, noResize ? { resizeMode: 'cover', } : { height, width }, style]}
      //PlaceholderContent={nodownload ? null : <ActivityIndicator size='small' color={bdovored} />}
    />
  );
}
