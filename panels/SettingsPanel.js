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

import React, { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { BottomSheet } from '../components/BottomSheet';
import { CommonStyles } from '../styles/CommonStyles';
import * as Helpers from '../api/Helpers';


function SettingsPanel({ isVisible, visibleSetter }) {

  const [autoSync, setAutoSync] = useState(global.autoSync);
  const [confirmDeletion, setConfirmDeletion] = useState(global.confirmDeletion);
  const [imageOnWifi, setImageOnWifi] = useState(global.imageOnWifi);
  const [retractableButtons, setRetractableButtons] = useState(global.retractableButtons);
  const [showBDovoreIds, setShowBDovoreIds] = useState(global.showBDovoreIds);
  const [showConnectionMessages, setShowConnectionMessages] = useState(global.showConnectionMessages);
  const [verbose, setVerbose] = useState(global.verbose);

  useFocusEffect(() => {
    setAutoSync(global.autoSync);
    setConfirmDeletion(global.confirmDeletion);
    setImageOnWifi(global.imageOnWifi);
    setRetractableButtons(global.retractableButtons);
    setShowBDovoreIds(global.showBDovoreIds);
    setShowConnectionMessages(global.showConnectionMessages);
    setVerbose(global.verbose);
  });

  const onSwitchImageOnWifi = (value) => {
    setImageOnWifi(value);
    Helpers.setAndSaveGlobal('imageOnWifi', value);
  };

  const onSwitchAutoSync = (value) => {
    setAutoSync(value);
    Helpers.setAndSaveGlobal('autoSync', value);
  }

  const onSwitchRetractableButtons = (value) => {
    setRetractableButtons(value);
    Helpers.setAndSaveGlobal('retractableButtons', value);
  }

  const onSwitchVerbose = (value) => {
    setVerbose(value);
    Helpers.setAndSaveGlobal('verbose', value);
  };

  const onSwitchBDovoreIds = (value) => {
    setShowBDovoreIds(value);
    Helpers.setAndSaveGlobal('showBDovoreIds', value);
  }

  const onSwitchConfirmDeletion = (value) => {
    setConfirmDeletion(value);
    Helpers.setAndSaveGlobal('confirmDeletion', value);
  }

  const onSwitchConnectionMessages = (value) => {
    setShowConnectionMessages(value);
    Helpers.setAndSaveGlobal('showConnectionMessages', value);
  }

  return (
    <BottomSheet isVisible={isVisible} visibleSetter={visibleSetter} containerStyle={CommonStyles.bottomSheetContainerStyle}>
      <View style={[CommonStyles.modalViewStyle, { height: '80%', paddingTop: 10, paddingBottom: 20, marginBottom: -10 }]}>

        {Helpers.renderAnchor()}

        <View style={{
           flexDirection: 'row', flex: 1, width: '80%', paddingVertical: 10, marginHorizontal: 10, justifyContent: 'space-between' }}>
          <Text style={CommonStyles.defaultText}>Images uniquement en Wifi</Text>
          <View style={{ flex: 1 }}></View>
          <Switch value={imageOnWifi} onValueChange={onSwitchImageOnWifi}
            style={{ marginTop: -5 }}
            thumbColor={CommonStyles.switchStyle.color}
            trackColor={{ false: CommonStyles.switchStyle.borderColor, true: CommonStyles.switchStyle.backgroundColor }} />
        </View>

        <View style={{
          flexDirection: 'row', flex: 1, width: '80%', paddingVertical: 10, marginHorizontal: 10, justifyContent: 'space-between',
          borderTopWidth: 1.0, borderTopColor: CommonStyles.separatorStyle.borderBottomColor
        }}>
          <Text style={CommonStyles.defaultText}>Synchronisation automatique</Text>
          <View style={{ flex: 1 }}></View>
          <Switch value={autoSync} onValueChange={onSwitchAutoSync}
            style={{ marginTop: -5 }}
            thumbColor={CommonStyles.switchStyle.color}
            trackColor={{ false: CommonStyles.switchStyle.borderColor, true: CommonStyles.switchStyle.backgroundColor }} />
        </View>

        <View style={{
          flexDirection: 'row', flex: 1, width: '80%', paddingVertical: 10, marginHorizontal: 10, justifyContent: 'space-between',
          borderTopWidth: 1.0, borderTopColor: CommonStyles.separatorStyle.borderBottomColor
        }}>
          <Text style={CommonStyles.defaultText}>Boutons albums retractables</Text>
          <View style={{ flex: 1 }}></View>
          <Switch value={retractableButtons} onValueChange={onSwitchRetractableButtons}
            style={{ marginTop: -5 }}
            thumbColor={CommonStyles.switchStyle.color}
            trackColor={{ false: CommonStyles.switchStyle.borderColor, true: CommonStyles.switchStyle.backgroundColor }} />
        </View>

        <View style={{
          flexDirection: 'row', flex: 1, width: '80%', paddingVertical: 10, marginHorizontal: 10, justifyContent: 'space-between',
          borderTopWidth: 1.0, borderTopColor: CommonStyles.separatorStyle.borderBottomColor
        }}>
          <Text style={CommonStyles.defaultText}>Informations de débogage</Text>
          <View style={{ flex: 1 }}></View>
          <Switch value={verbose} onValueChange={onSwitchVerbose}
            style={{ marginTop: -5 }}
            thumbColor={CommonStyles.switchStyle.color}
            trackColor={{ false: CommonStyles.switchStyle.borderColor, true: CommonStyles.switchStyle.backgroundColor }} />
        </View>

        <View style={{
          flexDirection: 'row', flex: 1, width: '80%', paddingVertical: 10, marginHorizontal: 10, justifyContent: 'space-between',
          borderTopWidth: 1.0, borderTopColor: CommonStyles.separatorStyle.borderBottomColor
        }}>
          <Text style={CommonStyles.defaultText}>Afficher les identifiants BDovore</Text>
          <View style={{ flex: 1 }}></View>
          <Switch value={showBDovoreIds} onValueChange={onSwitchBDovoreIds}
            style={{ marginTop: -5 }}
            thumbColor={CommonStyles.switchStyle.color}
            trackColor={{ false: CommonStyles.switchStyle.borderColor, true: CommonStyles.switchStyle.backgroundColor }} />
        </View>

        <View style={{
          flexDirection: 'row', flex: 1, width: '80%', paddingVertical: 10, marginHorizontal: 10, justifyContent: 'space-between',
          borderTopWidth: 1.0, borderTopColor: CommonStyles.separatorStyle.borderBottomColor
        }}>
          <Text style={CommonStyles.defaultText}>Confirmer les suppressions</Text>
          <View style={{ flex: 1 }}></View>
          <Switch value={confirmDeletion} onValueChange={onSwitchConfirmDeletion}
            style={{ marginTop: -5 }}
            thumbColor={CommonStyles.switchStyle.color}
            trackColor={{ false: CommonStyles.switchStyle.borderColor, true: CommonStyles.switchStyle.backgroundColor }} />
        </View>

        <View style={{
          flexDirection: 'row', flex: 1, width: '80%', paddingVertical: 10, marginHorizontal: 10, justifyContent: 'space-between',
          borderTopWidth: 1.0, borderTopColor: CommonStyles.separatorStyle.borderBottomColor
        }}>
          <Text style={CommonStyles.defaultText}>Afficher les messages de connexion</Text>
          <View style={{ flex: 1 }}></View>
          <Switch value={showConnectionMessages} onValueChange={onSwitchConnectionMessages}
            style={{ marginTop: -5 }}
            thumbColor={CommonStyles.switchStyle.color}
            trackColor={{ false: CommonStyles.switchStyle.borderColor, true: CommonStyles.switchStyle.backgroundColor }} />
        </View>

        <Text style={[CommonStyles.linkText, CommonStyles.center, {marginTop: 20}]} onPress={() => visibleSetter(false)}>Fermer</Text>
      </View>
    </BottomSheet>
  );
}

export default SettingsPanel;
