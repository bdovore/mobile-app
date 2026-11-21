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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Keyboard, Modal, Pressable,
  SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Icon } from '../components/Icon';
import * as API from '../api/APIManager';
import { toDict } from '../api/Helpers';
import CollectionManager from '../api/CollectionManager';
import SettingsManager from '../api/SettingsManager';
import { useCatalogue } from '../api/useCatalogue';
import { bdovored, CommonStyles } from '../styles/CommonStyles';

const names = { ser: 'Séries', alb: 'Albums', aut: 'Auteurs' };
const details = {
  ser: ['Serie', 'id_serie', 1], alb: ['Album', 'id_tome', 2], aut: ['Auteur', 'id_auteur', 2],
};
const rayons = ['', 'BD', 'Mangas', 'Comics'];

function Button({ label, onPress, selected, disabled, image }) {
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
    accessibilityState={{ selected, disabled }} style={[styles.button, selected && styles.selected]}>
    {!!image && <Image source={{ uri: image }} style={styles.rayon} />}
    <Text style={[CommonStyles.defaultText, selected && styles.white]}>{label}</Text>
  </Pressable>;
}

function Cover({ row, large }) {
  return <Image resizeMode="contain" style={large ? styles.largeCover : styles.cover}
    source={{ uri: API.getAlbumCoverURL({ IMG_COUV: row.cover || 'default.png' }) }} />;
}

function SeriePreview({ serie, open }) {
  const params = useMemo(() => ({ scope: 'alb', serie: serie.id }), [serie.id]);
  const { page, busy, error, load } = useCatalogue(params);
  const group = page?.groups.alb;
  return <View style={[styles.preview, global.isDarkMode && styles.darkPreview]}>
    <FlatList horizontal keyboardShouldPersistTaps="handled" data={group?.rows || []}
      keyExtractor={row => String(row.id)} renderItem={({ item }) =>
        <Pressable accessibilityRole="button" onPress={() => open('alb', item)} style={styles.tile}>
          <Cover row={item} large />
          <Text style={CommonStyles.defaultText} numberOfLines={2}>{item.number ? 'T. ' + item.number + ' · ' : ''}{item.label}</Text>
        </Pressable>}
      ListFooterComponent={group?.more && !busy ?
        <Button label="Plus de tomes" onPress={() => load(group.rows.length)} /> : null} />
    {busy && <ActivityIndicator />}
    {!!error && <Button label="Réessayer les tomes" onPress={() => load(group?.rows.length || 0)} />}
    <Button label="Voir la série" onPress={() => open('ser', serie)} />
  </View>;
}

function CatalogueList({ params, open, onGenres }) {
  const { page, busy, error, load } = useCatalogue(params);
  const [expanded, setExpanded] = useState(null);
  useEffect(() => { if (page?.genres) onGenres?.(page.genres); }, [page?.genres, onGenres]);
  const sections = Object.entries(page?.groups || {}).filter(([, group]) => group.rows.length)
    .map(([kind, group]) => ({ kind, data: group.rows, more: group.more, key: kind }));

  return <SectionList sections={sections} keyboardShouldPersistTaps="handled" stickySectionHeadersEnabled={false}
    keyExtractor={item => String(item.id)} extraData={expanded}
    ListHeaderComponent={page?.approximate ? <Text style={CommonStyles.defaultText}>Résultats proches de votre recherche</Text> : null}
    renderSectionHeader={({ section }) => params.scope === 'all' ?
      <Text style={[CommonStyles.defaultText, styles.heading]}>{names[section.kind]}</Text> : null}
    renderItem={({ item, section: { kind } }) => {
      const isSeries = kind === 'ser';
      const isOpen = isSeries && expanded === item.id;
      return <View>
        <Pressable style={styles.row} accessibilityRole="button" accessibilityState={isSeries ? { expanded: isOpen } : {}}
          onPress={() => {
            Keyboard.dismiss();
            if (isSeries) setExpanded(isOpen ? null : item.id);
            else open(kind, item);
          }}>
          {kind !== 'aut' && <Cover row={item} />}
          <View style={styles.flex}>
            <Text style={[CommonStyles.defaultText, styles.title]}>{item.label || 'Sans titre'}</Text>
            {!!item.subtitle && <Text style={CommonStyles.defaultText}>{item.subtitle}{item.number ? ' · T. ' + item.number : ''}</Text>}
          </View>
          <Text style={CommonStyles.defaultText}>{isOpen ? '⌄' : '›'}</Text>
        </Pressable>
        {isOpen && <SeriePreview serie={item} open={open} />}
      </View>;
    }}
    renderSectionFooter={({ section }) => section.more ?
      <Button disabled={busy} label={'Afficher plus · ' + names[section.kind]}
        onPress={() => load(section.data.length, section.kind)} /> : null}
    ListEmptyComponent={!busy && !error ? <Text style={[CommonStyles.defaultText, styles.heading]}>Aucun résultat.</Text> : null}
    ListFooterComponent={<View>
      {busy && <ActivityIndicator style={styles.heading} />}
      {!!error && <Text accessibilityRole="alert" style={CommonStyles.errorTextStyle}>{error}</Text>}
      {!!error && !page && <Button label="Réessayer" onPress={() => load()} />}
      {!!params.q && !busy && !error && <Button label="Proposer un ajout" onPress={() => API.addProposition(params.q)} />}
    </View>} />;
}

export default function SearchScreen({ navigation }) {
  const [text, setText] = useState('');
  const [scope, setScope] = useState('ser');
  const [rayon, setRayon] = useState('');
  const [genre, setGenre] = useState(null);
  const [genres, setGenres] = useState([]);
  const [picker, setPicker] = useState(false);
  const [online, setOnline] = useState(global.isConnected);
  const focused = useIsFocused();
  const opening = useRef(null);
  const query = text.trim();
  const browse = useMemo(() => ({ scope, rayon, genre: genre?.id || 0, facets: 1 }), [scope, rayon, genre]);
  const search = useMemo(() => ({ scope: 'all', q: query }), [query]);
  const refresh = () => SettingsManager.getConnectionStatus(() => setOnline(global.isConnected && !global.forceOffline));
  useEffect(() => {
    if (focused) refresh();
    return () => opening.current?.abort();
  }, [focused]);
  useEffect(() => { opening.current?.abort(); }, [query, browse]);

  async function open(kind, row) {
    opening.current?.abort();
    const controller = new AbortController();
    opening.current = controller;
    const [screen, field, mode] = details[kind];
    try {
      let item = row.edition;
      if (!item) {
        const records = await API.catalogueRequest(screen, { [field]: row.id, mode }, controller.signal);
        item = records?.[0];
        if (!item) throw new Error('Cette fiche est indisponible.');
        if (kind === 'alb' && global.db) item = toDict(CollectionManager.getFirstAlbumEditionOfSerieInCollection(item));
      }
      if (!controller.signal.aborted) navigation.push(screen, kind === 'aut' ? { author: item } : { item });
    } catch (e) {
      if (!controller.signal.aborted) Alert.alert('Ouverture de la fiche', e.message);
    }
  }

  if (!online || global.forceOffline) return <View style={CommonStyles.screenStyle}>
    <Text style={[CommonStyles.defaultText, styles.heading]}>Recherche indisponible hors connexion.</Text>
    <Button label="Réessayer" onPress={refresh} />
  </View>;
  return <View style={CommonStyles.screenStyle}>
    <View style={styles.toolbar}>
      <TextInput value={text} onChangeText={setText} placeholder="Titre, auteur ou ISBN…"
        accessibilityLabel="Rechercher dans le catalogue" placeholderTextColor="#888" maxLength={120}
        autoCapitalize="none" autoCorrect={false} returnKeyType="search" style={[CommonStyles.defaultText, styles.input]} />
      {!!text && <Button label="Effacer" onPress={() => setText('')} />}
      <Pressable style={styles.button} accessibilityLabel="Scanner un code-barres" accessibilityRole="button"
        onPress={() => navigation.push('BarcodeScanner')}><Icon name="barcode-scan" size={30} color={CommonStyles.iconStyle.color} /></Pressable>
    </View>
    <View style={[styles.flex, !!query && styles.hidden]}>
      <View style={styles.toolbar}>{rayons.map(value =>
        <Button key={value} label={value || 'Tous'} selected={rayon === value}
          image={value && API.bdovoreBaseURL + '/style/guide/guide-rayon-' + value.toLowerCase() + '.png'}
          onPress={() => { setRayon(value); setGenre(null); }} />)}</View>
      <Button label={(genre?.label || 'Tous les genres') + '  ▾'} onPress={() => setPicker(true)} />
      <View style={styles.toolbar}>{Object.entries(names).map(([key, name]) =>
        <Button key={key} label={name} selected={scope === key} onPress={() => setScope(key)} />)}</View>
      <CatalogueList key={JSON.stringify(browse)} params={browse} open={open} onGenres={setGenres} />
    </View>
    {!!query && <CatalogueList key={query} params={search} open={open} />}
    <Modal visible={picker} transparent animationType="slide" onRequestClose={() => setPicker(false)}>
      <View style={styles.overlay}>
        <Pressable style={styles.flex} accessibilityRole="button" accessibilityLabel="Fermer" onPress={() => setPicker(false)} />
        <View style={[styles.sheet, { backgroundColor: CommonStyles.screenStyle.backgroundColor }]}>
          <Button label="Tous les genres" onPress={() => { setGenre(null); setPicker(false); }} />
          <FlatList data={genres.filter(item => !rayon || item.rayon === rayon)} keyExtractor={item => String(item.id)}
            renderItem={({ item }) => <Button label={item.label} selected={genre?.id === item.id}
              onPress={() => { setGenre(item); setPicker(false); }} />} />
        </View>
      </View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, hidden: { display: 'none' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 6 },
  input: { flex: 1, minHeight: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ad9f97', borderRadius: 8 },
  button: { minHeight: 44, paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  rayon: { width: 28, height: 28 }, selected: { backgroundColor: bdovored }, white: { color: 'white' },
  heading: { padding: 10, fontWeight: '700' }, title: { fontWeight: '600' },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#b7aaa1' },
  cover: { width: 36, height: 48 }, largeCover: { width: 88, height: 118 },
  preview: { padding: 8, backgroundColor: '#faf5ef' }, darkPreview: { backgroundColor: '#312b26' },
  tile: { width: 96, marginRight: 8 }, overlay: { flex: 1, backgroundColor: '#0007', justifyContent: 'flex-end' },
  sheet: { maxHeight: '70%', paddingBottom: 20, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
});
