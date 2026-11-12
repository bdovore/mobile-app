import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, AppState, StyleSheet, Switch, Text, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as AuthManager from '../api/AuthManager';
import CollectionManager from '../api/CollectionManager';
import {
  AccountButton,
  AccountField,
  AccountPage,
  passwordHelp,
} from '../components/AccountForm';
import {CommonStyles} from '../styles/CommonStyles';

function ProfileScreen({navigation, onSessionEnded}) {
  const [profile, setProfile] = useState(AuthManager.getUser());
  const [draft, setDraft] = useState(AuthManager.getUser());
  const [mode, setMode] = useState('profile');
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const network = await NetInfo.fetch();
      const connected =
        !!network.isConnected &&
        network.isInternetReachable !== false &&
        !global.forceOffline;
      setOnline(connected);
      if (!connected || !AuthManager.hasSession()) {
        return;
      }
      const user = await AuthManager.refreshProfile();
      setProfile(user);
      if (!dirtyRef.current) {
        setDraft(user);
      }
    } catch (err) {
      setError(err.message);
      if (err.code === 'invalid_session') {
        onSessionEnded();
      }
    }
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

  const edit = (field, value) => {
    setDraft(previous => ({...previous, [field]: value}));
    dirtyRef.current = true;
    setDirty(true);
  };
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
    if (busy) {
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
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
      setBusy(false);
    }
  };
  const save = () =>
    execute(async () => {
      const user = await AuthManager.updateProfile({
        location: draft.location,
        birthday: draft.birthday,
        open_collection: draft.open_collection,
        explicit_content: draft.explicit_content,
        newsletter: draft.newsletter,
        square_type: draft.square_type,
      });
      setProfile(user);
      setDraft(user);
      dirtyRef.current = false;
      setDirty(false);
      setMessage('Votre profil a été enregistré.');
    });
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
      setDraft(previous => ({...previous, email: user.email}));
      changeMode('profile');
      setMessage('Adresse e-mail modifiée.');
    });
  const deleteAccount = () =>
    Alert.alert(
      'Supprimer mon compte',
      'Votre collection, vos notes et vos commentaires seront supprimés définitivement. Le compte forum reste indépendant.',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: () =>
            execute(async () => {
              await AuthManager.request('/apicompte/delete', {
                authenticated: true,
                body: {current_password: currentPassword},
              });
              if (global.db) {
                CollectionManager.clearDatabase();
              }
              await AuthManager.clearSession();
              global.collectionOwnerId = null;
              global.collectionOwnerLogin = null;
              global.login = null;
              global.localTimestamp = null;
              await AsyncStorage.multiRemove([
                'collectionOwnerId',
                'login',
                'localTimestamp',
                'collectionFetched',
              ]);
              onSessionEnded();
            }),
        },
      ],
    );
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
    await refresh();
  };
  const preference = (label, field) => (
    <View key={field} style={styles.row}>
      <Text style={[CommonStyles.defaultText, styles.preferenceLabel]}>
        {label}
      </Text>
      <Switch
        accessibilityLabel={label}
        value={!!draft[field]}
        onValueChange={value => edit(field, value)}
        disabled={!online || busy}
      />
    </View>
  );
  const titles = {
    profile: 'Mon profil',
    email: 'Changer mon e-mail',
    confirmEmail: 'Confirmer mon e-mail',
    password: 'Changer mon mot de passe',
    delete: 'Supprimer mon compte',
  };
  if (!profile || !draft) {
    return null;
  }
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
      onClose={() => navigation.goBack()}>
      {mode === 'profile' ? (
        <>
          <Text style={[CommonStyles.defaultText, styles.username]}>
            {profile.username}
          </Text>
          <Text style={[CommonStyles.defaultText, styles.email]}>
            {profile.email}
          </Text>
          <AccountField
            label="Localisation"
            value={draft.location || ''}
            onChangeText={value => edit('location', value)}
            editable={online}
          />
          <AccountField
            label="Date de naissance (AAAA-MM-JJ)"
            value={draft.birthday || ''}
            onChangeText={value => edit('birthday', value)}
            maxLength={10}
            editable={online}
          />
          {preference(
            'Autoriser la consultation de ma collection',
            'open_collection',
          )}
          {preference('Afficher le contenu adulte', 'explicit_content')}
          {preference('Recevoir la newsletter', 'newsletter')}
          <View style={styles.row}>
            <Text style={CommonStyles.defaultText}>Carré magique manuel</Text>
            <Switch
              accessibilityLabel="Carré magique manuel"
              value={draft.square_type === 1}
              onValueChange={value => edit('square_type', value ? 1 : 0)}
              disabled={!online || busy}
            />
          </View>
          <AccountButton
            title="Enregistrer mon profil"
            onPress={save}
            disabled={!online || !dirty}
          />
          <AccountButton
            title="Changer mon e-mail"
            onPress={() => {
              setEmail(profile.email);
              changeMode('email');
            }}
            secondary
            disabled={!online}
          />
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
          <AccountButton
            title="Supprimer mon compte"
            onPress={() => changeMode('delete')}
            secondary
            disabled={!online}
          />
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
      {['email', 'password', 'delete'].includes(mode) ? (
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
      {mode === 'delete' ? (
        <>
          <Text style={CommonStyles.defaultText}>
            Cette action supprime définitivement votre compte BDovore et votre
            collection. Votre compte forum reste indépendant.
          </Text>
          <AccountButton
            title="Supprimer définitivement mon compte"
            onPress={deleteAccount}
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
  email: {marginBottom: 20},
});
export default ProfileScreen;
