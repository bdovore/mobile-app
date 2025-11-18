/* Copyright 2021-2022 Joachim Pouderoux & Association BDovore
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
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';

import CollectionManager from '../api/CollectionManager';
import { CommonStyles, bdovored } from '../styles/CommonStyles';
import { Icon } from '../components/Icon';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';

let eanFound = false;

function BarcodeScanner({ route, navigation }) {
  const [autoAddMode, setAutoAddMode] = useState(false);
  const [lastEan, setLastEan] = useState('');
  const [loading, setLoading] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [nbAddedAlbums, setNbAddedAlbums] = useState(0);
  const [showPropositionButton, setShowPropositionButton] = useState(false);
  const [lastScannedEan, setLastScannedEan] = useState('');
  const [lastAddedAlbum, setLastAddedAlbum] = useState('');
  const [hasPermission, setHasPermission] = useState(false);

  const device = useCameraDevice('back');

  useEffect(() => {
    const willFocusSubscription = navigation.addListener('focus', () => {
      eanFound = false;
    });
    return willFocusSubscription;
  }, []);

  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      setHasPermission(cameraPermission === 'granted');
    })();
  }, []);

  const searchAndAddAlbumWithEAN = (ean) => {
    if (lastEan != ean) {
      setLastEan(ean);
      setLoading(true);
      let params = (ean.length > 10) ? { EAN: ean } : { ISBN: ean };
      APIManager.fetchAlbum((result) => {
        if (result.error == '' && result.items.length > 0) {
          const album = result.items[0];
          let albumName = Helpers.getAlbumName(album);
          albumName += (albumName != album.NOM_SERIE ? ' / ' + album.NOM_SERIE : '');
          if (!CollectionManager.isAlbumInCollection(album)) {
            CollectionManager.addAlbumToCollection(album);
            Helpers.showToast(false,
              'Nouvel album ajouté à la collection',
              albumName);
            setNbAddedAlbums(nbAddedAlbums => nbAddedAlbums + 1);
            setLastAddedAlbum(albumName);
          } else {
            Helpers.showToast(true,
              'Album déjà présent dans la collection',
              albumName);
          }
        } else {
          Helpers.showToast(true,
            "Aucun album trouvé avec ce code",
            "Essayez la recherche textuelle avec le nom de la série ou de l'album");
          setShowPropositionButton(true);
          setLastScannedEan(ean);
        }
        eanFound = false;
        setLoading(false);
      }, params);
    } else {
      eanFound = false;
    }
  }

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && !eanFound) {
        const ean = codes[0].value;
        if (!eanFound && ean) {
          eanFound = true;
          if (autoAddMode) {
            if (global.isConnected) {
              searchAndAddAlbumWithEAN(ean);
            } else {
              Helpers.showToast(true,
                "Connexion internet désactivée",
                "Rechercher de l'album impossible");
              eanFound = false;
            }
          } else {
            setLoading(true);
            let params = (ean.length > 10) ? { EAN: ean } : { ISBN: ean };
            APIManager.fetchAlbum((result) => {
              if (result.error == '' && result.items.length > 0) {
                navigation.goBack();
                navigation.push('Album', { item: result.items[0] })
              } else {
                Helpers.showToast(true,
                  "Aucun album trouvé",
                  "Aucun album trouvé avec ce code. Essayez la recherche textuelle avec le nom de la série ou de l'album.");
              }
              eanFound = false;
              setLoading(false);
            }, params);
          }
        }
      }
    }
  });

  const onTorchPress = () => {
    setTorchOn(!torchOn);
  }

  const onAutoAddModePress = () => {
    setAutoAddMode(global.isConnected ? !autoAddMode : false);
  }

  const openPropositionForm = async (ean) => {
    APIManager.addProposition(ean)
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', margin: 20 }}>
          Permission d'utilisation de la caméra requise
        </Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={bdovored} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.preview}
        device={device}
        isActive={true}
        codeScanner={codeScanner}
        torch={torchOn ? 'on' : 'off'}
      >
        <View style={{ position: 'absolute', top: 0, width: '100%', backgroundColor: 'white', flexDirection: 'row', padding: 5 }}>
          <Icon name='FontAwesome5/barcode' size={45} color='black' style={{ marginLeft: 5 }} />
          {loading ? <ActivityIndicator size="small" color={bdovored} style={[CommonStyles.markerIconStyle, { borderWidth: 0 }]} /> : null}
          <Text style={{ width: '80%', alignSelf: 'center', textAlign: 'center', backgroundColor: 'white', fontSize: 14, margin: 5, paddingLeft: 10, }}>
            {!autoAddMode ? "Visez le code-barre de l'album.\nLa recherche est automatique." : (
              (nbAddedAlbums == 0 ?
                <Text style={{ fontSize: 14, textAlign: 'center' }}>
                  Mode ajout automatique activé : les albums{'\n'}
                  détectés seront ajoutés à votre collection.
                </Text> :
                <Text style={{ fontSize: 15, textAlign: 'center', }} numberOfLines={2} textBreakStrategy='balanced'>
                  {Helpers.pluralWord(nbAddedAlbums, 'album') + ' ' + Helpers.pluralize(nbAddedAlbums, 'ajouté')}.{'\n'}
                  Dernier ajout : {lastAddedAlbum}
                </Text>))}
          </Text>
        </View>
        {showPropositionButton && (
          <View style={{ position: "absolute", left: 0, bottom: 5 }}>
            <TouchableOpacity
              onPress={() => openPropositionForm(lastScannedEan)}
              style={styles.cameraIcon}
            >
              <Icon name='MaterialIcons/add-circle' size={30} color={bdovored} />
            </TouchableOpacity>
          </View>
        )}
      </Camera>
      <View style={{ position: "absolute", right: 0, bottom: 5 }}>
        <TouchableOpacity onPress={onAutoAddModePress}>
          <Icon name={'MaterialIcons/playlist-add'} size={30} color={autoAddMode ? bdovored : 'black'} style={styles.cameraIcon} />
        </TouchableOpacity>
      </View>
      <View style={{ position: "absolute", right: 0, bottom: 65 }}>
        <TouchableOpacity onPress={onTorchPress}>
          <Icon name={torchOn ? 'Ionicons/flashlight' : 'Ionicons/flashlight-outline'} size={30} color={torchOn ? 'orange' : 'black'} style={styles.cameraIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cameraIcon: {
    margin: 10,
    height: 40,
    width: 40,
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 30,
  },
  bottomOverlay: {
    position: "absolute",
    right: 0,
  },
});

export default BarcodeScanner;