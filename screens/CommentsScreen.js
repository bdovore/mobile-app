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

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Text, TouchableOpacity, View, ScrollView } from 'react-native';

import { CommonStyles, bdovorgray } from '../styles/CommonStyles';
import { CoverImage } from '../components/CoverImage';
import { Icon } from '../components/Icon';
import { RatingStars } from '../components/RatingStars';
// import { ScrollView } from 'react-native-gesture-handler';
import CollectionManager from '../api/CollectionManager';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';
import { LoadingIndicator } from '../components/LoadingIndicator';


let timeout = null;

function CommentsScreen({ route, navigation }) {

  const [comments, setComments] = useState([]);
  const [errortext, setErrortext] = useState('');
  const [loading, setLoading] = useState(false);
  const flatList = useRef();

  const navigationPos = Dimensions.get('window').height / 2.5;
  const windowWidth = Dimensions.get('window').width;

  useEffect(() => {
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
        Helpers.showToast(false, 'Téléchargement des commentaires...');
      }
      setLoading(true);
      setErrortext('');
      fetchComments();
    } else if (!timeout && comments.length == 0) {
      if (verbose) {
        Helpers.showToast(false, 'Will try to fetch comments again in 2sec.');
      }
      timeout = setTimeout(fetchData, 2000);
    }
  }

  const fetchComments = () => {
    setComments([]);
    APIManager.fetchAlbumComments(null, onCommentsFetched)
      .then().catch((error) => console.debug(error));
  }

  const onCommentsFetched = async (result) => {
    console.debug(result.items.length + ' comments fetched')
    setComments(result.items);
    setLoading(false);
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
        } else {
          Alert.alert(
            "Album introuvable !");
        }
      }, { id_tome: item.ID_TOME, id_serie: item.ID_SERIE });
    }
  }

  const onSeriePress = (item) => {
    if (global.isConnected) {
      setLoading(true);
      APIManager.fetchSerie(item.ID_SERIE, (result) => {
        setLoading(false);
        if (result.error == '') {
          navigation.push('Serie', { item: result.items[0] });
        }
      });
    } else {
      const serie = CollectionManager.getSerieInCollection(item.ID_SERIE);
      if (serie) {
        navigation.push('Serie', { item: Helpers.toDict(serie) });
      }
    }
  }

  const onBrowseToComment = (index) => {
    let offset = index * Dimensions.get('window').width;
    Helpers.safeScrollToOffset(flatList, { offset, animated: true });
  }

  const getItemLayout = useCallback((data, index) => ({
    length: windowWidth,
    offset: windowWidth * index,
    index
  }), []);

  const getCommentDate = (item) => {
    if (!item.DTE_POST) { return ''; }
    const date = item.DTE_POST.split(' ');
    return 'le ' + Helpers.convertDate(date[0]) + ' à ' + date[1].substring(0, 5);
  }

  const renderComment = useCallback(({ item, index }) => {
    return (
      <View key={index} style={{ width: windowWidth }}>
    <ScrollView key={index} style={{ flex: 1, marginTop: 10, marginBottom: 10 }}>
      <View>
        {index > 0 ?
          <TouchableOpacity activeOpacity={1} onPress={() => onBrowseToComment(index - 1)} style={{ zIndex: 2, flexDirection: 'row', position: 'absolute', top: navigationPos, left: 0 }} >
            <Icon name='MaterialIcons/chevron-left' size={25}
              color={'lightgrey'}
              style={[{ paddingVertical: 8, borderWidth: 0, width: 25 }]} />
            <View style={{ width: 15 }} />
          </TouchableOpacity>
          : null}
        {index < (comments.length - 1) ?
          <TouchableOpacity activeOpacity={1} onPress={() => onBrowseToComment(index + 1)} style={{ zIndex: 2, flexDirection: 'row', position: 'absolute', top: navigationPos, right: 0 }}>
            <View style={{ width: 15 }} />
            <Icon name='MaterialIcons/chevron-right' size={25}
              color={'lightgrey'}
              style={[{ paddingVertical: 8, borderWidth: 0, width: 25 }]} />
          </TouchableOpacity>
          : null}
      </View>
      <View style={{ flexDirection: 'column', alignItems: 'center' }}>
        <TouchableOpacity style={{ flexDirection: 'column', alignContent: 'center', alignItems: 'center' }} onPress={() => onAlbumPress(item)} title={item.TITRE_TOME}>
          <CoverImage item={item} category={1} style={CommonStyles.fullAlbumImageStyle} />
          <Text numberOfLines={1} textBreakStrategy='balanced' style={[CommonStyles.defaultText, CommonStyles.bold, { marginTop: 10 }]}>{Helpers.getAlbumName(item)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: 'column', alignContent: 'center', alignItems: 'center' }} onPress={() => onSeriePress(item)} title={item.TITRE_TOME}>
          {item.TITRE_TOME != item.NOM_SERIE ?
            <Text numberOfLines={1} textBreakStrategy='balanced' style={[CommonStyles.linkText, { marginTop: 5 }]}>{item.NOM_SERIE}</Text> : null}
        </TouchableOpacity>
        <RatingStars note={item.NOTE} style={{ marginLeft: -2, marginVertical: 5 }} showRate />
        <Text style={[CommonStyles.defaultText, { color: bdovorgray, marginVertical: 5 }]}>{item.username} {getCommentDate(item)}</Text>
        <TouchableOpacity activeOpacity={1}>
          <Text style={[CommonStyles.defaultText, { width: windowWidth - 40, marginHorizontal: 20 }]}>{item.COMMENT}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </View>);
  });

  const keyExtractor = useCallback((item, index) =>
    Helpers.isValid(item) ? item.DTE_POST : index);

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
        (loading ?
          <LoadingIndicator /> :
          <FlatList
            ref={flatList}
            horizontal
            initialNumToRender={2}
            maxToRenderPerBatch={4}
            windowSize={5}
            showsHorizontalScrollIndicator={true}
            legacyImplementation={false}
            data={comments}
            renderItem={renderComment}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={Helpers.renderVerticalSeparator}
            getItemLayout={getItemLayout}
          />)}
    </View>
  );
}

export default CommentsScreen;
