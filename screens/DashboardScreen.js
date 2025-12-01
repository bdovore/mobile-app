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

import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { CommonStyles } from '../styles/CommonStyles';
import { CoverImage } from '../components/CoverImage';
import { Icon } from '../components/Icon';
import CollectionManager from '../api/CollectionManager';
import { CollapsableSection } from '../components/CollapsableSection';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';
import { ScreenWidth } from 'react-native-elements/dist/helpers';
import { LoadingIndicator } from '../components/LoadingIndicator';


let timeout = null;

function DashboardScreen({ route, navigation }) {

  const [errortext, setErrortext] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(route.params.userid);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
    // Make sure data is refreshed when login/token changed
    const willFocusSubscription = navigation.addListener('focus', () => {
      fetchData();
    });
    return () => {
      willFocusSubscription();
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const fetchData = () => {
    if (global.isConnected) {
      if (global.verbose) {
        Helpers.showToast(false, 'Téléchargement des informations utilisateur...');
      }
      setLoading(true);
      setErrortext('');
      fetchInfo();
    } else if (!timeout && (!data || data.length == 0)) {
      if (verbose) {
        Helpers.showToast(false, 'Will try to fetch user\'s info again in 2sec.');
      }
      timeout = setTimeout(fetchData, 2000);
    }
  }

  const fetchInfo = () => {
    APIManager.fetchMyCollection({ navigation }, onInfoFetched);
  }

  const onInfoFetched = async (result) => {
    //console.debug(result.items);
    setData(result.items);
    setErrortext(result.error);
  }

  const onAlbumPress = (item) => {
    const colAlb = CollectionManager.getAlbumInCollection(item);
    if (colAlb) {
      navigation.push('Album', { item: colAlb });
    } else if (global.isConnected) {
      APIManager.fetchAlbum((result) => {
        if (result.error == '' && result.items.length > 0) {
          navigation.push('Album', { item: result.items[0] })
        }
      }, { id_tome: item.ID_TOME, id_serie: item.ID_SERIE });
    }
  }

  const renderCarreAlbum = useCallback(({ item, index }) => (
    <TouchableOpacity key={index} onPress={() => onAlbumPress(item)} title={item.TITRE_TOME}>
      <View style={{ flexDirection: 'column', alignContent: 'center', alignItems: 'center', marginTop: 2, width: ScreenWidth / 3 - 10 }}>
        <CoverImage item={item} category={1} />
      </View>
    </TouchableOpacity>), []);

  return (
    <View style={CommonStyles.screenStyle}>
      {!global.isConnected ?
        <View style={[CommonStyles.screenStyle, { alignItems: 'center', height: '50%', flexDirection: 'column' }]}>
          <View style={{ flex: 1 }}></View>
          <Text style={CommonStyles.defaultText}>Informations indisponibles en mode non-connecté.{'\n'}</Text>
          <Text style={CommonStyles.defaultText}>Rafraichissez cette page une fois connecté.</Text>
          <TouchableOpacity style={{ flexDirection: 'column', marginTop: 20 }} onPress={fetchData}>
            <Icon name='refresh' size={50} color={CommonStyles.markIconDisabled.color} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}></View>
        </View>
        :
        (!data ?
          <LoadingIndicator /> :
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <ScrollView style={{ margin: 0, width: '100%' }}>

              <CollapsableSection sectionName='Carré Magique' noAnimation={true}>
                <View style={{
                  paddingTop: 5, flex: 1, flexDirection: 'row',
                  flexWrap: 'wrap', alignContent: 'center'
                }}>
                  {Object.keys(data.a_carre).map(v => data.a_carre[v]).map((item, index) =>
                    renderCarreAlbum({ item, index }))}
                </View>

              </CollapsableSection>
              <CollapsableSection sectionName='Infos Collection'>
                <Text style={CommonStyles.defaultText}>Nombre d'albums : {data.stat.nbeditions} dont {Helpers.pluralWord(data.stat.nbintegrales, 'intégrale')}.</Text>
                <Text style={CommonStyles.defaultText}>Nombre de coffrets : {data.stat.nbcoffrets}</Text>
                <Text style={CommonStyles.defaultText}>Nombre de séries suivies : {data.stat.nbseries}</Text>
                <Text style={CommonStyles.defaultText}>Nombre d'achats prévus : {data.stat.nbfuturs_achats}</Text>
              </CollapsableSection>

              <CollapsableSection sectionName='Contributions'>
                <Text style={CommonStyles.defaultText}>Propositions de nouveaux albums : {data.user_prop_alb}</Text>
                <Text style={CommonStyles.defaultText}>Propositions de corrections : {data.user_prop_corr}</Text>
              </CollapsableSection>
            </ScrollView>
          </View>
        )}
    </View>
  );
}

export default DashboardScreen;
