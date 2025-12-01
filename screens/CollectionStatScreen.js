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
import { ScrollView, Text, TouchableOpacity, View, Dimensions } from 'react-native';

import { CommonStyles } from '../styles/CommonStyles';

import { Icon } from '../components/Icon';

import { CollapsableSection } from '../components/CollapsableSection';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';

import { LoadingIndicator } from '../components/LoadingIndicator';
import {

  BarChart
} from 'react-native-gifted-charts'

let timeout = null;
const screenWidth = Dimensions.get("window").width;

const chartConfig = {
  backgroundGradientFrom: "#999999",
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: "#FFFFFF",
  backgroundGradientToOpacity: 0.5,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(26, 26, 146, ${opacity})`,
  strokeWidth: 3, // optional, default 3
  barPercentage: 1,
  useShadowColorFromDataset: false // optional
};

function CollectionStatScreen ({ route, navigation }) {
    const [errortext, setErrortext] = useState('');
    const [loading, setLoading] = useState(false);
    /*const [userId, setUserId] = useState(route.params.userid); */
    const [dataGenre, setDataGenre] = useState(null);
    const [dataAuteur, setDataAuteur] = useState(null);
    const [dataEditeur, setDataEditeur] = useState(null);
    const [dataNote, setDataNote] = useState(null);

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
    } else if (!timeout && (!dataGenre || dataGenre.length == 0)) {
      if (verbose) {
        Helpers.showToast(false, 'Will try to fetch user\'s info again in 2sec.');
      }
      timeout = setTimeout(fetchData, 2000);
    }
  }


  const renderData = useCallback (({ item, index }) => (
    <Text key={index}>{item.libelle} : {item.nbtome}</Text>
  ));
  const fetchInfo = () => {
    APIManager.fetchCollectionStat("genre",{ navigation }, onInfoGenreFetched);
    APIManager.fetchCollectionStat("auteur",{ navigation }, onInfoAuteurFetched);
    APIManager.fetchCollectionStat("editeur",{ navigation }, onInfoEditeurFetched);
    APIManager.fetchCollectionStat("note",{ navigation }, onInfoNoteFetched);

  }
  const onInfoGenreFetched = async (result) => {
    //console.debug(result.items);
    setDataGenre(result.items);
    setErrortext(result.error);
  }
  const onInfoAuteurFetched = async (result) => {
    //console.debug(result.items);
    setDataAuteur(result.items);
    setErrortext(result.error);
  }
  const onInfoEditeurFetched = async (result) => {
    //console.debug(result.items);
    setDataEditeur(result.items);
    setErrortext(result.error);
  }
  const onInfoNoteFetched = async (result) => {
    //console.debug(result.items);
    setDataNote(result.items);
    setErrortext(result.error);
  }
  const tooltip = (label, index, data) => {
     // Définis le décalage par défaut
     let marginLeftAdjustment = -6;

     // Disons que tu as 10 barres, et tu veux ajuster pour les 3 dernières
     const totalBars = 8;
     const adjustForLastBars = 3; // Les dernières barres pour lesquelles ajuster
     const threshold = totalBars - adjustForLastBars;

     // Si l'index de la barre courante est dans les 3 dernières, ajuste le marginLeft
     if (index >= threshold) {
       marginLeftAdjustment = -80; // Ajuste cette valeur selon le besoin pour éviter le débordement
     }

     return (
       <View
         style={{
           marginBottom: -10,
           marginLeft: marginLeftAdjustment,
           backgroundColor: '#990000',
           paddingHorizontal: 6,
           paddingVertical: 4,
           borderRadius: 4,
         }}>
         <Text style = {{color: "white"}}>{label}</Text>
       </View>
     );
  }
  return(
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
       <ScrollView style={[CommonStyles.screenStyle, { margin: 0 }]}>
       {(!dataGenre ?
          <LoadingIndicator /> :
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <ScrollView style={{ margin: 0, width: '100%' }}>

              <CollapsableSection sectionName="Top Genre (nb d'albums)" noAnimation={true}>
                <BarChart
                  barWidth={22}
                  barBorderRadius={4}
                  frontColor="lightgray"
                  data={dataGenre.map ( item => (
                    { label : item.libelle[0],
                      value : item.nbtome,
                      labelTextStyle: {color: 'gray'}
                    }
                    )
                  )}
                  maxValue = {Math.max( ...dataGenre.map( item => item.nbtome))}
                  shiftY={0}
                  //horizontal
                  yAxisAtTop
                  yAxisThickness={0}
                  xAxisThickness={0}
                  yAxisTextStyle={{color: 'gray'}}
                  renderTooltip={(item, index) => {
                    return tooltip(dataGenre[index].libelle, index, dataGenre)
                  }}

                    />
              </CollapsableSection>
            </ScrollView>
         </View>

       )}
       {(!dataAuteur ?
          <LoadingIndicator /> :
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <ScrollView style={{ margin: 0, width: '100%' }}>

              <CollapsableSection sectionName='Top Auteur (score)' noAnimation={true}>
                <BarChart
                  barWidth={22}
                  barBorderRadius={4}
                  frontColor="lightgray"
                  data={dataAuteur.map ( item => (
                    { label : item.pseudo[0], value : item.score, labelTextStyle: {color: 'gray'}}
                    )
                  )}
                  maxValue = {Math.max( ...dataAuteur.map( item => item.score))}
                  shiftY={0}
                  //horizontal
                  yAxisAtTop
                  yAxisThickness={0}
                  yAxisTextStyle={{color: 'gray'}}
                  xAxisThickness={0}
                  renderTooltip={(item, index) => {
                    return tooltip(dataAuteur[index].pseudo, index, dataAuteur)
                  }}

                    />
              </CollapsableSection>
            </ScrollView>
         </View>

       )}
       {(!dataEditeur ?
          <LoadingIndicator /> :
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <ScrollView style={{ margin: 0, width: '100%' }}>

              <CollapsableSection sectionName="Top Editeur (nb d'albums)" noAnimation={true}>
                <BarChart
                  barWidth={22}
                  barBorderRadius={4}
                  frontColor="lightgray"
                  data={dataEditeur.map ( item => (
                    { label : item.nom[0], value : item.nbtome , labelTextStyle: {color: 'gray'}}
                    )
                  )}
                  maxValue = {Math.max( ...dataEditeur.map( item => item.nbtome))}
                  shiftY={0}
                  //horizontal
                  yAxisAtTop
                  yAxisThickness={0}
                  yAxisTextStyle={{color: 'gray'}}
                  xAxisThickness={0}
                  renderTooltip={(item, index) => {
                    return tooltip(dataEditeur[index].nom, index, dataEditeur)
                  }}

                    />
              </CollapsableSection>
            </ScrollView>
         </View>

       )}
        {(!dataNote ?
          <LoadingIndicator /> :
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <ScrollView style={{ margin: 0, width: '100%' }}>

              <CollapsableSection sectionName="Top Notes (nb d'albums)" noAnimation={true}>
                <BarChart
                  barWidth={22}
                  barBorderRadius={4}
                  frontColor="lightgray"
                  data={dataNote.map ( item => (
                    { label : item.note, value : item.nbnotes, labelTextStyle: {color: 'gray'}}
                    )
                  )}
                  maxValue = {Math.max( ...dataNote.map( item => item.nbnotes))}
                  shiftY={0}
                  //horizontal
                  yAxisAtTop
                  yAxisThickness={0}
                  yAxisTextStyle={{color: 'gray'}}
                  xAxisThickness={0}
                  scrollToEnd= {true}
                  renderTooltip={(item, index) => {
                    return tooltip(dataNote[index].note, index, dataNote)
                  }}

                    />
              </CollapsableSection>
            </ScrollView>
         </View>

       )}

       </ScrollView>

    }
    </View>
  )
}

export default CollectionStatScreen;