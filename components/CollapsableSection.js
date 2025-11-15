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

import React, { useState } from 'react';
import { LayoutAnimation, Text, TouchableOpacity, UIManager, View } from 'react-native';

import { CommonStyles } from '../styles/CommonStyles';
import { Icon } from '../components/Icon';


export function CollapsableSection({ props, sectionName, isCollapsed = false, style = null, collapsable = true, children, onCollapse = (v) =>{}, noAnimation = false }) {

  const [collasped, setCollapsed] = useState(isCollapsed);

  const onCollapsePress = () => {
    if (collapsable) {
      if (!noAnimation) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setCollapsed(isCollapsed => !isCollapsed);
      if (onCollapse) {
        onCollapse(isCollapsed => !isCollapsed);
      }
    }
  }

  return (
    <View style={[{ marginTop: 10, marginHorizontal: 1 }, style]}>
      <TouchableOpacity onPress={onCollapsePress}>
        <View style={[CommonStyles.sectionAlbumStyle, { flexDirection: 'row', alignItems: 'center', }]}>
          <Text style={[CommonStyles.sectionTextStyle]}>{sectionName}</Text>
          {collapsable &&
          <Text style={[{ position: 'absolute', right: 10 }, CommonStyles.sectionTextStyle]}>
            <Icon name={collasped ? 'menu-down' : 'menu-up'} size={16} color={CommonStyles.markerIconStyle} />
          </Text>}
        </View>
      </TouchableOpacity>
      {!collasped ? <View style={{ marginVertical: 5, marginHorizontal: 10 }}>{children}</View> : null}
    </View>);
}
