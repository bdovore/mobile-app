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

import React, { useCallback, useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, Linking, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Button, ListItem } from 'react-native-elements';

import { AchatSponsorIcon } from '../components/AchatSponsorIcon';
import { AlbumMarkers } from '../components/AlbumMarkers';
import { BottomSheet } from '../components/BottomSheet';
import { CollapsableSection } from '../components/CollapsableSection';
import { CommonStyles, bdovored, bdovorlightred } from '../styles/CommonStyles';
import { CoverImage } from '../components/CoverImage';
import { Icon } from '../components/Icon';
import { RatingStars } from '../components/RatingStars';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';
import CollectionManager from '../api/CollectionManager';
import CommentsPanel from '../panels/CommentsPanel';
import UserCommentPanel from '../panels/UserCommentPanel';


const sBits = {
  'borrower': 1,
  'borrowerEmail': 2,
  'comment' : 4,
};

function AlbumScreen({ route, navigation }) {

  const [album, setAlbum] = useState(route.params.item);
  const [albumEditionsData, setAlbumEditionsData] = useState([]);
  const [borrower, setBorrower] = useState('');
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [dontShowSerieScreen, setDontShowSerieScreen] = useState(route.params.dontShowSerieScreen);
  const [editionIndex, setEditionIndex] = useState(0);
  const [editionsLoaded, setEditionsLoaded] = useState(false);
  const [errortext, setErrortext] = useState('');
  const [isAlbumInCollection, setIsAlbumInCollection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAllAuthors, setShowAllAuthors] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showEditionsChooser, setShowEditionsChooser] = useState(false);
  const [showUserComment, setShowUserComment] = useState(false);
  const [similAlbums, setSimilAlbums] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [isBorrowed, setIsBorrowed] = useState(false);
  const [showBorrowerInfos, setShowBorrowerInfos] = useState(false);
  const [savingBits, setSavingBits] = useState(0);

  const tome = Helpers.getAlbumName(album);

  const setSavingBit = (flag, value) => {
    if (value) {
      setSavingBits(savingBits => savingBits | sBits[flag]);
    } else {
      setSavingBits(savingBits => savingBits & ~sBits[flag]);
    }
  }

  const isSavingBit = (flag) => {
    return savingBits & sBits[flag];
  }

  useEffect(() => {
    setIsAlbumInCollection(CollectionManager.isAlbumInCollection(album));
    getAlbumEditions();
    getAlbumIsExclude();

    onRefresh();
  }, [album]);

  const getAlbumEditions = () => {
    if (!editionsLoaded && global.isConnected) {
      setLoading(true);
      setEditionsLoaded(true);
      setSimilAlbums([]);
      if (global.verbose) {
        Helpers.showToast(false, 'Téléchargement de l\'album...');
      }
      CollectionManager.fetchAlbumEditions(album, onAlbumEditionsFetched);
      APIManager.fetchSimilAlbums(album.ID_TOME, onSimilFetched);
      APIManager.fetchAlbumComments(album.ID_TOME, onCommentsFetched, 1);
    }
    if (!global.isConnected) {
      onAlbumEditionsFetched({ items: CollectionManager.getAlbumEditionsInCollection(album.ID_TOME, album.ID_SERIE), error: '' });
    }
  }

  const getAlbumIsExclude = () => {
    if (album.IS_EXCLU == undefined && global.isConnected) {
      APIManager.fetchIsAlbumExcluded(album, (result) => {
        if (!result.error) {
          CollectionManager.setAlbumExcludedFlag(album, (result.items != 0));
        }
      });
    }
  }

  const onAlbumEditionsFetched = (result) => {
    setAlbumEditionsData(result.items);
    setErrortext(result.error);
    setLoading(false);

    // Initialize the edition index with the current album edition
    for (let i = 0; i < result.items.length; i++) {
      if (result.items[i].ID_EDITION == album.ID_EDITION) {
        setEditionIndex(i);
        break;
      }
    }
  }

  const onSimilFetched = (result) => {
    setSimilAlbums(result.items);
    setErrortext(result.error);
    setLoading(false);
  }

  const filteredComments = () => {
    // strip empty comments
    return comments.filter((comment) => comment.NOTE != null && comment.COMMENT);
  }

  const onCommentsFetched = (result) => {
    setComments(result.items);
    setErrortext(result.error);
    setLoading(false);
  }

  const onShowEditionsChooser = () => {
    setShowEditionsChooser(albumEditionsData.length > 1);
  }

  const onChooseEdition = (index) => {
    setShowEditionsChooser(false);
    setEditionIndex(index);
    setAlbum(Helpers.toDict(albumEditionsData[index]));
  }

  const onSimilPress = (item) => {
    navigation.push('Album', { item });
  }

  const onShowSerieScreen = () => {
    if (global.isConnected) {
      setLoading(true);
      APIManager.fetchSerie(album.ID_SERIE, (result) => {
        setLoading(false);
        if (result.error == '') {
          navigation.push('Serie', { item: result.items[0] });
        }
      });
    } else {
      const serie = CollectionManager.getSerieInCollection(album.ID_SERIE);
      if (serie) {
        navigation.push('Serie', { item: Helpers.toDict(serie) });
      }
    }
  }

  const getAuthorsLabel = () => {
    let authors = Helpers.getAuthors(album);
    let len = authors.length;
    if (len == 1 && authors.name == 'Collectif') len++;
    return Helpers.pluralize(len, 'Auteur')
  }

  const onPressAuteur = (auteur) => {
    if (auteur != 'Collectif' && global.isConnected) {
      APIManager.fetchAuteur(auteur.id, (result) => {
        if (!result.error && result.items.length > 0) {
          navigation.push('Auteur', { author: result.items[0] });
        }
      });
    }
  }

  const onSaveBorrower = () => {
    const colAlb = CollectionManager.getAlbumInCollection(album) ?? album;
    if (borrower != colAlb.NOM_PRET) {
      if (!Helpers.checkConnection()) { return; }
      setSavingBit('borrower', true);
      CollectionManager.setAlbumBorrower(album, borrower, (result) => {
        setSavingBit('borrower', false);
      });
    }
  }

  const onSaveBorrowerEmail = () => {
    const colAlb = CollectionManager.getAlbumInCollection(album) ?? album;
    if (borrowerEmail != colAlb.EMAIL_PRET) {
      if (!Helpers.checkConnection()) { return; }
      setSavingBit('borrowerEmail', true);
      CollectionManager.setAlbumBorrowerEmail(album, borrowerEmail, (result) => {
        setSavingBit('borrowerEmail', false);
      });
    }
  }

  const onSaveComment = () => {
    const colAlb = CollectionManager.getAlbumInCollection(album) ?? album;
    if (comment != colAlb.comment) {
      if (!Helpers.checkConnection()) { return; }
      setSavingBit('comment', true);
      CollectionManager.setAlbumComment(album, comment, (result) => {
        setSavingBit('comment', false);
      });
    }
  }

  const getUserRating = () => {
    let rate = -1;
    comments.forEach(entry => {
      if (entry.username == global.login) {
        rate = entry.NOTE;
      }
    });
    return rate > 0 ? rate : null;
  }

  const BitLoadingIndicator = () => (
    <ActivityIndicator size="small" color={global.isDarkMode ? bdovorlightred : bdovored} style={CommonStyles.markerIconStyle} />);

  const keyExtractor = useCallback((item, index) =>
    Helpers.getAlbumUID(item), []);

  const renderSimil = useCallback(({ item, index }) => (
    <TouchableOpacity key={index} onPress={() => onSimilPress(item)} title={item.TITRE_TOME}>
      <View style={{ flexDirection: 'column', width: 110 }}>
        <CoverImage item={item} category={1} />
        <Text numberOfLines={1} textBreakStrategy='balanced' style={{ width: 110, fontSize: 12, paddingLeft: 4, paddingRight: 4 }}>{item.TITRE_TOME}</Text>
      </View>
    </TouchableOpacity>), []);

  const renderAuthors = () => {

    const authors = Helpers.getAuthors(album);
    const nbOfAuthors = authors.length;
    if (!showAllAuthors && nbOfAuthors > 6) {
      return (
        <Text style={CommonStyles.defaultText}>{getAuthorsLabel()} :{' '}
          <Text onPress={() => setShowAllAuthors(true)} style={CommonStyles.linkText}>Collectif</Text>
        </Text>);
    }
    return (
      <Text style={CommonStyles.defaultText}>{getAuthorsLabel()} :{' '}
        {nbOfAuthors > 6 ? <Text onPress={() => setShowAllAuthors(false)} style={CommonStyles.linkText}>Collectif : </Text> : null}
        {Helpers.getAuthors(album).map((auteur, index, array) => {
          if (auteur.name == 'Collectif') {
            return nbOfAuthors == 1 ? <Text key={index * 2} style={CommonStyles.defaultText}>{auteur.name}{index != (array.length - 1) ? ' / ' : ''}</Text> : null;
          }
          return (
            <Text key={index * 2 + 1} style={CommonStyles.defaultText}>
              <Text onPress={() => onPressAuteur(auteur)} style={global.isConnected ? CommonStyles.linkText : CommonStyles.defaultText}>{Helpers.reverseAuteurName(auteur.name)}</Text>
              {index != (array.length - 1) ? ' / ' : ''}
            </Text>)
        })}
      </Text>
    )
  }

  const onShowAlbumImage = () => {
    navigation.push('Image', { source: APIManager.getAlbumCoverURL(album), copyright: Helpers.getAlbumCopyright(album) });
  }

  const onShowComments = () => {
    if (filteredComments().length > 0) {
      setShowComments(true);
    }
  }

  const onSubmitChanges = () => {
    console.log("Demande de modification");
    if (global.isConnected) {
      let url = APIManager.bdovoreBaseURL + '/Proposition?id_edition=' + album.ID_EDITION;
      url = APIManager.concatParamsToURL(url, { 'API_TOKEN': global.token });
      Linking.openURL(url);
    }
  }

  const onSubmitNewEdition = () => {
    console.debug("Proposition edition");
    if (global.isConnected) {
      let url = APIManager.bdovoreBaseURL + '/Proposition?type=EDITION&id_tome=' + album.ID_TOME;
      url = APIManager.concatParamsToURL(url, { 'API_TOKEN': global.token });
      Linking.openURL(url);
    }
  }

  const getTomeNumber = () => {
    const serie = CollectionManager.getSerieInCollection(album.ID_SERIE);
    const nbTomes = (serie && serie.NB_TOME) ? serie.NB_TOME : 0;
    return <Text style={CommonStyles.defaultText}>Tome : {album.NUM_TOME}{nbTomes ? ' / ' + nbTomes : ''}</Text>
  }

  const onRefresh = () => {
    const isInCollec = CollectionManager.isAlbumInCollection(album);
    setIsAlbumInCollection(isInCollec);

    if (!isInCollec) {
      setShowMore(false);
      setShowBorrowerInfos(false);
      setShowComment(false);
    } else {
      // Refresh album parameters when album flags are changed in the markers component
      const colAlb = CollectionManager.getAlbumInCollection(album) ?? album;
      setIsBorrowed(colAlb.FLG_PRET == 'O');
      setBorrower(colAlb.NOM_PRET);
      setBorrowerEmail(colAlb.EMAIL_PRET);
      setComment(colAlb.comment);
    }
  }

  return (
    <View style={CommonStyles.screenStyle}>
      <ScrollView style={{ margin: 0 }}>

        <View style={{ margin: 10, alignItems: 'center' }}>
          <TouchableOpacity onPress={onShowAlbumImage}>
            <CoverImage item={album} category={1} style={CommonStyles.fullAlbumImageStyle} />
          </TouchableOpacity>
        </View>

        <View style={{ margin: 0, alignItems: 'center' }}>
          <Text style={[CommonStyles.bold, CommonStyles.defaultText, { fontWeight: 'bold', textAlign: 'center' }]}>{tome}</Text>
          {album.MOYENNE_NOTE_TOME ?
            <View style={{ marginTop: 10 }}>
              <RatingStars note={album.MOYENNE_NOTE_TOME} nbNotes={album.NB_NOTE_TOME} showRate />
              {getUserRating() != null ?
                <View style={{ flexDirection: 'row', marginTop: 5 }}>
                  <RatingStars note={getUserRating()} showRate starColor={global.isDarkMode ? bdovorlightred : bdovored}/>
                  <Text style={[CommonStyles.defaultText, CommonStyles.evenSmallerText, { marginLeft: 5 }]}>Ma note</Text>
                </View>
                : null}
            </View> : null}

          {filteredComments().length > 0 || isAlbumInCollection && global.isConnected ?
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexGrow: 1, marginTop: 10 }}>
              {filteredComments().length > 0 ?
                <Text style={[CommonStyles.linkText, { marginHorizontal: 10 }]}
                  onPress={onShowComments}>
                  Lire les avis
                </Text> : null}
              {isAlbumInCollection && global.isConnected ?
                <Text style={[CommonStyles.linkText, { marginHorizontal: 10 }]}
                  onPress={() => setShowUserComment(true)}>
                  Noter cet album
                </Text> : null}
            </View> : null}
        </View>

        <CollapsableSection sectionName='Collection'>
          <View flexDirection='row' style={{ justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>

            <AlbumMarkers style={{ flex: 0, width: '100%', marginBottom: -10 }}
              item={album}
              reduceMode={false}
              retractableButtons={false}
              showExclude={(CollectionManager.getNbOfUserAlbumsInSerie(album.ID_SERIE) > 0)}
              refreshCallback={onRefresh}
              expandCallback={(expanded) => {
                if (CollectionManager.isAlbumInCollection(album)) {
                  if (!expanded) {
                    setShowBorrowerInfos(false);
                    setShowComment(false);
                  }
                  setShowMore(expanded);
                }}
            } />

            {/*CollectionManager.isAlbumInCollection(album) ?
              <TouchableOpacity onLongPress={() => { }} onPress={() => {
                if (showMore) {
                  setShowBorrowerInfos(false);
                  setShowComment(false);
                }
                setShowMore(!showMore);
              }} title='...'
                style={[CommonStyles.markerStyle, { paddingLeft: 0, width: 25, right: -5, position: 'absolute' }]} >
                <Text>
                  <Icon name='MaterialIcons/more-vert' size={25}
                    color={showMore ? 'lightgrey' : CommonStyles.markIconDisabled.color}
                    style={[CommonStyles.markerIconStyle, {
                      paddingTop: 3, borderWidth: 0, width: 25
                    }]} />
                </Text>
              </TouchableOpacity>
                  : null*/}
          </View>
          {showMore ? <View style={{ marginTop: 5}}/> : null}
          {showMore && (isBorrowed && (borrower || borrowerEmail || showBorrowerInfos))?
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <Text style={[CommonStyles.defaultText, {  }]}>Emprunteur :</Text>
              {isSavingBit('borrower') ?
                <BitLoadingIndicator /> :
                <TextInput multiline={false}
                  placeholder="Nom"
                  numberOfLines={1}
                  editable
                  autoComplete='name'
                  textContentType='none'
                  autoCapitalize='sentences'
                  style={[CommonStyles.attributeTextInputStyle, { flex: 1, marginLeft: 5, padding: 2, textAlignVertical: 'center', height: 20 }]}
                  onChangeText={(name) => { setBorrower(name);  setShowBorrowerInfos(true); }}
                  onEndEditing={onSaveBorrower}
                  onSubmitEditing={onSaveBorrower}
                  value={borrower}
                  autoFocus={false} />}
              {isSavingBit('borrowerEmail') ?
                <BitLoadingIndicator /> :
                <TextInput multiline={false}
                  placeholder="Email / Tel"
                  numberOfLines={1}
                  editable
                  autoComplete='email'
                  keyboardType='email-address'
                  textContentType='emailAddress'
                  autoCapitalize='none'
                  style={[CommonStyles.attributeTextInputStyle, { flex: 1, marginLeft: 5, padding: 2, textAlignVertical: 'center', height: 20 }]}
                  onChangeText={(email) => { setBorrowerEmail(email); setShowBorrowerInfos(true); }}
                  onEndEditing={onSaveBorrowerEmail}
                  onSubmitEditing={onSaveBorrowerEmail}
                  value={borrowerEmail}
                autoFocus={false} />}
            </View> : null }
          {showMore && (isBorrowed && (!borrower && !borrowerEmail && !showBorrowerInfos)) ?
            <Text style={[CommonStyles.linkText, { marginTop: 10 }]}
              onPress={() => setShowBorrowerInfos(true)}>Ajouter les infos emprunteur</Text>
            : null}
          {showMore && (comment || showComment) ?
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <Text style={[CommonStyles.defaultText, { }]}>Mémo : </Text>
              {isSavingBit('comment') ?
                <BitLoadingIndicator /> :
                <TextInput multiline={true}
                  placeholder='Entrez vos remarques ici'
                  editable
                  textContentType='none'
                  autoCapitalize='sentences'
                  style={[CommonStyles.attributeTextInputStyle, { flex: 1, marginLeft: 5, padding: 2, textAlignVertical: 'top', minHeight: 20}]}
                  onChangeText={(comment) => { setComment(comment ?? ''); setShowComment(true); }}
                  onEndEditing={onSaveComment}
                  returnKeyType='done'
                  //onSubmitEditing={onSaveComment}
                  value={comment}
                  autoFocus={false} />}
            </View>
            : null}
          {showMore && (!comment && !showComment) ?
            <Text style={[CommonStyles.linkText, { marginTop: 10 }]}
              onPress={()=> setShowComment(true)}>Ajouter un mémo privé</Text>
            : null}
        </CollapsableSection>

        <CollapsableSection sectionName='Infos Album'>
          <Text style={[CommonStyles.largerText, CommonStyles.defaultText, dontShowSerieScreen ? null : CommonStyles.linkText]}
            onPress={dontShowSerieScreen ? () => { } : onShowSerieScreen}>{album.NOM_SERIE}</Text>
          {album.NUM_TOME > 0 && getTomeNumber()}
          {renderAuthors()}
          <Text style={CommonStyles.defaultText}>Genre : {album.NOM_GENRE} {Helpers.isAlbumBW(album) ? ' - N&B' : ''}</Text>
          <View style={{ flexDirection: 'row' }}>
            <Text style={CommonStyles.defaultText}>Edition{Helpers.plural(albumEditionsData.length, 'Edition')} : </Text>
            <TouchableOpacity
              onPress={onShowEditionsChooser}
              title="Editions">
              {albumEditionsData.length > 1 ?
                <Text style={CommonStyles.albumEditionButtonStyle}>
                  {' '}{album.NOM_EDITION} <Icon name={showEditionsChooser ? 'menu-up' : 'menu-down'} size={16} color={CommonStyles.markerIconStyle} />{' '}
                </Text> : <Text style={CommonStyles.defaultText}>{album.NOM_EDITION}</Text>}
            </TouchableOpacity>
          </View>
          {Helpers.getDateParutionAlbum(album) != '' ?
            <Text style={CommonStyles.defaultText}>Date de parution : {Helpers.getDateParutionAlbum(album)}</Text>
            : null}
          {album.COMMENT_EDITION && <Text style={CommonStyles.defaultText}>Infos édition : {album.COMMENT_EDITION}</Text>}
          {album.NOM_COLLECTION && album.NOM_COLLECTION != '<N/A>' && <Text style={CommonStyles.defaultText}>Collection : {album.NOM_COLLECTION}</Text>}
          {(album.PRIX_BDNET && parseInt(album.PRIX_BDNET > 0)) ? <Text style={CommonStyles.defaultText}>Prix constaté : {album.PRIX_BDNET}€</Text> : null}
          {album.DATE_AJOUT && <Text style={CommonStyles.defaultText}>Date d'ajout : {Helpers.dateToString(album.DATE_AJOUT)}</Text>}
          {album.EAN_EDITION && <Text style={[CommonStyles.defaultText, CommonStyles.smallerText]}>EAN : {album.EAN_EDITION}</Text>}
          {!album.EAN_EDITION && album.ISBN_EDITION && <Text style={[CommonStyles.defaultText, CommonStyles.smallerText]}>ISBN : {album.ISBN_EDITION}</Text>}
          {global.showBDovoreIds ? <Text style={[CommonStyles.defaultText, CommonStyles.smallerText]}>ID-BDovore - Album : {album.ID_TOME}, Série : {album.ID_SERIE}, Edition : {album.ID_EDITION}</Text> : null}
          <TouchableOpacity name='Soumettre une modification' style={{position: 'absolute', bottom:0, right:10}}>
            <Button onPress={onSubmitChanges} type="clear" icon={
            <Icon name='comment-edit-outline' size={25} color={'lightgrey'} />} />
          </TouchableOpacity>
          <TouchableOpacity name='Ajouter nouvelle édition'  style={{ position: 'absolute', bottom: 0, right: 50 }}>
            <Button onPress={onSubmitNewEdition} type="clear" icon={<Icon name='comment-plus-outline' size={25} color={'lightgrey'} />} />
          </TouchableOpacity>
        </CollapsableSection>

        {album.HISTOIRE_TOME ?
          <CollapsableSection sectionName='Synopsis'>
            <Text style={[CommonStyles.defaultText, { textAlign: 'justify' }]}>
              {Helpers.removeHTMLTags(album.HISTOIRE_TOME)}
            </Text>
          </CollapsableSection> : null}

        {!global.hideSponsoredLinks && global.isConnected ?
          <CollapsableSection sectionName='Acheter en ligne'>
            <AchatSponsorIcon album={album} />
          </CollapsableSection> : null}

        {similAlbums.length > 0 ?
          <CollapsableSection sectionName='A voir aussi'>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              legacyImplementation={false}
              data={similAlbums}
              renderItem={renderSimil}
              keyExtractor={keyExtractor}
              style={{ height: 170 }}
            />
          </CollapsableSection> : null}

        {/* Editions chooser */}
        <BottomSheet
          isVisible={showEditionsChooser}>
          <ListItem key='0' containerStyle={CommonStyles.bottomSheetTitleStyle}>
            <ListItem.Content>
              <ListItem.Title style={[CommonStyles.bottomSheetItemTextStyle, CommonStyles.defaultText]}>Editions</ListItem.Title>
            </ListItem.Content>
          </ListItem>
          {albumEditionsData.map((item, index) => (
            <ListItem key={index + 1}
              containerStyle={
                (index == editionIndex ? CommonStyles.bottomSheetSelectedItemContainerStyle : CommonStyles.bottomSheetItemContainerStyle)}
              onPress={() => {
                onChooseEdition(index);
              }}>
              <ListItem.Content>
                <ListItem.Title style={
                  (index == editionIndex ? CommonStyles.bottomSheetSelectedItemTextStyle : CommonStyles.bottomSheetItemTextStyle)}>
                  {item.NOM_EDITION}
                </ListItem.Title>
              </ListItem.Content>
            </ListItem>
          ))}
        </BottomSheet>

      </ScrollView>

      {/* Comments */}
      <CommentsPanel
        comments={filteredComments()}
        isVisible={showComments}
        visibleSetter={setShowComments} />

      {/* Comments */}
      <UserCommentPanel
        album={album}
        isVisible={showUserComment}
        visibleSetter={setShowUserComment}
        comments={comments} />
    </View>
  );
}

export default AlbumScreen;
