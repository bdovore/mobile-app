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

import React, { useEffect, useRef, useState } from 'react';
import { Image, Linking, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import NetInfo from "@react-native-community/netinfo";

import { CommonStyles } from '../styles/CommonStyles';
import { SmallLoadingIndicator } from '../components/SmallLoadingIndicator';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';
import CollectionManager from '../api/CollectionManager';


const pkg = require('../app.json');

function LoginScreen({ navigation }) {

  const [errortext, setErrortext] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwd, setPasswd] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [isConnected,setIsConnected] = useState(login != null);
  const passwdInputRef = useRef();

  useEffect(() => {
    setPseudo(global.login);
    setPasswd(global.passwd);
  }, []);

  const resetDatabaseForNewLogin = () => {
    if (pseudo != global.login) {
      console.debug('User changed - resetting the database');
      CollectionManager.resetDatabase();
    }
  }

  const onLoginPress = () => {
    setLoading(true);
    global.forceOffline = false;

    NetInfo.fetch().then(state => {
      global.isConnected = state.isConnected;
      if (global.isConnected) {
        APIManager.loginBDovore(pseudo, passwd, onConnected);
      } else {
        Helpers.showToast(false, "Utilisation en mode off-line.", "Connexion Internet désactivée.")
        onConnected({ error: '', token: 'offline-' + Date.now() });
      }
    });
  }

  const onOfflinePress = () => {
    setLoading(true);
    global.forceOffline = true;
    global.isConnected = false;
    resetDatabaseForNewLogin();
    console.debug('Utilisation forcée en mode off - line.');
    Helpers.showToast(false, 'Utilisation forcée en mode off-line.', 'Connexion au serveur désactivée.')
    onConnected({ error: '', token: 'offline-' + Date.now() });
  }

  const onConnected = (data) => {
    setLoading(false);
    setErrortext(data.error);

    if (data.error == '') {
      resetDatabaseForNewLogin();
      Helpers.setAndSaveGlobal('token', data.token);
      Helpers.setAndSaveGlobal('login', pseudo);
      Helpers.setAndSaveGlobal('passwd', passwd);
      navigation.goBack();
    }
    else {
      console.debug('error on connection: ' + data.error);
    }
  }

  const onRegister = async () => {
    try {
      const url = APIManager.bdovoreBaseURL + '/compte/inscription';
      if (await InAppBrowser.isAvailable()) {
        const result = await InAppBrowser.open(url, {
          // iOS Properties
          dismissButtonStyle: 'Cancel',
          preferredBarTintColor: '#FFFFFF',
          preferredControlTintColor: 'blue',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          modalEnabled: true,
          enableBarCollapsing: false,
          // Android Properties
          showTitle: false,
          toolbarColor: 'white',
          secondaryToolbarColor: 'black',
          navigationBarColor: 'black',
          navigationBarDividerColor: 'blue',
          enableUrlBarHiding: true,
          enableDefaultShare: false,
          forceCloseOnRedirection: false,
          // Specify full animation resource identifier(package:anim/name)
          // or only resource name(in case of animation bundled with app).
          animations: {
            startEnter: 'slide_in_right',
            startExit: 'slide_out_left',
            endEnter: 'slide_in_left',
            endExit: 'slide_out_right'
          },
          headers: {
            'my-custom-header': 'Créer mon compte'
          }
        })
        //console.debug(JSON.stringify(result));
      }
      else {
        Linking.openURL(url);
      }
    } catch (error) {
      Helpers.showToast(true, error.message);
    }
  }
  const onEditAccount = async () => {
    try {
      const url = APIManager.bdovoreBaseURL + '/compte';
      if (await InAppBrowser.isAvailable()) {
        const result = await InAppBrowser.open(url, {
          // iOS Properties
          dismissButtonStyle: 'Cancel',
          preferredBarTintColor: '#FFFFFF',
          preferredControlTintColor: 'blue',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          modalEnabled: true,
          enableBarCollapsing: false,
          // Android Properties
          showTitle: false,
          toolbarColor: 'white',
          secondaryToolbarColor: 'black',
          navigationBarColor: 'black',
          navigationBarDividerColor: 'blue',
          enableUrlBarHiding: true,
          enableDefaultShare: false,
          forceCloseOnRedirection: false,
          // Specify full animation resource identifier(package:anim/name)
          // or only resource name(in case of animation bundled with app).
          animations: {
            startEnter: 'slide_in_right',
            startExit: 'slide_out_left',
            endEnter: 'slide_in_left',
            endExit: 'slide_out_right'
          },
          headers: {
            'my-custom-header': 'Gérer mon compte'
          }
        })
        //console.debug(JSON.stringify(result));
      }
      else {
        Linking.openURL(url);
      }
    } catch (error) {
      Helpers.showToast(true, error.message);
    }
  }

  const onDisconnetPress = () => {

    global.forceOffline = false;
    global.isConnected = false;

    console.debug('Deconnexion user.');
    Helpers.showToast(false, 'Vous êtes déconnecté', 'Veuillez vous connecter de nouveau.')
    Helpers.setAndSaveGlobal('token', null);
    Helpers.setAndSaveGlobal('login', null);
    Helpers.setAndSaveGlobal('passwd', null);

    setPseudo(global.login);
    setPasswd(global.passwd);
    setIsConnected(false);
  }

  return (
    <View style={[CommonStyles.screenStyle]}>
      <ScrollView>
        <View style={{ marginTop: 20, alignItems: 'center', marginBottom: 100, backgroundColor: 'rgba(0, 0, 0, 0.0)' }}>
          <Image source={require('../assets/bdo_fond.jpg')} resizeMode='cover' style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.6 }} />
          <Image source={require('../assets/logo_v2.png')} resizeMode='cover' style={{ top: 80, height: 160, width:320,  }}/>
        </View>
        {isConnected ?
        <View>
          <View style={{height: 20}}></View>
          <Text style={[CommonStyles.defaultText, { textAlign: 'center' }]}>Vous êtes connecté en tant que {global.login}</Text>
          <Text onPress={onDisconnetPress} style={[CommonStyles.linkText, { textAlign: 'center', marginBottom: 10 }]}>Se déconnecter</Text>
          <View>


            <Text style={[CommonStyles.defaultText, { textAlign: 'center' }]}>Vous pouvez mettre à jour vos préférences ou supprimer votre compte Bdovore en vous connectant sur Bdovore.com</Text>

            <TouchableOpacity
              style={CommonStyles.loginConnectionButtonStyle}
              onPress={onEditAccount}
              title='Gérer mon compte'>
              <Text style={CommonStyles.loginConnectionTextStyle}>Gérer mon compte</Text>
            </TouchableOpacity>
            <View style={{height: 20}}></View>

            <Text onPress={onOfflinePress} style={[CommonStyles.linkText, { textAlign: 'center', marginBottom: 10 }]}>Mode offline</Text>
            <View style={{height: 100}}></View>
            <TouchableOpacity
              style={{backgroundColor: "lightgray", alignItems: 'center'}}
              onPress={() => navigation.goBack()}
              title='Fermer'>
              <Text style={CommonStyles.loginConnectionTextStyle}>Fermer</Text>
            </TouchableOpacity>

          </View>
        </View>

        : (
        <><Text style={[CommonStyles.defaultText, { marginTop: 0, marginBottom: 15, textAlign: 'center' }]}>Connectez vous avec votre compte BDovore</Text><Text style={[CommonStyles.defaultText, { textAlign: 'center' }]}>Login</Text><TextInput
              style={[CommonStyles.SectionStyle, CommonStyles.loginInputTextStyle]}
              placeholder='Entrez votre login'
              autoCapitalize='none'
              returnKeyType='next'
              blurOnSubmit={false}
              value={pseudo}
              textContentType='username' // iOS
              autoCompleteType='username' // Android
              onChangeText={(pseudo) => setPseudo(pseudo)}
              onSubmitEditing={() => { passwdInputRef.current.focus(); } }
              //blurOnSubmit={false}
              testID='login' /><Text style={[CommonStyles.defaultText, { textAlign: 'center' }]}>Mot de passe</Text><TextInput
                style={[CommonStyles.SectionStyle, CommonStyles.loginInputTextStyle]}
                ref={passwdInputRef}
                placeholder='Entrez votre mot de passe'
                secureTextEntry={true}
                value={passwd}
                autoCapitalize='none'
                returnKeyType='go'
                textContentType='password' // iOS
                autoCompleteType='password' // Android
                onChangeText={(passwd) => setPasswd(passwd)}
                onSubmitEditing={onLoginPress}
                blurOnSubmit={false}
                testID='password' />

        {errortext ? (
          <Text style={CommonStyles.errorTextStyle}>
            {errortext}
          </Text>
        ) : null}

        {loading ?
          <SmallLoadingIndicator style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            padding: 10
          }} /> :
          <View>
            <TouchableOpacity
              style={CommonStyles.loginConnectionButtonStyle}
              onPress={onLoginPress}
              title='Login'>
              <Text style={CommonStyles.loginConnectionTextStyle}>Se connecter</Text>
            </TouchableOpacity>
            </View>
        }
        <View>

            <Text style={[CommonStyles.defaultText, { textAlign: 'center' }]}>Vous n'avez pas encore de compte ?</Text>
            <Text style={[CommonStyles.defaultText, { textAlign: 'center' }]}>Rendez-vous sur <Text style={CommonStyles.linkText} onPress={() => Linking.openURL('https://bdovore.com')}>bdovore.com</Text> pour en créer un gratuitement.</Text>
            <Text style={[CommonStyles.linkText, { marginTop: 10, textAlign: 'center' }]} onPress={onRegister}>Créer mon compte</Text>

          </View>
        </>)}

        <View style={{height: 20}}></View>
      </ScrollView>
    </View>
  );
}

export default LoginScreen;
