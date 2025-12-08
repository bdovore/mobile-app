
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
import { Image, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { BottomSheet } from '../components/BottomSheet';
import { CommonStyles } from '../styles/CommonStyles';
import * as Helpers from '../api/Helpers';

const pkg = require('../app.json');


function AboutPanel({ isVisible, visibleSetter }) {

  const onToggleSponsoredLinks = () => {
    /*if (Platform.OS != 'ios')*/ {
      global.hideSponsoredLinks = !global.hideSponsoredLinks;
      Helpers.setAndSaveGlobal('hideSponsoredLinks', global.hideSponsoredLinks);
      Helpers.showToast(false, 'Sponsored linked are now ' + (global.hideSponsoredLinks ? 'disabled' : 'enabled') + '!', '', 1000, 'top');
    }
  }

  return (
    <BottomSheet isVisible={isVisible} visibleSetter={visibleSetter} containerStyle={CommonStyles.bottomSheetContainerStyle}>
      <View style={[CommonStyles.modalViewStyle, { height: '80%', paddingTop: 10, paddingBottom: 20, marginBottom: -10 }]}>

        {Helpers.renderAnchor()}

        <View style={{ marginTop: 20, alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.0)' }}>
          <Image source={require('../assets/logo_v2.png')} resizeMode='cover' style={{ height: 160, width: 320, borderRadius: 5 }} />
        </View>

        <View style={[CommonStyles.commentsTextInputStyle, {
          flexDirection: 'column', width: '90%', alignItems: 'center', marginVertical: 20,  borderRadius: 10
        }]}>
          <Text style={[CommonStyles.defaultText, CommonStyles.bold, { color: 'black', marginVertical: 10 }]}>{pkg.displayName} - {Platform.OS == 'ios' ? 'iOS' : 'Android'}</Text>
          <Text style={[CommonStyles.defaultText, { color: 'black' }]}>Version {pkg.version} - Novembre 2025</Text>
          <Text style={[CommonStyles.defaultText, { color: 'black', marginVertical: 10 }]} onPress={onToggleSponsoredLinks}>Code by Joachim Pouderoux & Thomas Cohu</Text>
        </View>

        <Text style={[CommonStyles.linkText, CommonStyles.center, { marginTop: 20 }]} onPress={() => visibleSetter(false)}>Fermer</Text>
        <Toast />
      </View>
    </BottomSheet>
  );
}

export default AboutPanel;
