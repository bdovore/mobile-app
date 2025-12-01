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

import { Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Helpers from '../api/Helpers';
import NetInfo from "@react-native-community/netinfo";


// Defined global parameters that are saved/restored
let globs = [
  ['autoSync',               true],
  ['collectionFetched',      false],
  ['confirmDeletion',        true],
  ['explicitContent',        false],
  ['hideSponsoredLinks',     false],
  ['imageOnWifi',            false],
  ['localTimestamp',         null],
  ['login',                  null],
  ['openCollection',         false],
  ['passwd',                 null],
  ['retractableButtons',     false],
  ['showBDovoreIds',         false],
  ['showConnectionMessages', false],
  ['showExcludedAlbums',     true],
  ['sponsorsList',           null],
  ['verbose',                false],
];

class CSettingsManager {

  constructor() {
    this.initialize();
    console.debug("Settings Manager initialized");
  }

  initialize() {

    NetInfo.fetch().then(state => this.connectionCallback(state)).catch(error => { console.debug(error)});

    // Subscribe to network change events
    NetInfo.addEventListener(this.connectionCallback);

    global.token = undefined;
    global.serverTimestamp = null;

    // Set defined parameters in global array
    globs.forEach(v => global[v[0]] = v[1]);

    global['retractableButtons'] = this.isTablet() ? false : true;

    // Fetched saved values for each global variable
    AsyncStorage.multiGet(globs.map(v => v[0])).then(response => {
      const setKey = (name, value) => {
        if (value !== null && value !== undefined) {
          if (value === '0' || value === '1') {
            global[name] = (value != '0');  // treat value as boolean
          } else {
            global[name] = value;
          }
        }
      };
      response.forEach((v) => {
        setKey(v[0], v[1]);
      });
    }).catch(() => { });
  }

  connectionCallback(state) {
    //console.log(state);
    //console.debug('Connection type ' + state.type + (state.isConnected ? ' enabled' : ' disabled'));
    if (!global.forceOffline) {
      global.connectionType = state.type;
      global.isConnected = state.isConnected != null ? state.isConnected : state.isInternetReachable;
      //console.debug('Global connection state: ' + global.isConnected);
      if (showConnectionMessages) {
        Helpers.showToast(false, 'Connexion ' + state.type + (state.isConnected ? ' activée' : ' désactivée'));
      }
    }
  }

  getConnectionStatus(callback = () => {}) {
    NetInfo.fetch().then(state => {
      this.connectionCallback(state);
      if (callback) {
        callback();
      }
    }).catch(error => { console.debug(error) });
  }

  isWifiConnected() {
    return !global.forceOffline && global.connectionType == 'wifi' && global.isConnected;
  }

  // Returns true if device is detected as a tablet (empirical guess for Android!)
  isTablet() {
    if (Platform.os == 'ios') {
      return Platform.isPad;
    }

    // Roughly evaluate the diagonal dimension (in inches)
    const { height, width } = Dimensions.get('screen');
    // Note that returned screen dimensions in pixels are divided by dpi
    const widthLen = width / 160;
    const heightLen = height / 160;
    const diagLen = Math.sqrt(widthLen * widthLen + heightLen * heightLen);
    // We consider a tablet larger than 7inch
    return (diagLen >= 7);
    /*const pixelDensity = PixelRatio.get();
    const adjustedWidth = width * pixelDensity;
    const adjustedHeight = height * pixelDensity;
    if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
      return true;
    }
    return pixelDensity === 2 && (adjustedWidth >= 1920 || adjustedHeight >= 1920);*/
  }

};

const SettingsManager = new CSettingsManager();

export default SettingsManager;
