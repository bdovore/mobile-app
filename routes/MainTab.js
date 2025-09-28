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
import { Alert, Platform, Share, TouchableOpacity, Text, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useRoute, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';

import { bdovored, bdovorlightred, CommonStyles } from '../styles/CommonStyles';
import { Icon } from '../components/Icon';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';
import AlbumScreen from '../screens/AlbumScreen';
import AuteurScreen from '../screens/AuteurScreen';
import BarcodeScanner from '../screens/BarcodeScanner';
import CollectionPanel from '../panels/CollectionPanel';
import CollectionScreen from '../screens/CollectionScreen';
import CommentsScreen from '../screens/CommentsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ImageScreen from '../screens/ImageScreen';
import LoginScreen from '../screens/LoginScreen';
import BurgerMenuPanel from '../panels/BurgerMenuPanel';
import NewsScreen from '../screens/NewsScreen';
import SearchScreen from '../screens/SearchScreen';
import SerieScreen from '../screens/SerieScreen';
import CollectionStatScreen from '../screens/CollectionStatScreen';
import ToCompleteScreen from '../screens/ToCompleteScreen';
import WishlistScreen from '../screens/WishlistScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';


// The main tab navigator
const Tab = createBottomTabNavigator();

// The stack navigators for each tab
const CollectionStack = createStackNavigator();
const WishlistStack = createStackNavigator();
const ToCompleteStack = createStackNavigator();
const NewsStack = createStackNavigator();
const SearchStack = createStackNavigator();
const StatsStack = createStackNavigator();
const CommentsStack = createStackNavigator();

const ShareIcon = () => (
  Platform.OS == 'ios' ?
    <Ionicons name='share-outline' size={25} color={CommonStyles.iconStyle.color} /> :
    <Icon name='Ionicons/share-social-outline' size={25} color={CommonStyles.iconStyle.color} />);

const onShareCollectionPress = () => {

  const shareCollection = () => {
    const url = APIManager.bdovoreBaseURL + '/guest?user=' + Helpers.getLoggedUserid();
    Share.share({
      message: url,
      url: url
    });
  }

  if (global.openCollection) {
    shareCollection();
  } else {
    Alert.alert('Partager ma collection',
      'Le lien partagé ne fonctionnera qu\'après avoir autorisé la consultation de ' +
      'votre collection par d\'autres utilisateurs sur la page profil du site internet.',
      [{
        text: "Oui",
        onPress: () => shareCollection()
      }, {
        text: "Annuler",
        onPress: () => { },
        style: "cancel"
      }],
      { cancelable: true });
  }
}

const onShareSeriePress = async (item) => {
  const url = APIManager.bdovoreBaseURL + '/serie-bd-' + item.ID_SERIE;
  Share.share({
    message: url,
    url: url
  });
}

const shareAlbumButton = (item) => {
  return (
    <TouchableOpacity onPress={() => onShareAlbumPress(item)} style={{ margin: 8 }}>
      <ShareIcon />
    </TouchableOpacity>
  );
}

const onShareAlbumPress = async (item) => {
  const url = APIManager.bdovoreBaseURL + '/Album?id_tome=' + item.ID_TOME;
  Share.share({
    message: url,
    url: url
  });
}

const onShareAuthorPress = async (item) => {
  const url = APIManager.bdovoreBaseURL + '/auteur-bd-' + item.ID_AUTEUR;
  Share.share({
    message: url,
    url: url
  });
}

const shareCollectionButton = () => {
  return (
    <TouchableOpacity onPress={onShareCollectionPress} style={{ margin: 8 }}>
      <ShareIcon />
    </TouchableOpacity>
  );
}

const shareSerieButton = (item) => {
  return (
    <TouchableOpacity onPress={() => onShareSeriePress(item)} style={{ margin: 8 }}>
      <ShareIcon />
    </TouchableOpacity>
  );
}

const shareAuthorButton = (item) => {
  return (
    <TouchableOpacity onPress={() => onShareAuthorPress(item)} style={{ margin: 8 }}>
      <ShareIcon />
    </TouchableOpacity>
  );
}

const defaultStackOptions = {
  headerTintColor: bdovored,
  headerTruncatedBackTitle: ''
};

const darkStackOptions = {
  headerTintColor: bdovorlightred,
  headerTruncatedBackTitle: ''
};

function CollectionScreens({ route, navigation }) {

  const [collectionGenre, setCollectionGenre] = useState(0);
  const [showCollectionChooser, setShowCollectionChooser] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  const onDashboardScreenPress = (userid) => {
    navigation.push('Dashboard', { userid });
  }

  const onStatScreenPress = (userid) => {
    navigation.push('CollectionStat', { userid });
  }

  const onCollectionGenrePress = () => {
    setShowCollectionChooser(!showCollectionChooser);
  }

  const settingsButton = (route, navigation) => {
    return (
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={() => onDashboardScreenPress(Helpers.getLoggedUserid())} style={{ margin: 8 }}>
          <Icon name='AntDesign/dashboard' size={25} color={CommonStyles.iconStyle.color} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onStatScreenPress(Helpers.getLoggedUserid())} style={{ margin: 8 }}>
          <Icon name='Ionicons/stats-chart-outline' size={25} color={CommonStyles.iconStyle.color} />
          </TouchableOpacity>

        <TouchableOpacity onPress={onCollectionGenrePress} style={{ margin: 8 }}>
          <Icon name='Ionicons/library-outline' size={25} color={CommonStyles.iconStyle.color} />
        </TouchableOpacity>

        <CollectionPanel route={route}
          navigation={navigation}
          isVisible={showCollectionChooser}
          visibleSetter={setShowCollectionChooser}
          collectionGenre={collectionGenre}
          setCollectionGenre={setCollectionGenre} />
      </View>
    );
  }

  return (
    <CollectionStack.Navigator screenOptions={global.isDarkMode ? darkStackOptions : defaultStackOptions}>
      <CollectionStack.Screen name='Ma collection '
        component={CollectionScreen}
        options={({ route }) => {
          route.params = { collectionGenre: collectionGenre };
          return {
            //headerLeft: () => accountButton(navigation),
            headerRight: () => settingsButton(route, navigation),
          };
        }} />
      <CollectionStack.Screen name='Dashboard' component={DashboardScreen}
        options={({ route }) => ({
          title: 'Tableau de bord',
          headerRight: () => shareCollectionButton()
        })} />
        <CollectionStack.Screen name='CollectionStat' component={CollectionStatScreen}
        options={({ route }) => ({
          title: 'Statistiques de la collection',
          headerRight: () => shareCollectionButton()
        })} />
      <CollectionStack.Screen name='Serie' component={SerieScreen}
        options={({ route }) => ({
          title: route.params.item.NOM_SERIE,
          headerRight: () => shareSerieButton(route.params.item)
        })} />
      <CollectionStack.Screen name='Album' component={AlbumScreen}
        options={({ route }) => ({
          title: route.params.item.TITRE_TOME,
          headerRight: () => shareAlbumButton(route.params.item)
        })} />
      <CollectionStack.Screen name='Auteur' component={AuteurScreen}
        options={({ route }) => ({
          title: Helpers.reverseAuteurName(route.params.author.PSEUDO),
          headerRight: () => shareAuthorButton(route.params.author)
        })} />
      <CollectionStack.Screen name='BarcodeScanner' component={BarcodeScanner}
        options={({ title: 'Scan code-barre' })} />
    </CollectionStack.Navigator>
  );
}

function WishlistScreens({ navigation }) {

  const [collectionGenre, setCollectionGenre] = useState(0);
  const [showCollectionChooser, setShowCollectionChooser] = useState(false);

  const onCollectionGenrePress = () => {
    setShowCollectionChooser(!showCollectionChooser);
  }

  const onShareWishlistPress = () => {

    const shareWishlist = () => {
      const url = APIManager.bdovoreBaseURL + '/guest/wishlist?user=' + Helpers.getUserid();
      Share.share({
        message: url,
        url: url
      });
    }

    if (global.openCollection) {
      shareWishlist();
    } else {
      Alert.alert('Partager ma wishlist',
        'Le lien partagé ne fonctionnera que si vous avez autorisé la consultation de ' +
        'votre collection par d\'autres utilisateurs sur la page profil du site internet.',
        [{
          text: "Oui",
          onPress: () => shareWishlist()
        }, {
          text: "Annuler",
          onPress: () => { },
          style: "cancel"
        }],
        { cancelable: true });
    }
  }


  const settingsButton = (route, navigation) => {
    return (
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={onShareWishlistPress} style={{ margin: 8 }}>
          <ShareIcon />
        </TouchableOpacity>
        <TouchableOpacity onPress={onCollectionGenrePress} style={{ margin: 8 }}>
          <Icon name='Ionicons/library-outline' size={25} color={CommonStyles.iconStyle.color} />
        </TouchableOpacity>

        <CollectionPanel route={route}
          navigation={navigation}
          isVisible={showCollectionChooser}
          visibleSetter={setShowCollectionChooser}
          collectionGenre={collectionGenre}
          setCollectionGenre={setCollectionGenre} />
      </View>
    );
  }

  return (
    <WishlistStack.Navigator screenOptions={global.isDarkMode ? darkStackOptions : defaultStackOptions}>
      <WishlistStack.Screen name='Mes envies'
        component={WishlistScreen}
        options={({ route }) => {
          route.params = { collectionGenre: collectionGenre };
          return {
            headerRight: () => settingsButton(route, navigation),
          };
        }}
      />
      <WishlistStack.Screen name='Serie' component={SerieScreen}
        options={({ route }) => ({
          title: route.params.item.NOM_SERIE,
          headerRight: () => shareSerieButton(route.params.item)
        })} />
      <WishlistStack.Screen name='Album' component={AlbumScreen}
        options={({ route }) => ({
          title: route.params.item.TITRE_TOME,
          headerRight: () => shareAlbumButton(route.params.item)
        })} />
      <WishlistStack.Screen name='Auteur' component={AuteurScreen}
        options={({ route }) => ({
          title: Helpers.reverseAuteurName(route.params.author.PSEUDO),
          headerRight: () => shareAuthorButton(route.params.author)
        })} />
    </WishlistStack.Navigator>
  );
}

function ToCompleteScreens({ navigation }) {

  const [collectionGenre, setCollectionGenre] = useState(0);
  const [showCollectionChooser, setShowCollectionChooser] = useState(false);

  const onCollectionGenrePress = () => {
    setShowCollectionChooser(!showCollectionChooser);
  }

  const settingsButton = (route, navigation) => {
    return (
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={onCollectionGenrePress} style={{ margin: 8 }}>
          <Icon name='Ionicons/library-outline' size={25} color={CommonStyles.iconStyle.color} />
        </TouchableOpacity>

        <CollectionPanel route={route}
          navigation={navigation}
          isVisible={showCollectionChooser}
          visibleSetter={setShowCollectionChooser}
          collectionGenre={collectionGenre}
          setCollectionGenre={setCollectionGenre} />
      </View>
    );
  }

  return (
    <ToCompleteStack.Navigator screenOptions={global.isDarkMode ? darkStackOptions : defaultStackOptions}>
      <ToCompleteStack.Screen name='Albums manquants'
        component={ToCompleteScreen}
        options={({ route }) => {
          route.params = { collectionGenre: collectionGenre };
          return {
            headerRight: () => settingsButton(route, navigation),
          };
        }} />
      <ToCompleteStack.Screen name='Serie' component={SerieScreen}
        options={({ route }) => ({
          title: route.params.item.NOM_SERIE,
          headerRight: () => shareSerieButton(route.params.item)
        })} />
      <ToCompleteStack.Screen name='Album' component={AlbumScreen}
        options={({ route }) => ({
          title: route.params.item.TITRE_TOME,
          headerRight: () => shareAlbumButton(route.params.item)
        })} />
      <ToCompleteStack.Screen name='Auteur' component={AuteurScreen}
        options={({ route }) => ({
          title: Helpers.reverseAuteurName(route.params.author.PSEUDO),
          headerRight: () => shareAuthorButton(route.params.author)
        })} />
    </ToCompleteStack.Navigator>
  );
}

function NewsScreens({ navigation }) {
  const [collectionGenre, setCollectionGenre] = useState(1);
  const [showCollectionChooser, setShowCollectionChooser] = useState(false);

  const onCollectionGenrePress = () => {
    setShowCollectionChooser(!showCollectionChooser);
  }

  const settingsButton = (route, navigation) => {
    return (
      <View style={{ flexDirection: 'row' }}>

        <TouchableOpacity onPress={onCollectionGenrePress} style={{ margin: 8 }}>
          <Icon name='Ionicons/library-outline' size={25} color={CommonStyles.iconStyle.color} />
        </TouchableOpacity>

        <CollectionPanel route={route}
          navigation={navigation}
          isVisible={showCollectionChooser}
          visibleSetter={setShowCollectionChooser}
          collectionGenre={collectionGenre}
          setCollectionGenre={setCollectionGenre}
          noAllEntry={true} />
      </View>
    );
  }

  return (
    <NewsStack.Navigator screenOptions={global.isDarkMode ? darkStackOptions : defaultStackOptions}>
      <NewsStack.Screen name='Actualité ' component={NewsScreen}
        options={({ route }) => {
          route.params = { collectionGenre: collectionGenre };
          return {
            headerRight: () => settingsButton(route, navigation),
          };
        }} />
      <NewsStack.Screen name='Album' component={AlbumScreen}
        options={({ route }) => ({
          title: route.params.item.TITRE_TOME,
          headerRight: () => shareAlbumButton(route.params.item)
        })} />
      <NewsStack.Screen name='Serie' component={SerieScreen}
        options={({ route }) => ({
          title: route.params.item.NOM_SERIE,
          headerRight: () => shareSerieButton(route.params.item)
        })} />
      <NewsStack.Screen name='Auteur' component={AuteurScreen}
        options={({ route }) => ({
          title: Helpers.reverseAuteurName(route.params.author.PSEUDO),
          headerRight: () => shareAuthorButton(route.params.author)
        })} />
    </NewsStack.Navigator>
  );
}

function SearchScreens({ navigation }) {
  return (
    <SearchStack.Navigator screenOptions={global.isDarkMode ? darkStackOptions : defaultStackOptions}>
      <SearchStack.Screen name='Rechercher ' component={SearchScreen} />
      <SearchStack.Screen name='Serie' component={SerieScreen}
        options={({ route }) => ({
          title: route.params.item.NOM_SERIE,
          headerRight: () => shareSerieButton(route.params.item)
        })} />
      <SearchStack.Screen name='Album' component={AlbumScreen}
        options={({ route }) => ({
          title: route.params.item.TITRE_TOME,
          headerRight: () => shareAlbumButton(route.params.item)
        })} />
      <SearchStack.Screen name='Auteur' component={AuteurScreen}
        options={({ route }) => ({
          title: Helpers.reverseAuteurName(route.params.author.PSEUDO),
          headerRight: () => shareAuthorButton(route.params.author)
        })} />
      <SearchStack.Screen name='BarcodeScanner' component={BarcodeScanner}
        options={({ title: 'Scan code-barre' })} />
    </SearchStack.Navigator>
  );
}

function CollectionStatScreens({ navigation }) {
  return (
    <StatsStack.Navigator screenOptions={global.isDarkMode ? darkStackOptions : defaultStackOptions}>
      <StatsStack.Screen name='Statistiques de la Collection' component={CollectionStatScreen} />
    </StatsStack.Navigator>
  );
}

function CommentsScreens({ navigation }) {
  return (
    <CommentsStack.Navigator screenOptions={global.isDarkMode ? darkStackOptions : defaultStackOptions}>
      <CommentsStack.Screen name='Comments' component={CommentsScreen}
        options={({ route }) => ({
          title: 'Dernières critiques',
        })} />
      <CommentsStack.Screen name='Serie' component={SerieScreen}
        options={({ route }) => ({
          title: route.params.item.NOM_SERIE,
          headerRight: () => shareSerieButton(route.params.item)
        })} />
      <CommentsStack.Screen name='Album' component={AlbumScreen}
        options={({ route }) => ({
          title: route.params.item.TITRE_TOME,
          headerRight: () => shareAlbumButton(route.params.item)
        })} />
      <CommentsStack.Screen name='Auteur' component={AuteurScreen}
        options={({ route }) => ({
          title: Helpers.reverseAuteurName(route.params.author.PSEUDO),
          headerRight: () => shareAuthorButton(route.params.author)
        })} />
    </CommentsStack.Navigator>
  )
}

function CoreTab() {

  const [showBurgerMenuPanel, setShowBurgerMenuPanel] = useState(false);
  const route = useRoute();
  const routeName = getFocusedRouteNameFromRoute(route) ?? '';


  const isMoreItemEnabled = () => {
    if (showBurgerMenuPanel) return true;
    //console.log("route: " + routeName);
    switch (routeName) {
      case 'Critiques':
      case 'Stats':
        return true;
      default:
        break;
    }
    return false;
  }

  const onToggleBurgerMenuPanel = () => {
    setShowBurgerMenuPanel(prevState => !prevState); // Inverse l'état actuel
  };
  const onShowBurgerMenuPanel = () => {
    setShowBurgerMenuPanel(true);
  }

  const getIcon = (icon, params) => {
    return (
      <Icon name={icon} color={params.color} size={params.size} />
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName='Ma collection'
        screenOptions={{ gestureEnabled: false, headerShown: false }}
        tabBarOptions={{ activeTintColor: global.isDarkMode ? bdovorlightred : bdovored }}
        animationEnabled={true}
      >
        <Tab.Screen
          name='Ma collection'
          component={CollectionScreens}
          options={{
            headerShown: false,
            tabBarIcon: (p) => {
              return getIcon('Ionicons/home-outline', p);
            }
          }}
        />
        <Tab.Screen
          name='Wishlist'
          component={WishlistScreens}
          options={{
            headerShown: false,
            tabBarIcon: (p) => {
              return getIcon('Ionicons/heart-outline', p);
            }
          }}
        />
        <Tab.Screen
          name='A compléter'
          component={ToCompleteScreens}
          options={{
            headerShown: false,
            tabBarIcon: (p) => {
              return getIcon('SimpleLineIcons/puzzle', p);
            }
          }}
        />
        <Tab.Screen
          name='Actualité'
          component={NewsScreens}
          options={{
            headerShown: false,
            tabBarIcon: (p) => {
              return getIcon('Ionicons/megaphone-outline', p);//'fiber-new'
            }
          }}
        />
        <Tab.Screen
          name='Rechercher'
          component={SearchScreens}
          options={{
            headerShown: false,
            tabBarIcon: (p) => {
              return getIcon('MaterialIcons/search', p);
            }
          }}
        />

        {/***** HAMBURGER TABS *****/}

        <Tab.Screen
          name='Plus'
          component={SearchScreens}
          options={{
            tabBarButton: props => <TouchableOpacity {...props}
              onLongPress={onToggleBurgerMenuPanel}
              onPress={onToggleBurgerMenuPanel}
              style={{
                color: isMoreItemEnabled() ? (global.isDarkMode ? bdovorlightred : bdovored) : 'gray', width: 40
              }} />,
            tabBarLabel: props => <Text style={{
              fontSize: 10,
              textAlign: 'center',
              backgroundColor: 'transparent',
              color: isMoreItemEnabled() ? (global.isDarkMode ? bdovorlightred : bdovored) : 'gray'
            }}>Plus</Text>,
            tabBarIcon: (p) => {
              if (isMoreItemEnabled()) p.color = global.isDarkMode ? bdovorlightred : bdovored;
              return getIcon('MaterialIcons/more-vert', p);
            }
          }}
        />
        <Tab.Screen
          name='CollectionStat'
          component={CollectionStatScreens}
          options={{
            tabBarButton: props => <TouchableWithoutFeedback {...props}
              onPress={() => {}} style={{ width: 0 }} />,
            tabBarIcon: (p) => {
              return getIcon('chart-line', p);
            }
          }}
        />
        <Tab.Screen
          name='Critiques'
          component={CommentsScreens}
          options={{
            headerShown: false,
            tabBarButton: props => <TouchableWithoutFeedback {...props}
              onPress={() => { }} style={{ width: 0 }} />,
            tabBarIcon: (p) => {
              return getIcon('FontAwesome/comments-o', p);
            }
          }}
        />
      </Tab.Navigator>

      <BurgerMenuPanel
        isVisible={showBurgerMenuPanel}
        visibleSetter={setShowBurgerMenuPanel} />

    </View>
  );
}

const RootStack = createStackNavigator();

function MainTab() {
  return (
    <RootStack.Navigator mode="modal" headerMode="none" >
      <RootStack.Screen name="CoreTab" component={CoreTab} />
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="Image" component={ImageScreen} />
    </RootStack.Navigator>
  );
}

export default MainTab;
