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
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {CoverImage} from './CoverImage';
import {CommonStyles} from '../styles/CommonStyles';

export function CoverGridItem({
  item,
  width,
  category,
  title,
  onPress,
  children,
  actions,
  actionsOnCover = false,
}) {
  const {fontScale} = useWindowDimensions();
  const actionArea = actions ? (
    <View
      style={[
        styles.actions,
        {height: 72 * fontScale},
        actionsOnCover && styles.coverActions,
      ]}>
      {actions}
    </View>
  ) : null;
  return (
    <TouchableOpacity
      style={[styles.card, {width}]}
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}>
      <View style={{width: width - 22, height: ((width - 22) * 244) / 180}}>
        <CoverImage
          item={item}
          category={category}
          style={{width: width - 22, height: ((width - 22) * 244) / 180}}
        />
        {actionsOnCover ? actionArea : null}
      </View>
      <Text
        style={[
          CommonStyles.defaultText,
          styles.title,
          {height: 20 * fontScale},
        ]}
        numberOfLines={1}
        ellipsizeMode="tail">
        {title}
      </Text>
      {children}
      {!actionsOnCover ? actionArea : null}
    </TouchableOpacity>
  );
}

export function CoverGridDetail({children}) {
  const {fontScale} = useWindowDimensions();
  return (
    <Text
      style={[CommonStyles.itemText, styles.detail, {height: 18 * fontScale}]}
      numberOfLines={1}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  card: {alignItems: 'center', paddingHorizontal: 11, paddingVertical: 4},
  actions: {alignSelf: 'stretch', flexGrow: 0, flexShrink: 0},
  coverActions: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    maxWidth: '100%',
    borderRadius: 4,
  },
  title: {
    alignSelf: 'stretch',
    textAlign: 'left',
    marginTop: 6,
    lineHeight: 20,
  },
  detail: {
    alignSelf: 'stretch',
    textAlign: 'left',
    fontSize: 12,
    lineHeight: 18,
  },
});
