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

import React, {useEffect, useState} from 'react';
import {Text} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthManager from '../api/AuthManager';
import * as APIManager from '../api/APIManager';
import CollectionManager from '../api/CollectionManager';
import ProfileScreen from './ProfileScreen';
import {
  AccountButton,
  AccountField,
  AccountPage,
  passwordHelp,
} from '../components/AccountForm';
import {CommonStyles} from '../styles/CommonStyles';

function LoginScreen({navigation}) {
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [loginNeedsPseudo, setLoginNeedsPseudo] = useState(false);
  const [accountPseudo, setAccountPseudo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    AuthManager.initialize()
      .then(() => {
        if (!active) {
          return;
        }
        setUsername(global.collectionOwnerLogin ?? '');
        setConnected(AuthManager.hasSession());
        setReady(true);
      })
      .catch(err => {
        if (active) {
          setError(err.message);
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  const close = () =>
    navigation.canGoBack()
      ? navigation.goBack()
      : navigation.navigate('CoreTab');
  const changeMode = (next, nextMessage = '') => {
    setLoginNeedsPseudo(false);
    setAccountPseudo('');
    setMode(next);
    setError('');
    setMessage(nextMessage);
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
      await action();
    } catch (err) {
      if (err.code === 'pseudo_required') {
        setLoginNeedsPseudo(true);
      }
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const requireMatchingPassword = () => {
    if (!password || password !== confirmation) {
      throw new Error('Les mots de passe ne correspondent pas.');
    }
  };
  const signIn = () =>
    execute(async () => {
      const network = await NetInfo.fetch();
      if (!network.isConnected) {
        throw new Error(
          'La connexion nécessite Internet. Vous pouvez consulter votre collection hors ligne.',
        );
      }
      await AuthManager.login(
        username.trim(),
        password,
        async () => {
          if (!global.db) {
            throw new Error(
              'La collection locale est en cours d’ouverture. Réessayez.',
            );
          }
          CollectionManager.clearDatabase();
        },
        accountPseudo.trim(),
      );
      global.isConnected = true;
      APIManager.fetchSponsors(result => {
        if (!result.error) {
          global.sponsorsList = JSON.stringify(result.items);
          AsyncStorage.setItem('sponsorsList', global.sponsorsList).catch(
            () => {},
          );
        }
      });
      setPassword('');
      setConnected(true);
      close();
    });
  const register = () =>
    execute(async () => {
      requireMatchingPassword();
      const result = await AuthManager.request('/apiauth/register', {
        body: {username: username.trim(), email: email.trim(), password},
      });
      setChallenge(result.challenge_id);
      changeMode(
        'verify',
        'Un code a été envoyé par e-mail. Il est valable 10 minutes.',
      );
    });
  const verify = () =>
    execute(async () => {
      await AuthManager.request('/apiauth/verify', {
        body: {challenge_id: challenge, code: code.trim()},
      });
      changeMode(
        'login',
        'Votre compte est confirmé. Connectez-vous avec votre pseudo et votre mot de passe.',
      );
    });
  const forgot = () =>
    execute(async () => {
      const result = await AuthManager.request('/apiauth/forgotpassword', {
        body: {username: username.trim(), email: email.trim()},
      });
      setChallenge(result.challenge_id);
      changeMode('reset', result.message);
    });
  const reset = () =>
    execute(async () => {
      requireMatchingPassword();
      await AuthManager.request('/apiauth/resetpassword', {
        body: {challenge_id: challenge, code: code.trim(), password},
      });
      changeMode('login', 'Mot de passe modifié. Veuillez vous connecter.');
    });
  const offline = () =>
    execute(async () => {
      if (!global.collectionOwnerLogin || !global.collectionFetched) {
        throw new Error('Aucune collection enregistrée sur cet appareil.');
      }
      global.forceOffline = true;
      global.isConnected = false;
      await AsyncStorage.setItem('forceOffline', '1');
      close();
    });
  if (connected && AuthManager.hasSession()) {
    return (
      <ProfileScreen
        navigation={navigation}
        onSessionEnded={() => {
          setConnected(false);
          changeMode('login');
        }}
      />
    );
  }
  const titles = {
    login: 'Connexion à BDovore',
    register: 'Créer mon compte',
    verify: 'Confirmer mon compte',
    forgot: 'Mot de passe oublié',
    reset: 'Nouveau mot de passe',
  };
  return (
    <AccountPage
      title={titles[mode]}
      message={message}
      error={error}
      busy={busy || !ready}
      onClose={close}>
      {['login', 'register', 'forgot'].includes(mode) ? (
        <AccountField
          label={mode === 'login' ? 'Pseudo ou e-mail' : 'Pseudo'}
          value={username}
          onChangeText={value => {
            setUsername(value);
            if (mode === 'login') {
              setLoginNeedsPseudo(false);
              setAccountPseudo('');
            }
          }}
          autoComplete="username"
        />
      ) : null}
      {mode === 'login' && loginNeedsPseudo ? (
        <AccountField
          label="Pseudo de la collection"
          value={accountPseudo}
          onChangeText={setAccountPseudo}
          autoComplete="off"
        />
      ) : null}
      {['register', 'forgot'].includes(mode) ? (
        <AccountField
          label="Adresse e-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
        />
      ) : null}
      {['verify', 'reset'].includes(mode) ? (
        <AccountField
          label="Code reçu par e-mail"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={8}
          autoComplete="one-time-code"
        />
      ) : null}
      {['login', 'register', 'reset'].includes(mode) ? (
        <AccountField
          label={mode === 'reset' ? 'Nouveau mot de passe' : 'Mot de passe'}
          value={password}
          onChangeText={setPassword}
          password
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      ) : null}
      {['register', 'reset'].includes(mode) ? (
        <>
          <AccountField
            label="Confirmer le mot de passe"
            value={confirmation}
            onChangeText={setConfirmation}
            password
            autoComplete="new-password"
          />
          <Text style={CommonStyles.defaultText}>{passwordHelp}</Text>
        </>
      ) : null}
      {mode === 'login' ? (
        <>
          <AccountButton
            title="Se connecter"
            onPress={signIn}
            disabled={!ready || busy}
          />
          <AccountButton
            title="Créer un compte"
            onPress={() => changeMode('register')}
            secondary
          />
          <AccountButton
            title="Mot de passe oublié"
            onPress={() => changeMode('forgot')}
            secondary
          />
          {global.collectionOwnerLogin && global.collectionFetched ? (
            <AccountButton
              title={'Consulter hors ligne : ' + global.collectionOwnerLogin}
              onPress={offline}
              secondary
            />
          ) : null}
        </>
      ) : null}
      {mode === 'register' ? (
        <AccountButton title="Créer mon compte" onPress={register} />
      ) : null}
      {mode === 'verify' ? (
        <>
          <AccountButton title="Confirmer mon compte" onPress={verify} />
          <AccountButton
            title="Renvoyer un code"
            onPress={() =>
              changeMode(
                'register',
                'Renseignez à nouveau les mêmes identifiants pour recevoir un nouveau code.',
              )
            }
            secondary
          />
        </>
      ) : null}
      {mode === 'forgot' ? (
        <AccountButton title="Recevoir un code" onPress={forgot} />
      ) : null}
      {mode === 'reset' ? (
        <>
          <AccountButton title="Enregistrer le mot de passe" onPress={reset} />
          <AccountButton
            title="Demander un autre code"
            onPress={() => changeMode('forgot')}
            secondary
          />
        </>
      ) : null}
      {mode !== 'login' ? (
        <AccountButton
          title="Retour à la connexion"
          onPress={() => changeMode('login')}
          secondary
        />
      ) : null}
    </AccountPage>
  );
}
export default LoginScreen;
