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

import React, { useMemo } from 'react';
import { FlatList, Image, Linking, TouchableOpacity } from 'react-native';

import { CommonStyles } from '../styles/CommonStyles';

const defaultSponsors = [
  {
    label: 'BDfugue',
    title: 'Achetez sur BDfugue !',
    logo: 'https://www.bdovore.com/images/bdfugue.png',
    patterns: {
      ean: 'https://www.bdfugue.com/a/?ref=295&ean={ean}',
      title: 'https://www.bdfugue.com/catalogsearch/result/?ref=295&q={title}',
    },
  },
  {
    label: 'Amazon',
    title: 'Achetez sur Amazon !',
    logo: 'https://www.bdovore.com/images/amazon%20blanc.jpg',
    patterns: {
      isbn: 'https://www.amazon.fr/exec/obidos/ASIN/{isbn}/bdovorecom-21/',
      title:
        'https://www.amazon.fr/exec/obidos/external-search?tag=bdovorecom-21&keyword={title}&mode=books-fr',
    },
  },
];

export function AchatSponsorIcon({ album, style }) {
  // Sponsored links are disabled on iOS according AppStore rules.
  if (global.hideSponsoredLinks || !global.isConnected) return null;

  let sponsorsList = defaultSponsors;
  if (global.sponsorsList) {
    try {
      const parsedList = JSON.parse(global.sponsorsList);
      if (Array.isArray(parsedList) && parsedList.length > 0) {
        sponsorsList = parsedList;
      }
    } catch (error) {
      console.debug('Unable to parse sponsors list', error);
    }
  }

  const sponsorsWithLinks = useMemo(() => {
    const shuffled = [...sponsorsList].sort(() => 0.5 - Math.random());
    return shuffled
      .map((sponsor) => {
        let url = null;
        if (sponsor.patterns.ean && album.EAN_EDITION) {
          url = sponsor.patterns.ean.replace('{ean}', album.EAN_EDITION);
        } else if (sponsor.patterns.isbn && album.ISBN_EDITION) {
          url = sponsor.patterns.isbn.replace('{isbn}', album.ISBN_EDITION);
        } else if (sponsor.patterns.title) {
          url = sponsor.patterns.title.replace(
            '{title}',
            encodeURIComponent(album.TITRE_TOME),
          );
        }
        return url ? { ...sponsor, url } : null;
      })
      .filter(Boolean);
  }, [album, sponsorsList]);

  if (sponsorsWithLinks.length === 0) {
    return null;
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => Linking.openURL(item.url)}
      title={item.title}
      style={{ marginRight: 16 }}>
      <Image
        source={{ uri: item.logo }}
        style={CommonStyles.sponsorIcon}
      />
    </TouchableOpacity>
  );

  return (
    <FlatList
      style={[{ marginTop: 10 }, style]}
      data={sponsorsWithLinks}
      horizontal
      keyExtractor={(item) => item.label}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ alignItems: 'center' }}
      renderItem={renderItem}
    />
  );
}
