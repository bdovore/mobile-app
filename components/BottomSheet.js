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
import { StyleSheet, ScrollView } from 'react-native';
import Modal from 'react-native-modal';


export function BottomSheet({ props, containerStyle, isVisible = false, visibleSetter = (visible) => { }, modalProps = {}, children }) {
  return (
    <Modal
      animationType='slide'
      transparent={true}
      isVisible={isVisible}
      onBackdropPress={() => visibleSetter(false)}
      onRequestClose={() => visibleSetter(false)}
      onSwipeComplete={() => visibleSetter(false)}
      swipeDirection={['down', 'right']}
      useNativeDriver={false}
      propagateSwipe={true}
      {...modalProps}
      style={styles.modalStyle}
    >

      <ScrollView style={styles.scrollViewStyle}>
        {children}
      </ScrollView>
    </Modal>);
};

const styles = StyleSheet.create({
  modalStyle: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 0,
  },

  scrollViewStyle: {
    flex: 1,
    flexDirection: 'column-reverse',
  },
  listContainer: { backgroundColor: 'white' },
});

