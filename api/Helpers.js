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
import { Alert, View  } from 'react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CommonStyles } from '../styles/CommonStyles';


// Returns true if the screen is in portrait mode
export function isPortrait() {
  const dim = Dimensions.get('screen');
  return dim.height >= dim.width;
}

// Returns true of the screen is in landscape mode
export function isLandscape() {
  const dim = Dimensions.get('screen');
  return dim.width >= dim.height;
}

export function toDict(item) {
  if (!item) { return item; }
  let object = {};
  let keys = Object.getOwnPropertyDescriptors(item);
  if (typeof item.objectSchema === 'function') {
    keys = item.objectSchema().properties;
  }
  for (const key in keys) {
    if (key != '_id') {
      object[key] = item[key];
    }
  }
  return object;
}

export function isNumeric(value) {
  return /^\d+$/.test(value);
}

export function isValid(item) {
  if (!item) { return false };
  return (typeof item.isValid === 'function') ? item.isValid() : true;
}

export function isDBOject(item) {
  if (!item) { return false };
  return (typeof item.isValid === 'function') ? true : false;
}

String.prototype.replaceAt = function (index, replacement) {
  return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}

export function lowerCaseNoAccentuatedChars(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function renderSeparator(style = null) {
  return <View style={[CommonStyles.separatorStyle, style]} />
}

export function renderVerticalSeparator() {
  return <View style={CommonStyles.verticalSeparatorStyle} />
}

export function renderAnchor() {
  return <View style={CommonStyles.bottomSheetNotchStyle} />;
}

export function plural(nb) {
  return nb > 1 ? 's' : '';
}

export function pluralize(nb, word) {
  return word.split(' ').map(w => w + plural(nb)).join(' ');
  //return word + plural(nb);
}

export function pluralWord(nb, word) {
  return nb + ' ' + pluralize(nb, word);
}

export function setAndSaveGlobal(name, value) {
  global[name] = value;
  if (typeof value == "boolean") {
    AsyncStorage.setItem(name, value ? '1' : '0').catch((error) => { });
  } else {
    AsyncStorage.setItem(name, value).catch((error) => { });
  }
}

export function setAsyncStorageBoolValue(name, value) {
  AsyncStorage.setItem(name, value ? '1' : '0').catch((error) => { });
}

export function getLoggedUserid() {
  return parseInt(global.token.replace(/([0-9]+).*/, '$1')) * 1209 + 951;
}

export function checkConnection() {
  if (!global.isConnected) { return false; }
  if (global.localTimestamp != global.serverTimestamp) {
    Alert.alert('Collection désynchronisée',
      "Veuillez synchroniser votre collection dans la section 'Ma collection' avant de la modifier.");
    return false;
  }
  return true;
}

export function getUserid() {
  return parseInt(global.token.replace(/([0-9]+).*/, '$1')) * 1209 + 951;
}

export function saveTimestamp() {
  setAndSaveGlobal('localTimestamp', global.serverTimestamp);
}

export function sortByDate(data, field = 'DATE_AJOUT') {
  data.sort(function (item1, item2) {
    if (!item1 || !item1[field]) return item2;
    if (!item2 || !item2[field]) return item1;
    return new Date(item2[field].replaceAt(10, 'T')) - new Date(item1[field].replaceAt(10, 'T'));
  });
  return data;
}

export function filterAlbumsWithSearchKeywords(albums, keywords = '') {
  if (keywords == '') return albums;
  const kw = lowerCaseNoAccentuatedChars(keywords);
  return albums.filter(album =>
    lowerCaseNoAccentuatedChars(album.TITRE_TOME).includes(kw) ||
    lowerCaseNoAccentuatedChars(album.NOM_SERIE).includes(kw));
}

export function filterSeriesWithSearchKeywords(series, keywords = '') {
  if (keywords == '') return series;
  const kw = lowerCaseNoAccentuatedChars(keywords);
  return series.filter(serie =>
    lowerCaseNoAccentuatedChars(serie.NOM_SERIE).includes(kw));
}

export function getNowDateString() {
  return new Date(Date.now()).toISOString().replaceAt(10, ' ');
}

export function sliceSortByDate(data, field = 'DATE_AJOUT') {
  return sortByDate(data.slice(), field);
}

export function sortByAscendingValue(data, field = 'NUM_TOME') {
  data.sort(function (item1, item2) {
    return item1[field] - item2[field];
  });
  return data;
}
export function sliceSortByAscendingValue(data, field = 'NUM_TOME') {
  return sortByAscendingValue(data.slice(), field);
}

export function sortByDesendingValue(data, field = 'NUM_TOME') {
  data.sort(function (item1, item2) {
    return item2[field] - item1[field];
  });
  return data;
}
export function sliceSortByDescendingValue(data, field = 'NUM_TOME') {
  return sortByDesendingValue(data.slice(), field);
}

export function stripEmptySections(data) {
  return data.filter(item => (item.data.length > 0));
}

export function stripNewsByOrigin(data, origine) {
  return data.filter(item => (item.ORIGINE == origine));
}

export function getAlbumUID(album) {
  // 009633-062007: ID_TOME*1000000 + ID_EDITION
  return album ? (parseInt(album.ID_TOME) * 1000000 + parseInt(album.ID_EDITION)) : 0;
}

export function makeAlbumUID(album) {
  // 009633-062007: ID_TOME*1000000 + ID_EDITION
  return album ? (parseInt(album.ID_TOME) * 1000000 + parseInt(album.ID_EDITION)) : 0;
}

const censoredWords = [
  'Hentai',
  'Yaoi',
  'Ecchi',
  'Erotique'
];

export function isCensorable(genre) {
  return (!global.explicitContent && genre) ? censoredWords.some((element) => genre.includes(element)) : false;
};

export function createDictFromArray(array, dict, hashFun) {
  for (let i = 0; i < array.length; i++) {
    const idx = hashFun(array[i]);
    dict[idx] = i;
  }
  return dict;
}

export function createAlbumDict(array, dict) {
  return createDictFromArray(array, dict, (item) => getAlbumUID(item));
}

export function createSeriesDict(array, dict) {
  return createDictFromArray(array, dict, (item) => item.ID_SERIE);
}

export function getAlbumIdxInArray(album, dict) {
  return dict ? dict[getAlbumUID(album)] : null;
}

export function getSerieIdxInArray(id_serie, dict) {
  return dict ? dict[id_serie.toString()] : null;
}

export function addAlbumToArrayAndDict(album, array, dict) {
  const idx = array.push(album) - 1;
  dict[getAlbumUID(album)] = idx;
  return idx;
}

export function addSerieToArrayAndDict(serie, array, dict) {
  const idx = array.push(serie) - 1;
  dict[serie.ID_SERIE] = idx;
  return idx;
}

export function removeAlbumFromArrayAndDict(album, array, dict) {
  const idx = getAlbumIdxInArray(album, dict);
  if (idx >= 0) {
    const uid = getAlbumUID(album);
    delete dict[uid];
    array = array.splice(idx, 1);
    // Refresh dictionary according the new array order once the entry has been removed
    for (const [key, value] of Object.entries(dict)) {
      if (value > idx) {
        dict[key] = value - 1;
      }
    }
  }
}

export function removeSerieFromArrayAndDict(id_serie, array, dict) {
  const idx = getSerieIdxInArray(id_serie, dict);
  if (idx >= 0) {
    delete dict[id_serie];
    array = array.splice(idx, 1);
    // Refresh dictionary according the new array order once the entry has been removed
    for (const [key, value] of Object.entries(dict)) {
      if (value > idx) {
        dict[key] = value - 1;
      }
    }
  }
}

export function removeHTMLTags(text) {
  if (text) {
    text = text.replace(/<\!-(.*)\-->/g, '');
    text = text.replace(/<br>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, '$2');
    text = text.replace(/<(?:.|\s)*?>/g, '');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&quot;/g, '\"');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&.*?;/gi, ' '); // catch any other "&...;" special chars
    text = text.replace(/[\s]*$/, ''); // remove trailing carriage returns
    text = text.replace(/^[\s]*/, ''); // remove leading carriage returns
    text = text.replace(/\n /, '\n');
    text = text.replace(/\n\s\n*/g, '\n');// remove multiple returns occurences
    text = text.replace(/so[uo]rce:/, 'Source :'); // remove trailing carriage returns
  }
  return text;
}

export function getNumberOfAuthors(albums) {
  return getAuthors(albums).length;
}

export function getAuthors(albums) {
  let albs = albums;
  if (!Array.isArray(albums)) {
    albs = new Array(albums);
  }
  let dessinateurs = [];
  let scenaristes = [];
  let coloristes = [];
  albs.forEach(album => {
    dessinateurs.push({ name: album.depseudo, id: album.ID_DESSIN, hits: 1 } );
    scenaristes.push({ name: album.scpseudo, id: album.ID_SCENAR, hits: 1 });
    coloristes.push({ name: album.copseudo, id: album.ID_COLOR, hits: 1 });
  });

  let auteursArray = dessinateurs.concat(scenaristes).concat(coloristes);
  // Sort author by number of contributions in the serie
  auteursArray.filter((item, pos, self) => { item.hits = self.filter((it) => (it.id == item.id)).length; });
  auteursArray = auteursArray.filter((item, pos, self) => self.findIndex((it) => (it.id == item.id)) == pos);
  auteursArray = auteursArray.sort((a, b) => b.hits - a.hits);

  // Remove useless entries
  auteursArray = auteursArray.filter((item) => (item.name != null && !item.name.match(/<.*>/)));
  // Remove duplicated entries
  auteursArray = auteursArray.filter((item, pos, self) => self.findIndex((it) => (it.id == item.id)) == pos);

  return auteursArray;
}

export function getAuthorJobs(author) {
  let jobs = [];
  if (author.FLG_SCENAR == 1) { jobs.push('Scénariste'); }
  if (author.FLG_DESSIN == 1) { jobs.push('Dessinateur'); }
  if (author.FLG_COLOR == 1) { jobs.push('Coloriste'); }
  return jobs.join(', ');
}

export function getNbAuthorJobs(author) {
  let nbJobs = 0;
  if (author.FLG_SCENAR == 1) { nbJobs++; }
  if (author.FLG_DESSIN == 1) { nbJobs++; }
  if (author.FLG_COLOR == 1)  { nbJobs++; }
  return nbJobs;
}

export function noteToString(rate) {
  if (rate <= 1.0) { return 'Très mauvais'; }
  if (rate <= 2.0) { return 'Mauvais'; }
  if (rate <= 3.0) { return 'Moyen'; }
  if (rate <= 4.0) { return 'Très bon'; }
  if (rate <= 5.0) { return 'Excellent'; }
}

export function reverseAuteurName(name) {
  const names = name.split(', ');
  return (names.length >= 2) ? names[1] + ' ' + names[0] : name;
}

export function capitalize(str) {
  return str ? str[0].toUpperCase() + str.substring(1).toLowerCase() : str;
}

export function isAlbumBW(album) {
  return album.copseudo == '<n&b>';
}

export function makeSection(title = '', data = []) {
  return { title, data };
}

export function convertDate(date) {
  //return new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); // not supported on react
  return date.split('-').reverse().join('/');
}

export function getAlbumName(album) {
  let title = album.TITRE_TOME;
  let tome = album.NUM_TOME;
  if (tome > 0) {
    title = title.replace(/(.*), Tome (\d)+/, '$1');
    title = 'T' + album.NUM_TOME + ' - ' + title;
  }
  return title;
}

export function getAlbumCopyright(album) {
  return album.NOM_EDITEUR + ' / ' + reverseAuteurName(album.depseudo);
}

export function getDateParutionAlbum(album) {
  let date = '';
  if (album.DTE_PARUTION) { date = convertDate(album.DTE_PARUTION); }
  else if (album.DATE_PARUTION_EDITION) { date = convertDate(album.DATE_PARUTION_EDITION); }
  if (date.startsWith('01/01/')) {
    // if date is on January 1st, it should means we don't have exact date, skip day and month
    date = date.substring(6);
  }
  if (date.startsWith('01/')) {
    // if day is 01, it might mean we don't have the exact day, so skip it to be safe
    date = date.substring(3);
  }
  return date;
}

export function dateToString(date) {
  return convertDate(date.substring(0, 10));
}

export function showToast(isError, text1, text2 = '', visibilityTime = 1000, position = 'bottom') {
  Toast.show({
    visibilityTime,
    autoHide: true,
    position,
    type: isError ? 'error' : 'success',
    text1,
    text2,
  });
}

export function safeScrollToOffset(flatList, options) {
  if (flatList && flatList.current && flatList.current.scrollToOffset) {
    flatList.current.scrollToOffset(options);
  }
}
