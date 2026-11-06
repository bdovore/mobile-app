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
import {AlbumMarkers} from './AlbumMarkers';
import {Icon} from './Icon';
import {CommonStyles} from '../styles/CommonStyles';
import {CoverGridItem, CoverGridDetail} from './CoverGridItem';
import * as Helpers from '../api/Helpers';

export function AlbumGridItem({
  navigation,
  item,
  width,
  showEditionDate = false,
  showExclude = false,
  showOwn = true,
  actionsOnCover = false,
}) {
  const editionDate = item.DATE_PARUTION_EDITION ?? item.DTE_PARUTION;
  return (
    <CoverGridItem
      item={item}
      width={width}
      category={1}
      title={item.TITRE_TOME}
      onPress={() => navigation.push('Album', {item: Helpers.toDict(item)})}
      actionsOnCover={actionsOnCover}
      actions={
        showExclude ? (
          <AlbumMarkers
            item={item}
            showOwn={showOwn}
            reduceMode={true}
            showExclude={true}
            markerBackgroundColor={
              actionsOnCover ? 'rgba(64, 64, 64, 0.45)' : undefined
            }
          />
        ) : null
      }>
      <CoverGridDetail>
        {item.NOM_SERIE}
        {item.NUM_TOME > 0 ? ` · Tome ${item.NUM_TOME}` : ''}
      </CoverGridDetail>
      {showEditionDate ? (
        <CoverGridDetail>
          {editionDate ? (
            <>
              <Icon
                name={
                  editionDate > Helpers.getNowDateString().substring(0, 10)
                    ? 'calendar-clock'
                    : 'calendar-check'
                }
                size={14}
                style={CommonStyles.itemText}
              />{' '}
              {Helpers.convertDate(editionDate)}
            </>
          ) : (
            ' '
          )}
        </CoverGridDetail>
      ) : null}
    </CoverGridItem>
  );
}
