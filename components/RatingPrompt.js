// RatingPrompt.js - Version simplifiée avec API mise à jour
import React, { useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeInAppReview from 'react-native-in-app-review';

const RatingPrompt = () => {
  useEffect(() => {
    const checkAndRequestReview = async () => {
      try {
        // Vérifier si déjà demandé ou refusé
        const hasRated = await AsyncStorage.getItem('@hasRated');
        const hasRefused = await AsyncStorage.getItem('@hasRefusedRating');

        if (hasRated === 'true' || hasRefused === 'true') return;

        // Compter les ouvertures (5 minimum)
        const appOpens = await AsyncStorage.getItem('@appOpens');
        const opensCount = appOpens ? parseInt(appOpens) : 0;

        if (opensCount >= 5) {
          if (ReactNativeInAppReview.isAvailable()) {
            ReactNativeInAppReview.RequestInAppReview()
              .then((success) => {
                if (success) {
                  AsyncStorage.setItem('@hasRated', 'true');
                }
              })
              .catch((error) => {
                console.error('InAppReview error:', error);
                // Fallback vers store
                const url =
                  Platform.OS === 'ios'
                    ? 'itms-apps://itunes.apple.com/app/id1519677181'
                    : 'market://details?id=com.bdovore.Bdovore';
                Linking.openURL(url);
              });
          } else {
            // Fallback si API non disponible
            const url =
              Platform.OS === 'ios'
                ? 'itms-apps://itunes.apple.com/app/id1519677181'
                : 'market://details?id=com.bdovore.Bdovore';
            Linking.openURL(url);
          }
        }
      } catch (error) {
        console.error('Rating check error:', error);
      }
    };

    checkAndRequestReview();
  }, []);

  return null; // Pas d'UI custom, utilise le dialogue natif
};

export default RatingPrompt;