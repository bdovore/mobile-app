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

import React, { useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'react-native-elements';

import { CommonStyles } from '../styles/CommonStyles';
import { Icon } from '../components/Icon';

const screen = Dimensions.get('window');
const MAX_SCALE = 4;

function ImageScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const scaleValue = useRef(new Animated.Value(1)).current;
  const scaleRef = useRef(1);
  const lastScale = useRef(1);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastTranslate = useRef({ x: 0, y: 0 });
  const [panEnabled, setPanEnabled] = useState(false);

  const resetPan = () => {
    lastTranslate.current = { x: 0, y: 0 };
    translateX.setValue(0);
    translateY.setValue(0);
  };

  const clampScale = (value) => Math.max(1, Math.min(value, MAX_SCALE));

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const nextScale = clampScale(lastScale.current * event.scale);
      scaleRef.current = nextScale;
      scaleValue.setValue(nextScale);
    })
    .onFinalize(() => {
      lastScale.current = scaleRef.current;
      const allowPan = lastScale.current > 1;
      setPanEnabled(allowPan);
      if (!allowPan) {
        resetPan();
      }
    });

  const panGesture = Gesture.Pan()
    .enabled(panEnabled)
    .onUpdate((event) => {
      const nextX = lastTranslate.current.x + event.translationX;
      const nextY = lastTranslate.current.y + event.translationY;
      translateX.setValue(nextX);
      translateY.setValue(nextY);
    })
    .onFinalize((event) => {
      lastTranslate.current = {
        x: lastTranslate.current.x + (event?.translationX ?? 0),
        y: lastTranslate.current.y + (event?.translationY ?? 0),
      };
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.closeButton, { top: insets.top + 12, right: 16 }]}
        accessibilityRole='button'
        accessibilityLabel='Fermer'>
        <Icon name='Ionicons/close' size={28} color='white' />
      </TouchableOpacity>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={styles.flex}>
          <Animated.View style={[
            styles.flex,
            {
              transform: [
                { scale: scaleValue },
                { translateX },
                { translateY },
              ],
            }
          ]}>
            <Image
              source={{ uri: route.params.source }}
              style={styles.image}
              resizeMode='contain'
              PlaceholderContent={<ActivityIndicator size='small' color='white' />}
            />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      {route.params.copyright ?
        <Text style={[CommonStyles.smallerText, styles.copyright]}>
          © {route.params.copyright}
        </Text> :
        null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
  },
  flex: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screen.width,
    height: screen.height,
  },
  closeButton: {
    position: 'absolute',
    zIndex: 2,
    padding: 8,
  },
  copyright: {
    color: 'gray',
    position: 'absolute',
    bottom: 4,
    left: 4,
  },
});

export default ImageScreen;
