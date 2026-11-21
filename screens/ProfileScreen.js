import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Alert,
  AppState,
  Linking,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as AuthManager from '../api/AuthManager';
import {bdovoreBaseURL} from '../api/Config';
import {
  AccountButton,
  AccountField,
  AccountPage,
  passwordHelp,
} from '../components/AccountForm';
import {CommonStyles} from '../styles/CommonStyles';

function ProfileScreen({navigation, onClose, onSessionEnded}) {
  const [profile, setProfile] = useState(AuthManager.getUser());
  const [mode, setMode] = useState('profile');
  const [busy, setBusy] = useState(false);
  const [pendingPreference, setPendingPreference] = useState(null);
  const [online, setOnline] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const actionInFlight = useRef(false);
  const profileRefresh = useRef(null);

  const refresh = useCallback(() => {
    if (actionInFlight.current || profileRefresh.current) {
      return profileRefresh.current;
    }
    profileRefresh.current = Promise.resolve().then(async () => {
      try {
        const network = await NetInfo.fetch();
        const connected =
          !!network.isConnected &&
          network.isInternetReachable !== false &&
          !global.forceOffline;
        setOnline(connected);
        if (connected && AuthManager.hasSession()) {
          setProfile(await AuthManager.refreshProfile());
        }
      } catch (err) {
        setError(err.message);
        if (err.code === 'invalid_session') {
          onSessionEnded();
        }
      } finally {
        profileRefresh.current = null;
      }
    });
    return profileRefresh.current;
  }, [onSessionEnded]);
  useEffect(() => {
    refresh();
    const focus = navigation.addListener('focus', refresh);
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
      }
    });
    return () => {
      focus();
      appState.remove();
    };
  }, [navigation, refresh]);

  const changeMode = next => {
    setMode(next);
    setError('');
    setMessage('');
    setCurrentPassword('');
    setPassword('');
    setConfirmation('');
    setCode('');
  };
  const execute = async action => {
    if (actionInFlight.current) {
      return;
    }
    actionInFlight.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      // Finish any earlier read before a write replaces the cached profile.
      await profileRefresh.current;
      const network = await NetInfo.fetch();
      if (
        !network.isConnected ||
        network.isInternetReachable === false ||
        global.forceOffline
      ) {
        throw new Error('Cette modification nécessite une connexion Internet.');
      }
      await action();
    } catch (err) {
      setError(err.message);
      if (err.code === 'invalid_session') {
        onSessionEnded();
      }
    } finally {
      actionInFlight.current = false;
      setBusy(false);
    }
  };
  const savePreference = async (field, value) => {
    if (!online || actionInFlight.current) {
      return;
    }
    setPendingPreference({field, value});
    try {
      await execute(async () => {
        setProfile(await AuthManager.updateProfile({[field]: value}));
      });
    } finally {
      setPendingPreference(null);
    }
  };
  const changePassword = () =>
    execute(async () => {
      if (password !== confirmation) {
        throw new Error('Les mots de passe ne correspondent pas.');
      }
      await AuthManager.request('/apicompte/password', {
        authenticated: true,
        body: {current_password: currentPassword, password},
      });
      await AuthManager.clearSession();
      onSessionEnded();
      Alert.alert(
        'Mot de passe modifié',
        'Veuillez vous reconnecter avec votre nouveau mot de passe.',
      );
    });
  const requestEmail = () =>
    execute(async () => {
      const result = await AuthManager.request('/apicompte/requestemail', {
        authenticated: true,
        body: {email: email.trim(), current_password: currentPassword},
      });
      setChallenge(result.challenge_id);
      changeMode('confirmEmail');
      setMessage(
        'Un code a été envoyé à votre nouvelle adresse. Il est valable 10 minutes.',
      );
    });
  const confirmEmail = () =>
    execute(async () => {
      const user = await AuthManager.confirmEmail({
        challenge_id: challenge,
        code: code.trim(),
      });
      setProfile(user);
      changeMode('profile');
      setMessage('Adresse e-mail modifiée.');
    });
  const openWebsite = url =>
    Linking.openURL(url).catch(() => {
      Alert.alert('Impossible d’ouvrir le lien', 'Veuillez réessayer.');
    });
  const shareCollection = url =>
    Share.share({message: url}).catch(() => {
      Alert.alert('Impossible de partager le lien', 'Veuillez réessayer.');
    });
  const logout = async () => {
    setBusy(true);
    try {
      await AuthManager.logout();
    } catch (err) {
      Alert.alert('Déconnexion', err.message);
    } finally {
      setBusy(false);
      onSessionEnded();
    }
  };
  const toggleOffline = async () => {
    global.forceOffline = !global.forceOffline;
    await AsyncStorage.setItem('forceOffline', global.forceOffline ? '1' : '0');
    await profileRefresh.current;
    await refresh();
  };
  const preference = (label, field) => (
    <View key={field} style={styles.row}>
      <Text style={[CommonStyles.defaultText, styles.preferenceLabel]}>
        {label}
      </Text>
      <Switch
        accessibilityLabel={label}
        value={
          pendingPreference?.field === field
            ? pendingPreference.value
            : !!profile[field]
        }
        onValueChange={value => savePreference(field, value)}
        disabled={!online || busy}
      />
    </View>
  );
  const titles = {
    profile: 'Mon profil',
    email: 'Changer mon e-mail',
    confirmEmail: 'Confirmer mon e-mail',
    password: 'Changer mon mot de passe',
  };
  if (!profile) {
    return null;
  }
  const publicId = profile.public_id ?? profile.user_id * 1209 + 951;
  const publicCollectionUrl = `${bdovoreBaseURL}/guest?user=${publicId}`;
  return (
    <AccountPage
      title={titles[mode]}
      message={
        message ||
        (!online
          ? 'Hors ligne : affichage des dernières informations enregistrées.'
          : '')
      }
      error={error}
      busy={busy}
      onClose={onClose}>
      {mode === 'profile' ? (
        <>
          <Text style={[CommonStyles.defaultText, styles.username]}>
            {profile.username}
          </Text>
          <Text style={[CommonStyles.defaultText, styles.email]}>
            {profile.email}
          </Text>
          <Text
            accessibilityRole="link"
            accessibilityState={{disabled: !online}}
            disabled={!online}
            style={[CommonStyles.defaultText, styles.emailLink]}
            onPress={() => {
              setEmail(profile.email);
              changeMode('email');
            }}>
            Changer mon e-mail
          </Text>
          {preference(
            'Activer la page publique de ma collection',
            'open_collection',
          )}
          {profile.open_collection &&
          pendingPreference?.field !== 'open_collection' ? (
            <View style={styles.publicCollection}>
              <Text
                accessibilityRole="link"
                style={[CommonStyles.defaultText, styles.link]}
                onPress={() => openWebsite(publicCollectionUrl)}>
                {publicCollectionUrl}
              </Text>
              <AccountButton
                title="Partager"
                onPress={() => shareCollection(publicCollectionUrl)}
                secondary
              />
            </View>
          ) : null}
          {preference('Afficher le contenu adulte', 'explicit_content')}
          <Text style={[CommonStyles.defaultText, styles.preferenceHelp]}>
            BDovore recense tous les types de BD, comics et mangas. Par défaut,
            les couvertures des contenus « pour adultes » ne sont pas affichées
            sur le site ni dans l’application mobile.
          </Text>
          <AccountButton
            title="Changer mon mot de passe"
            onPress={() => changeMode('password')}
            secondary
            disabled={!online}
          />
          <AccountButton
            title={
              global.forceOffline
                ? 'Revenir en mode connecté'
                : 'Passer en mode hors ligne'
            }
            onPress={toggleOffline}
            secondary
          />
          <AccountButton title="Se déconnecter" onPress={logout} secondary />
          <Text
            accessibilityRole="link"
            accessibilityHint="Ouvre votre compte sur le site BDovore pour suivre la procédure de suppression"
            style={[CommonStyles.linkText, styles.deleteLink]}
            onPress={() => openWebsite(`${bdovoreBaseURL}/compte?mobile=T`)}>
            Supprimer mon compte
          </Text>
        </>
      ) : null}
      {mode === 'email' ? (
        <AccountField
          label="Nouvelle adresse e-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
        />
      ) : null}
      {['email', 'password'].includes(mode) ? (
        <AccountField
          label="Mot de passe actuel"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          password
          autoComplete="current-password"
        />
      ) : null}
      {mode === 'password' ? (
        <>
          <AccountField
            label="Nouveau mot de passe"
            value={password}
            onChangeText={setPassword}
            password
            autoComplete="new-password"
          />
          <AccountField
            label="Confirmer le mot de passe"
            value={confirmation}
            onChangeText={setConfirmation}
            password
            autoComplete="new-password"
          />
          <Text style={CommonStyles.defaultText}>{passwordHelp}</Text>
          <AccountButton
            title="Enregistrer le mot de passe"
            onPress={changePassword}
          />
        </>
      ) : null}
      {mode === 'email' ? (
        <AccountButton
          title="Recevoir le code de confirmation"
          onPress={requestEmail}
        />
      ) : null}
      {mode === 'confirmEmail' ? (
        <>
          <AccountField
            label="Code reçu par e-mail"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={8}
            autoComplete="one-time-code"
          />
          <AccountButton title="Confirmer mon e-mail" onPress={confirmEmail} />
          <AccountButton
            title="Demander un autre code"
            onPress={() => changeMode('email')}
            secondary
          />
        </>
      ) : null}
      {mode !== 'profile' ? (
        <AccountButton
          title="Retour au profil"
          onPress={() => changeMode('profile')}
          secondary
        />
      ) : null}
    </AccountPage>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  preferenceLabel: {flex: 1, marginRight: 12},
  username: {fontSize: 20, fontWeight: '700', marginBottom: 8},
  link: {textDecorationLine: 'underline'},
  emailLink: {
    alignSelf: 'flex-start',
    fontSize: 14,
    textDecorationLine: 'underline',
    paddingVertical: 8,
    marginBottom: 12,
  },
  publicCollection: {alignItems: 'flex-start', marginBottom: 10},
  preferenceHelp: {fontSize: 14, lineHeight: 21, marginBottom: 20},
  deleteLink: {
    textAlign: 'center',
    textDecorationLine: 'underline',
    paddingVertical: 12,
  },
});
export default ProfileScreen;
