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

import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import CollectionManager from '../api/CollectionManager';
import { CommonStyles, bdovored } from '../styles/CommonStyles';
import { Icon } from '../components/Icon';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';
import Toast from 'react-native-toast-message';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

function BarcodeScanner({ route, navigation }) {
  const [autoAddMode, setAutoAddMode] = useState(false);
  const [lastEan, setLastEan] = useState('');
  const isFocused = useIsFocused();
  const isScanning = useRef(false);
  const [loading, setLoading] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [nbAddedAlbums, setNbAddedAlbums] = useState(0);
  const [showPropositionButton, setShowPropositionButton] = useState(false);
  const [lastScannedEan, setLastScannedEan] = useState('');
  const [lastAddedAlbum, setLastAddedAlbum] = useState('');
  const [hasPermission, setHasPermission] = useState(null);


  // FIX 1 - Écran noir : délai d'activation + état "caméra prête"
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const device = useCameraDevice('back');

  const getCameraPermissionStatus = async () => {
    return await Promise.resolve(Camera.getCameraPermissionStatus());
  };

  const requestCameraPermission = async () => {
    return await Promise.resolve(Camera.requestCameraPermission());
  };

  const syncCameraPermission = async (requestIfNeeded = false) => {
    let status = await getCameraPermissionStatus();
    if (status !== 'granted' && requestIfNeeded) {
      status = await requestCameraPermission();
    }
    const granted = status === 'granted';
    setHasPermission(granted);
    return granted;
  };

  // ──────────────────────────────────────────────
  // FIX 2 - Permission : re-check à chaque focus
  // Remplace l'ancien useEffect([], []) qui ne checkait qu'au mount.
  // Sur Android 16 (Pixel 6+), les one-time permissions sont révoquées
  // silencieusement quand l'app perd le foreground. Il faut donc
  // re-vérifier à chaque retour sur cet écran.
  // ──────────────────────────────────────────────
  useEffect(() => {
  if (!isFocused) return;

  const checkPermission = async () => {
      await syncCameraPermission(true);
  };

  checkPermission();
}, [isFocused]);

  // ──────────────────────────────────────────────
  // FIX 2 bis - Re-check permission au retour foreground
  // Couvre le cas lock/unlock et switch app sur Android 16.
  // ──────────────────────────────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && isFocused) {
        syncCameraPermission(false);
      }
    });
    return () => subscription.remove();
  }, [isFocused]);

  // ──────────────────────────────────────────────
  // FIX 1 - Activation caméra avec délai
  // Sur certains Android (LineageOS, Pixel récents), le HAL caméra
  // met 100-400ms à s'initialiser. Sans ce délai, le composant
  // Camera est monté mais le flux vidéo n'est pas encore prêt
  // → écran noir.
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (isFocused && hasPermission) {
      const timer = setTimeout(() => setCameraActive(true), 200);
      return () => clearTimeout(timer);
    } else {
      setCameraActive(false);
      setCameraReady(false);
    }
  }, [isFocused, hasPermission]);

  // Reset du verrou de scan au focus
  useEffect(() => {
    const sub = navigation.addListener('focus', () => {
      isScanning.current = false;
    });
    return sub;
  }, []);

  const searchAndAddAlbumWithEAN = (ean) => {
    if (lastEan === ean) {
      setTimeout(() => { isScanning.current = false; }, 2000);
      return;
    }

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
          "Essayez la recherche textuelle avec le nom de la série ou de l'album",
          5000);
        ReactNativeHapticFeedback.trigger("notificationError", options);
        setShowPropositionButton(true);
        setLastScannedEan(ean);
      }
      setTimeout(() => {
        isScanning.current = false;
      }, 2000);

      setLoading(false);
    }, params);
  }

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && !isScanning.current) {
        const ean = codes[0].value;
        if (!ean) return;

        ReactNativeHapticFeedback.trigger("impactLight", options);
        isScanning.current = true;

        if (autoAddMode) {
          handleAutoAdd(ean);
        } else {
          handleManualSearch(ean);
        }
      }
    }
  });

  const handleAutoAdd = (ean) => {
    if (global.isConnected) {
      searchAndAddAlbumWithEAN(ean);
    } else {
      Helpers.showToast(true,
        "Connexion internet désactivée",
        "Rechercher de l'album impossible");
      isScanning.current = false;
    }
  }

  const handleManualSearch = (ean) => {
    setLoading(true);
    let params = (ean.length > 10) ? { EAN: ean } : { ISBN: ean };

    APIManager.fetchAlbum((result) => {
      setLoading(false);
      if (result.error == '' && result.items.length > 0) {
        navigation.goBack();
        navigation.push('Album', { item: result.items[0] });
      } else {
        Helpers.showToast(true, "Aucun album trouvé", "...");
        setTimeout(() => {
          isScanning.current = false;
        }, 2000);
      }
    }, params);
  };

  const onTorchPress = () => {
    setTorchOn(!torchOn);
  }

  const onAutoAddModePress = () => {
    setAutoAddMode(global.isConnected ? !autoAddMode : false);
  }

  const openPropositionForm = async (ean) => {
    APIManager.addProposition(ean);
  }

  // ── Écran "pas de permission" ──
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={bdovored} />
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', margin: 20 }}>
          Permission d'utilisation de la caméra requise
        </Text>
        <TouchableOpacity
          style={[CommonStyles.loginConnectionButtonStyle, { marginBottom: 30 }]}
          onPress={() => syncCameraPermission(true)}
        >
          <Text style={CommonStyles.loginConnectionTextStyle}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Pas de device caméra trouvé ──
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
        isActive={cameraActive}
        codeScanner={codeScanner}
        torch={torchOn ? 'on' : 'off'}
        onInitialized={() => setCameraReady(true)}
        onError={(error) => console.warn('Camera error:', error)}
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
      </Camera>

      {/* FIX 1 - Placeholder pendant l'initialisation caméra */}
      {!cameraReady && (
        <View style={styles.cameraPlaceholder}>
          <ActivityIndicator size="large" color={bdovored} />
          <Text style={{ color: 'white', marginTop: 10, fontSize: 14 }}>
            Initialisation de la caméra...
          </Text>
        </View>
      )}

      <Toast />
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
  // FIX 1 - Style du placeholder pendant l'init caméra
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

export default BarcodeScanner;