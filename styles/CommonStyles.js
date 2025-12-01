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

import { Dimensions, StyleSheet } from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';

import SettingsManager from '../api/SettingsManager';


export const bdovored = '#990000';
export const bdovorlightred = '#e90101';
export const bdovorgray = '#aaaaaa'; // Same as iOS UIColor.lightGray
export const bdovordarkgray = '#1c1c1c';

export let windowWidth = Dimensions.get('window').width;
export let windowHeight = Dimensions.get('window').height;

export const FullAlbumImageWidth = 180;
export const FullAlbumImageHeight = 244;

export let AlbumImageWidth = Math.min(windowWidth, windowHeight) / (SettingsManager.isTablet() ? 8 : 4);
export let AlbumImageHeight = AlbumImageWidth * (FullAlbumImageHeight / FullAlbumImageWidth);
export let AlbumItemHeight = AlbumImageHeight + 1;

// TODO - Event Listener for orientation changes
/*Dimensions.addEventListener('change', () => {
  rebuildSheet();
});*/
export function rebuildSheet() {
  EStyleSheet.build({
    $theme: global.isDarkMode ? 'light' : 'dark',
    $rem: Dimensions.get('window').width > 340 ? 16 : 14,
    $bg: global.isDarkMode ? bdovordarkgray : 'white',
    $blue: global.isDarkMode ? 'lightblue' : 'blue',
    $textcolor: global.isDarkMode ? 'white' : 'black',
    $sectioncolor: global.isDarkMode ? bdovorlightred : bdovored, //global.isDarkMode ? '#333' : '#ddd',
    $red: global.isDarkMode ? bdovorlightred : bdovored,
    $buttongroupcolor: global.isDarkMode ? '#333' : '#eee',
    $buttongroupselectcolor: global.isDarkMode ? '#777' : 'white',
    $bw: global.isDarkMode ? StyleSheet.hairlineWidth * 2 : 0,
  });
  console.debug('Rebuild sheet');
}

export let CommonStyles = EStyleSheet.create({

  red: {
    color: '$red'
  },

  screenStyle: {
    backgroundColor: '$bg',
    flex: 1,
  },

  modalViewStyle: {
    backgroundColor: '$bg',
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 0,
    marginTop: 40,
    borderRadius: 10,
    borderWidth: '$bw',
    borderColor: 'lightgray',
  },

  // *************
  // Image styles
  albumImageStyle: {
    marginLeft: 5,
    marginRight: 5,
    resizeMode: 'contain',
    width: AlbumImageWidth,
    height: AlbumImageHeight, // respect the aspect ratio
  },
  auteurImageStyle: {
    margin: 5,
    resizeMode: 'cover',
    width: AlbumImageWidth,
    height: AlbumImageHeight, // respect the aspect ratio
  },
  auteurImageStyle: {
    width: 90,
    height: 122,
  },
  fullAlbumImageStyle: {
    resizeMode: 'contain',
    width: windowWidth*0.8,
    height: FullAlbumImageHeight,
  },
  serieImageStyle: {
    width: 90,
    height: 122,
  },
  sponsorIcon: {
    height: 33,
    aspectRatio: 4,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'lightgrey',
    marginRight: 10
  },
  iconStyle: {
    color: '$textcolor', // #222
  },
  iconEnabledStyle: {
    color: 'dodgerblue',
  },

  // ************
  // Text styles

  itemTextWidth: {
    width: (windowWidth / 4) * 3 - 15,
  },
  itemTextContent: {
    margin: 5,
    flexDirection: "column",
    flex: 1
  },
  defaultText: {
    color: '$textcolor',
  },
  itemTitleText: {
    color: '$textcolor',
  },
  itemText: {
    color: bdovorgray,
  },
  italic: {
    fontStyle: 'italic'
  },
  bold: {
    fontWeight: 'bold'
  },
  center: {
    textAlign: 'center'
  },
  largerText: {
    fontSize: '1.0rem'
  },
  smallerText: {
    fontSize: '0.7rem'
  },
  evenSmallerText: {
    fontSize: '0.5rem'
  },
  errorTextStyle: {
    color: '$red',
    textAlign: 'center',
    fontSize: 14,
  },
  sectionStyle: {
    backgroundColor: '$sectioncolor',
    color: '$textcolor',
    width: '100%',
    textAlignVertical: 'center',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  sectionTextStyle: {
    paddingLeft: 10,
    textAlignVertical: 'center',
    color: 'white', //$textcolor',
    fontSize: '1.0rem',
    textShadowRadius: 0.5,
    textShadowOffset: { width: 0.5, height: 0.5 },
    ...Platform.select({
      ios: { fontWeight: '300' }, android: { fontFamily: 'sans-serif-light' }, default: {}})
  },
  sectionAlbumStyle: {
    backgroundColor: '$sectioncolor',
    color: '$textcolor',
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  albumEditionButtonStyle: {
    backgroundColor: 'lightgrey',
    borderColor: '$textcolor',
    color: '$textcolor',
    borderWidth: 0.5,
    borderRadius: 5,
    paddingLeft: 5,
  },
  linkText: {
    color: '$red', //'dodgerblue',
    //textDecorationLine: 'underline',
  },

  //****************
  // Markers styles

  markersViewStyle: {
    position: 'absolute',
    bottom: -10,
    right: 0,
    backgroundColor: '$bg',
    zIndex: 1,
  },
  markersSerieViewStyle: {
    position: 'absolute',
    width: 55,
    bottom: -6,
    right: -8,
  },
  markerStyle: {
    alignItems: 'center',
    alignContent: 'center',
    paddingLeft: 13,
    paddingRight: 0,
    paddingVertical: 8,
    zIndex: 2,
  },
  markerAlbumItemStyle: {
    paddingRight: 5,
    position: 'absolute',
    bottom: 0,
    right: -7,
    zIndex: 2,
  },
  markerIconStyle: {
    textAlign: 'center',
    paddingTop: 3,
    borderWidth: 0.5,
    borderColor: bdovorgray,
    borderRadius: 3,
    width: 32,
    height: 32,
  },
  markerTextStyle: {
    fontSize: 9,
  },
  markIconEnabled: {
    color: 'green',
  },
  markWishIconEnabled: {
    color: '$red',
  },
  markIconDisabled: {
    color: '$textcolor',
  },

  //**************
  // Login styles
  loginConnectionTextStyle: {
    color: '$bg',
    paddingVertical: 10,
    fontSize: 16,
  },
  loginConnectionButtonStyle: {
    backgroundColor: bdovorlightred,
    borderWidth: 0,
    color: '$bg',
    borderColor: '$red',
    height: 40,
    alignItems: 'center',
    borderRadius: 30,
    marginLeft: 35,
    marginRight: 35,
    marginTop: 20,
    marginBottom: 25,
  },
  loginInputTextStyle: {
    margin: 12,
    color: '$textcolor',
    paddingLeft: 15,
    paddingRight: 15,
    borderWidth: 1,
    borderRadius: 30,
    borderColor: bdovorgray,
  },
  loginRegisterTextStyle: {
    alignSelf: 'center',
    fontSize: 14,
    padding: 10,
    textAlign: 'center',
  },

  //*****************
  // Comments styles
  commentsTextStyle: {
    color: bdovorgray,
    position: 'absolute',
    right: 10,
  },
  commentsTextInputStyle: {
    color: 'black',
    backgroundColor: 'lightgrey',
    marginTop: 10,
    textAlignVertical: 'top',
    width: '100%',
    borderRadius: 5,
  },
  attributeTextInputStyle: {
    color: 'black',
    backgroundColor: 'lightgrey',
    textAlignVertical: 'top',
    width: '100%',
    borderRadius: 5,
  },

  //**********************
  // Bottom sheets styles
  bottomSheetContainerStyle: {
    backgroundColor: 'rgba(0.5, 0.25, 0, 0.2)',
  },
  bottomSheetTitleStyle: {
    backgroundColor: '$bg',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    color: '$textcolor',
    alignSelf: 'center',
  },
  bottomSheetItemContainerStyle: {
    backgroundColor: '$bg',
    alignSelf: 'center',
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '$buttongroupcolor',
  },
  bottomSheetSelectedItemContainerStyle: {
    backgroundColor: '$red',
    alignSelf: 'center',
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '$buttongroupcolor',
  },
  bottomSheetItemTextStyle: {
    color: '$red',
    alignSelf: 'center',
  },
  bottomSheetSelectedItemTextStyle: {
    color: '$bg',
    alignSelf: 'center',
  },
  bottomSheetNotchStyle: {
    backgroundColor: 'lightgrey',
    borderBottomColor: 'lightgrey',
    borderBottomWidth: 5,
    borderRadius: 5,
    height: 5,
    marginVertical: 8,
    width: 40,
  },

   // Burger menu
  burgerModalStyle: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 0,
    backgroundColor: 'transparent'
  },

  burgerItemStyle: {
    flexDirection: 'row',
    flex: 1,
    marginVertical: 5,
    paddingHorizontal: 15,
    marginHorizontal: 0,
    justifyContent: 'space-between',
    backgroundColor: '$bg',
  },

  burgerTitleStyle: {
    marginLeft: 15,
    color: 'grey',
    textAlignVertical: 'center'
  },

  burgerScrollViewStyle: {
    backgroundColor: '$bg',
    position: 'absolute',
    paddingVertical: 15,
    bottom: 55,
    right: -15,
    flex: 1,
    flexDirection: 'column-reverse',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'gray',
    borderRadius: 5
  },

  //***************
  // Search styles
  searchContainerStyle: {
    backgroundColor: '$buttongroupcolor',
  },

  //***************
  // Switch styles
  switchStyle: {
    color: 'white', // thumb color
    backgroundColor: 'forestgreen', //rgba(0, 1, 0, 0.4)', // enabled track color
    borderColor: 'lightgrey', // disabled track color
  },

  //**********************
  // Bouton groups styles
  buttonGroupContainerStyle: {
    height: 30,
    borderRadius: 8,
    backgroundColor: '$buttongroupcolor',
  },
  buttonGroupButtonStyle: {
    borderRadius: 8,
    margin: 2,
    backgroundColor: '$buttongroupcolor',
  },
  buttonGroupSelectedButtonStyle: {
    backgroundColor: '$buttongroupselectcolor',
  },
  buttonGroupInnerBorderStyle: {
    width: 0,
  },

  //*********************
  // Rating stars styles
  ratingStarColor: {
    color: 'orange',//$textcolor',
    backgroundColor: '$bg'
  },

  //*********************
  // Progress bar styles
  progressBarStyle: {
    marginHorizontal: 10,
    marginVertical: 1,
    color: 'rgba(153, 0, 0, 1)',
  },

  separatorStyle: {
    borderBottomColor: '$buttongroupcolor',
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },

  verticalSeparatorStyle: {
    borderRightColor: '$buttongroupcolor',
    borderRightWidth: StyleSheet.hairlineWidth * 2,
  }

});

