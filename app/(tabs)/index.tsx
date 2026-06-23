import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  Text, TextInput, TouchableOpacity,
  View
} from "react-native";
import { type Chanson } from "../../data/chansons";
import { GL_IMAGES, GROUPES_LOCAUX, REGIONS, type GroupeLocal } from "../../data/groupesLocaux";

import {
  ecouterChansons,
  initialiserChansons,
  mettreAJourChanson,
  soumettreChangon,
  supprimerChanson,
} from "../../config/songService";

import fvr from "../../assets/images/foulard-vr.png";
import logo from "../../assets/images/logo-EEIF.png";

const PHOTO: Record<string, any> = {
  // ASA: require('../../assets/images/gl/ASA.png'),  ← exemple pour image1.png
  LOGO:  logo,
  FVR: fvr
};

// ─── RÉGLAGES CONTEXTE ───────────────────────────────────────────────────────

type Settings = { fontSize: number; showAccordsFirst: boolean; compactView: boolean };
const DEFAULT_SETTINGS: Settings = { fontSize: 14, showAccordsFirst: true, compactView: false };
const SettingsCtx = createContext<Settings>(DEFAULT_SETTINGS);
const useSettings = () => useContext(SettingsCtx);

// ─── NAVIGATION TABS ─────────────────────────────────────────────────────────

const TABS = [
  { id: "home",      label: "Accueil",              emoji: "🏠",  photo: null },
  { id: "toutes",    label: "Toutes les chansons",  emoji: "🎶",  photo: null },
  { id: "eeif",      label: "Chansons EEIF",        emoji: null,  photo: "LOGO" },
  { id: "gl",        label: "Chansons par GL",       emoji: null,  photo: "FVR" },
  { id: "diverses",  label: "Chansons diverses",     emoji: "🎵",  photo: null },
  { id: "favorites", label: "Mes favoris",           emoji: "❤️",  photo: null },
  { id: "playlists", label: "Playlists",             emoji: "📋",  photo: null },
  { id: "soumettre", label: "Soumettre une chanson", emoji: "➕",  photo: null },
];

const HERO_TABS = TABS.filter((t) => t.id !== "home");

const versTypeLabel: Record<string, string> = {
  couplet: "Couplet", pont: "Pont",
  "pré-refrain": "Pré-refrain", refrain: "Refrain", "post-refrain": "Post-refrain",
  outro: "Outro", intro: "Intro",
};
const VERS_TYPES = ["couplet", "pont", "pré-refrain", "refrain" , "post-refrain", "intro", "outro"];

// ─── COULEURS ────────────────────────────────────────────────────────────────

const C = {
  green:  { bg: "#e8f5e9", text: "#2e7d32", border: "#a5d6a7" },
  amber:  { bg: "#fff8e1", text: "#f57f17", border: "#ffe082" },
  blue:   { bg: "#e3f2fd", text: "#1565c0", border: "#90caf9" },
  red:    { bg: "#ffebee", text: "#c62828", border: "#ef9a9a" },
  gray:   { bg: "#f5f5f5", text: "#555",    border: "#e0e0e0" },
  primary:"#000e8e",
  lightBg:"#f5f5f3",
  white:  "#ffffff",
  textPrimary: "#1a1a1a",
  textSecondary: "#666666",
  border: "#e0e0e0",
};

// ─── COMPOSANTS DE BASE ──────────────────────────────────────────────────────

function Badge({ color, children }: { color: keyof typeof C; children: React.ReactNode }) {
  const col = C[color] as { bg: string; text: string; border: string };
  return (
    <View style={{ backgroundColor: col.bg, borderRadius: 6, borderWidth: 0.5, borderColor: col.border, paddingHorizontal: 7, paddingVertical: 2 }}>
      <Text style={{ fontSize: 11, fontWeight: "500", color: col.text }}>{String(children)}</Text>
    </View>
  );
}

function Btn({ label, onPress, variant = "primary", small = false, disabled = false }:
  { label: string; onPress: () => void; variant?: "primary"|"secondary"|"danger"; small?: boolean; disabled?: boolean }) {
  const styles = {
    primary:   { bg: C.primary,      text: "#e8f5e9", border: C.primary },
    secondary: { bg: "#f0f0f0",      text: C.textPrimary, border: C.border },
    danger:    { bg: C.red.bg,       text: C.red.text, border: C.red.border },
  }[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{ backgroundColor: styles.bg, borderRadius: 10, borderWidth: 0.5, borderColor: styles.border,
               paddingHorizontal: small ? 12 : 18, paddingVertical: small ? 7 : 10,
               opacity: disabled ? 0.4 : 1 }}>
      <Text style={{ color: styles.text, fontSize: small ? 13 : 14, fontWeight: "500" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function BackBtn({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 5, paddingHorizontal: 10,
               borderRadius: 8, borderWidth: 0.5, borderColor: C.border, alignSelf: "flex-start", marginBottom: 12 }}>
      <Text style={{ fontSize: 13, color: C.textSecondary }}>← Retour</Text>
    </TouchableOpacity>
  );
}

function SearchBar({ value, onChangeText, placeholder = "Rechercher…" }:
  { value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  return (
    <TextInput
      value={value} onChangeText={onChangeText} placeholder={"🔍  " + placeholder}
      style={{ backgroundColor: C.white, borderRadius: 10, borderWidth: 0.5, borderColor: C.border,
               paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, marginBottom: 12, color: C.textPrimary }}
    />
  );
}

function Card({ children, onPress, noPad = false }:
  { children: React.ReactNode; onPress?: () => void; noPad?: boolean }) {
  const inner = (
    <View style={{ backgroundColor: C.white, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
                   padding: noPad ? 0 : 14, marginBottom: 10, overflow: "hidden" }}>
      {children}
    </View>
  );
  return onPress ? <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{inner}</TouchableOpacity> : inner;
}

function SongCard({ song, onPress, onToggleFavorite, isFavorite, playlists, onAddToPlaylist }:
  { song: Chanson; onPress: () => void;
    onToggleFavorite?: (id: string) => void; isFavorite?: boolean;
    playlists?: { name: string; songIds: string[] }[];
    onAddToPlaylist?: (songId: string, plIdx: number) => void }) {
  const [showPL, setShowPL] = useState(false);
  const catColor = song.categorie === "eeif" ? "green" : "blue";
  return (
    <View style={{ marginBottom: 10 }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}
        style={{ backgroundColor: C.white, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, padding: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "500", color: C.textPrimary, marginBottom: 5 }}>{song.titre}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
              <Badge color={catColor}>{song.categorie === "eeif" ? "⚜️ EEIF" : "🎵 Diverse"}</Badge>
              {song.isGL && Array.isArray(song.glNoms) && song.glNoms.map((nom, i) => (
                <Badge key={i} color="amber">{"📍 " + nom}</Badge>
              ))}
              {song.isCamp && <Badge color="blue">⛺ Camp {song.annéeCamp}</Badge>}
              {song.auteur && <Text style={{ fontSize: 11, color: C.textSecondary, alignSelf: "center" }}>✍️ {song.auteur}</Text>}
              {song.statut === "en_attente" && <Badge color="amber">⏳ En attente</Badge>}
            </View>
          </View>
          {/* Boutons rapides */}
          {onToggleFavorite && (
            <View style={{ flexDirection: "column", gap: 6, marginLeft: 8 }}>
              <TouchableOpacity onPress={() => onToggleFavorite(song.id)}
                style={{ padding: 6, borderRadius: 8, backgroundColor: isFavorite ? C.red.bg : "#f5f5f5",
                         borderWidth: 0.5, borderColor: isFavorite ? C.red.border : C.border }}>
                <Text style={{ fontSize: 16 }}>{isFavorite ? "❤️" : "🤍"}</Text>
              </TouchableOpacity>
              {playlists && playlists.length > 0 && (
                <TouchableOpacity onPress={() => setShowPL(!showPL)}
                  style={{ padding: 6, borderRadius: 8, backgroundColor: "#f5f5f5",
                           borderWidth: 0.5, borderColor: C.border }}>
                  <Text style={{ fontSize: 16 }}>📋</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
      {showPL && playlists && (
        <View style={{ backgroundColor: C.white, borderRadius: 10, borderWidth: 0.5, borderColor: C.border,
                       marginTop: 4, padding: 8 }}>
          {playlists.map((pl, i) => (
            <TouchableOpacity key={i} onPress={() => { onAddToPlaylist && onAddToPlaylist(song.id, i); setShowPL(false); }}
              style={{ paddingVertical: 8, borderBottomWidth: i < playlists.length - 1 ? 0.5 : 0, borderBottomColor: C.border }}>
              <Text style={{ fontSize: 13, color: C.textPrimary }}>📋 {pl.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function EmptyState({ emoji, title, sub, btnLabel, onBtn }:
  { emoji: string; title: string; sub: string; btnLabel?: string; onBtn?: () => void }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 40, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 36, marginBottom: 8 }}>{emoji}</Text>
      <Text style={{ fontWeight: "500", fontSize: 15, color: C.textPrimary, marginBottom: 4, textAlign: "center" }}>{title}</Text>
      <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16, textAlign: "center" }}>{sub}</Text>
      {btnLabel && onBtn && <Btn label={btnLabel} onPress={onBtn} />}
    </View>
  );
}

// ─── FILTRES/TRI PARTAGÉS ────────────────────────────────────────────────────

type SortKey = "alpha" | "date" | "camp";
type FilterState = { search: string; sort: SortKey; onlyCamp: boolean; onlyGL: boolean; campType: string; onlyDiverse: boolean; onlyEEIF: boolean; noCamp: boolean };

function applyFilters(songs: Chanson[], f: FilterState): Chanson[] {
  let list = songs.filter((s) => s.statut === "approuvé");
  if (f.search) {
    const q = f.search.toLowerCase();
    list = list.filter((s) =>
      s.titre.toLowerCase().includes(q) ||
      (s.auteur && s.auteur.toLowerCase().includes(q)) ||
      (s.glNom && s.glNom.toLowerCase().includes(q)) ||
      (s.nomCamp && s.nomCamp.toLowerCase().includes(q))
    );
  }
  if (f.onlyCamp) list = list.filter((s) => s.isCamp);
  if (f.onlyDiverse) list = list.filter((s) => s.categorie === "diverse");
  if (f.onlyEEIF) list = list.filter((s) => s.categorie === "eeif");
  if (f.noCamp) list = list.filter((s) => !s.isCamp);
  if (f.campType) list = list.filter((s) => s.typeCamp === f.campType);
  if (f.onlyGL)   list = list.filter((s) => s.isGL);
  if (f.sort === "alpha") list = [...list].sort((a, b) => a.titre.localeCompare(b.titre, "fr"));
  if (f.sort === "date")  list = [...list].sort((a, b) => b.dateAjout.localeCompare(a.dateAjout));
  if (f.sort === "camp")  list = [...list].sort((a, b) => (b.annéeCamp || "0").localeCompare(a.annéeCamp || "0"));
  return list;
}

function FilterBar({ f, setF, showCampSort = false, config = "default" }:
  { f: FilterState; setF: (x: FilterState) => void; showCampSort?: boolean;
    config?: "default" | "toutes" | "eeif" | "favorites" | "diverses" }) {

  const sorts: { k: SortKey; label: string }[] = [
    { k: "alpha", label: "A → Z" },
    { k: "date",  label: "Plus récent" },
    ...(showCampSort ? [{ k: "camp" as SortKey, label: "Année camp" }] : []),
    ...(config === "diverses" ? [{ k: "auteur" as SortKey, label: "Auteur" }] : []),
  ];

  const anyActive = f.onlyCamp || f.onlyGL || f.onlyDiverse || f.noCamp || !!f.campType;

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 10, fontWeight: "600", textTransform: "uppercase",
                     letterSpacing: 0.8, color: "#888", marginBottom: 5 }}>Trier par</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6, marginBottom: 10 }}>
        {sorts.map((s) => (
          <TouchableOpacity key={s.k} onPress={() => setF({ ...f, sort: s.k })}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 0.5,
                     borderColor: f.sort === s.k ? C.primary : "#e0e0e0",
                     backgroundColor: f.sort === s.k ? C.primary : "#fff" }}>
            <Text style={{ fontSize: 12, color: f.sort === s.k ? "#e8f5e9" : "#666",
                           fontWeight: f.sort === s.k ? "600" : "400" }}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {config !== "diverses" && (
        <>
          <Text style={{ fontSize: 10, fontWeight: "600", textTransform: "uppercase",
                         letterSpacing: 0.8, color: "#888", marginBottom: 5 }}>Filtrer</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>

            {/* EEIF/Diverse — page toutes et favorites */}
            {(config === "toutes" || config === "favorites") && (
              <>
                <TouchableOpacity onPress={() => setF({ ...f, onlyEEIF: !f.onlyEEIF, onlyDiverse: false, onlyCamp: false, onlyGL: false, campType: "" })}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 0.5,
                           borderColor: f.onlyEEIF ? C.primary : "#e0e0e0",
                           backgroundColor: f.onlyEEIF ? "#e8f5e9" : "#fff" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <Image source={PHOTO.LOGO} style={{ width: 14, height: 14, borderRadius: 3 }} />
                    <Text style={{ fontSize: 12, color: f.onlyEEIF ? C.primary : "#666",
                                   fontWeight: f.onlyEEIF ? "600" : "400" }}>EEIF</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setF({ ...f, onlyDiverse: true, onlyCamp: false, onlyGL: false, campType: "" })}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 0.5,
                           borderColor: f.onlyDiverse ? "#1565c0" : "#e0e0e0",
                           backgroundColor: f.onlyDiverse ? "#e3f2fd" : "#fff" }}>
                  <Text style={{ fontSize: 12, color: f.onlyDiverse ? "#1565c0" : "#666",
                                 fontWeight: f.onlyDiverse ? "600" : "400" }}>🎵 Diverses</Text>
                </TouchableOpacity>
              </>
            )}

            {/* GL — toutes, eeif, favorites */}
            {!f.onlyDiverse && (config === "toutes" || config === "eeif" || config === "favorites") && (
              <TouchableOpacity onPress={() => setF({ ...f, onlyGL: !f.onlyGL, onlyCamp: false, campType: "" })}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 0.5,
                         borderColor: f.onlyGL ? "#f57f17" : "#e0e0e0",
                         backgroundColor: f.onlyGL ? "#fff8e1" : "#fff" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Image source={PHOTO.FVR} style={{ width: 14, height: 14, borderRadius: 3 }} />
                  <Text style={{ fontSize: 12, color: f.onlyGL ? "#f57f17" : "#666",
                                 fontWeight: f.onlyGL ? "600" : "400" }}>GL uniquement</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Camp — visible seulement si GL activé */}
            {f.onlyGL && (
              <TouchableOpacity onPress={() => setF({ ...f, onlyCamp: !f.onlyCamp, campType: "" })}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 0.5,
                         borderColor: f.onlyCamp ? "#1565c0" : "#e0e0e0",
                         backgroundColor: f.onlyCamp ? "#e3f2fd" : "#fff" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Image source={PHOTO.LOGO} style={{ width: 14, height: 14, borderRadius: 3 }} />
                  <Text style={{ fontSize: 12, color: f.onlyCamp ? "#1565c0" : "#666",
                                 fontWeight: f.onlyCamp ? "600" : "400" }}>Chansons de camp</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* BC BM BP */}
            {f.onlyCamp && ["BC", "BM", "BP"].map((type) => (
              <TouchableOpacity key={type} onPress={() => setF({ ...f, campType: f.campType === type ? "" : type })}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 0.5,
                         borderColor: f.campType === type ? "#1565c0" : "#e0e0e0",
                         backgroundColor: f.campType === type ? "#e3f2fd" : "#fff" }}>
                <Text style={{ fontSize: 12, color: f.campType === type ? "#1565c0" : "#666",
                               fontWeight: f.campType === type ? "600" : "400" }}>⛺ {type}</Text>
              </TouchableOpacity>
            ))}

            {/* Pas de camp — toutes, eeif, favorites */}
            {!f.onlyDiverse && (config === "toutes" || config === "eeif" || config === "favorites") && (
              <TouchableOpacity onPress={() => setF({ ...f, noCamp: !f.noCamp })}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 0.5,
                         borderColor: f.noCamp ? "#888" : "#e0e0e0",
                         backgroundColor: f.noCamp ? "#f5f5f5" : "#fff" }}>
                <Text style={{ fontSize: 12, color: f.noCamp ? "#444" : "#666",
                               fontWeight: f.noCamp ? "600" : "400" }}>🚫 Pas de camp</Text>
              </TouchableOpacity>
            )}

            {/* Effacer */}
            {anyActive && (
              <TouchableOpacity onPress={() => setF({ ...f, onlyCamp: false, campType: "", onlyGL: false, onlyDiverse: false, noCamp: false })}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 0.5,
                         borderColor: "#ef9a9a", backgroundColor: "#ffebee" }}>
                <Text style={{ fontSize: 12, color: "#c62828", fontWeight: "600" }}>✕ Effacer</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

// ─── PAGES ───────────────────────────────────────────────────────────────────

function HomePage({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ alignItems: "center", paddingVertical: 24 }}>
        <Text style={{ fontSize: 48, marginBottom: 8 }}>🏕️</Text>
        <Text style={{ fontSize: 22, fontWeight: "600", color: C.textPrimary, marginBottom: 4 }}>Chant-EEIF</Text>
        <Text style={{ fontSize: 13, color: C.textSecondary, textAlign: "center" }}>
          Le carnet de chants du mouvement — toujours avec toi, même sur les camps
        </Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        {HERO_TABS.filter(tab => tab.id !== "soumettre").map((tab) => (
          <TouchableOpacity key={tab.id} onPress={() => onNavigate(tab.id)} activeOpacity={0.7}
            style={{ backgroundColor: C.white, borderRadius: 14, borderWidth: 0.5, borderColor: C.border,
                     padding: 16, alignItems: "center",
                     width: "47%", minWidth: 140, flexGrow: 1 }}>
            {tab.photo ? (
            <Image source={PHOTO[tab.photo]}
              style={{ width: 40, height: 40, marginBottom: 6, borderRadius: 6 }} />
          ) : (
            <Text style={{ fontSize: 32, marginBottom: 6 }}>{tab.emoji}</Text>
          )}
            {/*{tab.id === "eeif" ? (
              <Image source={PHOTO.LOGO}
                style={{ width: 40, height: 40, marginBottom: 6, borderRadius: 6 }} />
            ) : (
              <Text style={{ fontSize: 32, marginBottom: 6 }}>{tab.emoji}</Text>
            )}*/}
            <Text style={{ fontSize: 13, fontWeight: "500", color: C.textPrimary, textAlign: "center" }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={() => onNavigate("soumettre")} activeOpacity={0.85}
        style={{ backgroundColor: C.primary, borderRadius: 14, padding: 16 }}>
        <Text style={{ color: "#e8f5e9", fontWeight: "600", fontSize: 14, marginBottom: 3 }}>Tu connais une chanson qui manque ? ✨</Text>
        <Text style={{ color: "#a5d6a7", fontSize: 12, marginBottom: 10 }}>Contribue au carnet partagé — toutes les chansons seront examinées par un admins.</Text>
        <View style={{ backgroundColor: "#e8f5e9", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignSelf: "flex-start" }}>
          <Text style={{ color: C.primary, fontWeight: "500", fontSize: 13 }}>➕ Soumettre une chanson</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}
function SongListPage({ title, subtitle, songs, onSelectSong, onSubmit, showCampSort = false, onBack,
  onToggleFavorite, favorites, playlists, onAddToPlaylist, filterConfig = "default" }:
  { title: string; subtitle?: string; songs: Chanson[]; onSelectSong: (s: Chanson) => void;
    onSubmit: () => void; showCampSort?: boolean; onBack?: () => void;
    onToggleFavorite?: (id: string) => void; favorites?: string[];
    playlists?: { name: string; songIds: string[] }[];
    onAddToPlaylist?: (songId: string, plIdx: number) => void;
    filterConfig?: "default" | "toutes" | "eeif" | "favorites" | "diverses" }) {
  const [f, setF] = useState<FilterState>({ search: "", sort: showCampSort ? "camp" : "alpha", onlyCamp: false, campType: "", onlyGL: false, onlyDiverse: false, onlyEEIF: false, noCamp: false });
  const filtered = applyFilters(songs, f);
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {onBack && <BackBtn onPress={onBack} />}
      <Text style={{ fontSize: 22, fontWeight: "600", color: C.textPrimary, marginBottom: 2 }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 10 }}>{subtitle}</Text>}
      <SearchBar value={f.search} onChangeText={(t) => setF({ ...f, search: t })} />
      {/*<FilterBar f={f} setF={setF} showCampSort={showCampSort} />*/}
      <FilterBar f={f} setF={setF} showCampSort={showCampSort} config={filterConfig} />
      {filtered.length === 0 ? (
        <EmptyState emoji="🎶" title="Aucune chanson ici" sub="Tu peux en ajouter une !"
          btnLabel="➕ Soumettre" onBtn={onSubmit} />
      ) : (
        filtered.map((s) => <SongCard key={s.id} song={s} onPress={() => onSelectSong(s)}
          onToggleFavorite={onToggleFavorite} isFavorite={favorites?.includes(s.id)}
          playlists={playlists} onAddToPlaylist={onAddToPlaylist} />)
      )}
    </ScrollView>
  );
}

function GLPage({ songs, onSelectSong, onSubmit, onNavigateHome }:
  { songs: Chanson[]; onSelectSong: (s: Chanson) => void; onSubmit: () => void; onNavigateHome: () => void }) {
  const [selectedGL, setSelectedGL] = useState<GroupeLocal | null>(null);
  const [glSearch, setGlSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [f, setF] = useState<FilterState>({ search: "", sort: "alpha", onlyCamp: false, campType: "", onlyGL: false, onlyDiverse: false, onlyEEIF: false, noCamp: false });

  if (selectedGL) {
    const glSongs = applyFilters(
      songs.filter((s) => s.isGL && (
        (s.glIds && s.glIds.includes(selectedGL.id)) ||
        s.glId === selectedGL.id)),
        f
      );
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <BackBtn onPress={() => setSelectedGL(null)} />
        <Text style={{ fontSize: 20, fontWeight: "600", color: C.textPrimary, marginBottom: 2 }}>
          {selectedGL.nom}
        </Text>
        <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 10 }}>
          {selectedGL.figure} · {selectedGL.ville}
        </Text>
        <SearchBar value={f.search} onChangeText={(t) => setF({ ...f, search: t })} />
        <FilterBar f={f} setF={setF} showCampSort />
        {glSongs.length === 0 ? (
          <EmptyState emoji="🎵" title="Aucune chanson pour ce GL"
            sub="Tu peux en ajouter une en cliquant ici"
            btnLabel="➕ Soumettre une chanson" onBtn={onSubmit} />
        ) : (
          glSongs.map((s) => <SongCard key={s.id} song={s} onPress={() => onSelectSong(s)} />)
        )}
      </ScrollView>
    );
  }

  // GL list
  const glFiltered = GROUPES_LOCAUX.filter((gl) => {
    const matchSearch = !glSearch ||
      gl.nom.toLowerCase().includes(glSearch.toLowerCase()) ||
      gl.figure.toLowerCase().includes(glSearch.toLowerCase()) ||
      gl.ville.toLowerCase().includes(glSearch.toLowerCase());
    const matchRegion = regionFilter === "all" || gl.region === regionFilter;
    return matchSearch && matchRegion;
  });

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <BackBtn onPress={onNavigateHome} />
      <Text style={{ fontSize: 22, fontWeight: "600", color: C.textPrimary, marginBottom: 2 }}>📍{/*📍<Image source={PHOTO.FVR} 
                      style={{ width: 40, height: 40, borderRadius: 8 }}/>*/} Chansons par GL</Text>
      <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 10 }}>Sélectionne un Groupe Local</Text>
      <SearchBar value={glSearch} onChangeText={setGlSearch} placeholder="Rechercher un GL…" />
      {/* Region filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
        {[{ k: "all", label: "Tous" }, ...Object.entries(REGIONS).map(([k, v]) => ({ k, label: v }))].map(({ k, label }) => (
          <TouchableOpacity key={k} onPress={() => setRegionFilter(k)}
            style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 0.5,
                     borderColor: regionFilter === k ? C.primary : C.border,
                     backgroundColor: regionFilter === k ? "#e8f5e9" : C.white }}>
            <Text style={{ fontSize: 12, color: regionFilter === k ? C.primary : C.textSecondary, fontWeight: regionFilter === k ? "500" : "400" }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* GL as list */}
      {glFiltered.map((gl) => {
        const count = songs.filter((s) => s.statut === "approuvé" && s.isGL && (
                      (Array.isArray(s.glIds) && s.glIds.includes(gl.id)) || s.glId === gl.id)).length;
        const img = GL_IMAGES[gl.id];
        return (
          <TouchableOpacity key={gl.id} onPress={() => setSelectedGL(gl)} activeOpacity={0.7}
            style={{ backgroundColor: C.white, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
                     marginBottom: 8, flexDirection: "row", alignItems: "center", padding: 12, gap: 12 }}>
            {img ? (
              <Image source={img} style={{ width: 40, height: 40, borderRadius: 8 }} />
            ) : (
              <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: "#e8f5e9",
                             alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 20 }}>{gl.emoji}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: C.textPrimary }}>{gl.nom}</Text>
              <Text style={{ fontSize: 12, color: C.textSecondary }}>{gl.figure} · {gl.ville}</Text>
            </View>
            <Badge color={count > 0 ? "green" : "gray"}>{count > 0 ? `${count} chanson${count > 1 ? "s" : ""}` : "0"}</Badge>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function SongDetailPage({ song, onBack, favorites, onToggleFavorite, playlists, onAddToPlaylist, isAdmin, onApprove, onRejectWithEmail, onEdit }:
  { song: Chanson; onBack: () => void; favorites: string[]; onToggleFavorite: (id: string) => void;
    playlists: { name: string; songIds: string[] }[]; onAddToPlaylist: (songId: string, plIdx: number) => void;
    isAdmin: boolean; onApprove: (id: string) => void;
    onRejectWithEmail: (song: Chanson) => void; onEdit: (song: Chanson) => void }) {
  const { fontSize, showAccordsFirst } = useSettings();
  const isFav = favorites.includes(song.id);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [showRemarque, setShowRemarque] = useState(false);
  const [accordsEpingles, setAccordsEpingles] = useState(true);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (autoScroll) {
      autoScrollRef.current = setInterval(() => {
        scrollY.current += scrollSpeed;
        scrollRef.current?.scrollTo({ y: scrollY.current, animated: false });
      }, 16);
    } else {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
        autoScrollRef.current = null;
      }
    }
    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
        autoScrollRef.current = null;
      }
    };
  }, [autoScroll, scrollSpeed]);
  const lyricsSection = song.texte && song.texte.length > 0 && (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 11, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.7, color: C.textSecondary, marginBottom: 8 }}>Paroles</Text>
      {song.texte.map((v, i) => (
        <View key={i} style={{ marginBottom: 10 }}>
          {/* Accords de la partie si présents */}
          {v.accords && v.accords.trim() !== "" && (
            <View style={{ backgroundColor: "#fff9f0", borderRadius: 6, borderWidth: 0.5, borderColor: "#f0c060",
                           paddingHorizontal: 10, paddingVertical: 5, marginBottom: 4 }}>
              <Text style={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: fontSize - 1, color: "#7a4f00" }}>{v.accords}</Text>
            </View>
          )}
          <Text style={{ fontSize: 10, fontWeight: "700", color: C.primary, textTransform: "uppercase",
               letterSpacing: 0.5, marginBottom: 3 }}>
            {(() => {
              const parts = [];
              parts.push(versTypeLabel[v.type] || v.type || "");
              if (v.type === "couplet" && v.numero) {
                parts.push(String(v.numero));
              }
              if (v.multiplicateur) {
                parts.push(String(v.multiplicateur));
              }
              return parts.filter(p => p.trim() !== "").join(" ");
            })()}
          </Text>
          {v.paroles && v.paroles.trim() !== "" && (
            <View style={{ borderLeftWidth: 3, borderLeftColor: C.primary, paddingLeft: 10,
                           backgroundColor: "#f8fdf9", borderRadius: 4, padding: 8 }}>
              <Text style={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                             fontSize: fontSize, lineHeight: fontSize * 1.7, color: C.textPrimary }}>
                {v.paroles}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const globalAccordsSection = song.accords && (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 11, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.7, color: C.textSecondary, marginBottom: 6 }}>🎸 Accords</Text>
      <View style={{ backgroundColor: "#fff9f0", borderRadius: 8, borderWidth: 0.5, borderColor: "#f0c060", padding: 12 }}>
        <Text style={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: fontSize, color: "#7a4f00" }}>{song.accords}</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
    {/* Accords épinglés en bas */}
    {song.accords && accordsEpingles && (
      <View style={{ backgroundColor: '#fff9f0', borderBottomWidth: 1, borderTopColor: '#f0c060',
                     padding: 12, elevation: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: '500', textTransform: 'uppercase',
                         letterSpacing: 0.7, color: '#888' }}>🎸 Accords</Text>
          <TouchableOpacity onPress={() => setAccordsEpingles(false)}>
            <Text style={{ fontSize: 12, color: '#7a4f00' }}>✕ Masquer</Text>
          </TouchableOpacity>
          {/* Contrôles défilement auto */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
          <TouchableOpacity onPress={() => setScrollSpeed(s => Math.max(0, s - 0.5))}
            style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#f0c060",
                     alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#7a4f00", fontWeight: "700", fontSize: 16 }}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAutoScroll(v => !v)}
            style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: autoScroll ? C.primary : "#f0c060",
                     alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: autoScroll ? "#e8f5e9" : "#7a4f00", fontSize: 14 }}>
              {autoScroll ? "⏸" : "▶"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setScrollSpeed(s => Math.min(5, s + 0.5))}
            style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#f0c060",
                     alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#7a4f00", fontWeight: "700", fontSize: 16 }}>+</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: "#7a4f00" }}>Vitesse : {scrollSpeed}</Text>
        </View>
        </View>
        <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                       fontSize: fontSize, color: '#7a4f00' }}>
          {song.accords}
        </Text>
      </View>
    )}

    <ScrollView
      ref={scrollRef}
      contentContainerStyle={{ padding: 16 }}
      onScroll={(e) => { scrollY.current = e.nativeEvent.contentOffset.y; }}
      scrollEventThrottle={16}>{/*</ScrollView>*/}
      {/* Top row */}
      {/*<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <BackBtn onPress={onBack} />
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <TouchableOpacity onPress={() => onToggleFavorite(song.id)}
            style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7,
                     borderRadius: 8, borderWidth: 0.5, borderColor: isFav ? C.red.border : C.border,
                     backgroundColor: isFav ? C.red.bg : "#f5f5f5" }}>
            <Text style={{ fontSize: 13, color: isFav ? C.red.text : C.textSecondary }}>{isFav ? "❤️ Favori" : "🤍 Favoris"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowPlaylistPicker(!showPlaylistPicker)}
            style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 0.5,
                     borderColor: C.border, backgroundColor: "#f5f5f5" }}>
            <Text style={{ fontSize: 13, color: C.textSecondary }}>📋 Playlist</Text>
          </TouchableOpacity>
          {song.lien && (
            <TouchableOpacity onPress={() => { if (song.lien) { require('react-native').Linking.openURL(song.lien); } }}
              style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 0.5,
                       borderColor: C.green.border, backgroundColor: C.green.bg }}>
              <Text style={{ fontSize: 13, color: C.primary }}>🎧 Écouter</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowRemarque(true)}
            style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 0.5,
                     borderColor: C.border, backgroundColor: "#f5f5f5" }}>
            <Text style={{ fontSize: 13, color: C.textSecondary }}>💬 Proposer une modif</Text>
          </TouchableOpacity>
          {song.accords && (
            <TouchableOpacity onPress={() => setAccordsEpingles(!accordsEpingles)}
              style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 0.5,
                       borderColor: accordsEpingles ? '#f0c060' : C.border,
                       backgroundColor: accordsEpingles ? '#fff9f0' : '#f5f5f5' }}>
              <Text style={{ fontSize: 13, color: accordsEpingles ? '#7a4f00' : C.textSecondary }}>
                🎸 {accordsEpingles ? 'Accords épinglés' : 'Épingler accords'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>*/}
      {/* Top row — scroll horizontal sur mobile */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 }}>
        <BackBtn onPress={onBack} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => onToggleFavorite(song.id)}
            style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7,
                     borderRadius: 8, borderWidth: 0.5, borderColor: isFav ? C.red.border : C.border,
                     backgroundColor: isFav ? C.red.bg : "#f5f5f5" }}>
            <Text style={{ fontSize: 13, color: isFav ? C.red.text : C.textSecondary }}>{isFav ? "❤️ Favori" : "🤍 Favoris"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowPlaylistPicker(!showPlaylistPicker)}
            style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 0.5,
                     borderColor: C.border, backgroundColor: "#f5f5f5" }}>
            <Text style={{ fontSize: 13, color: C.textSecondary }}>📋 Playlist</Text>
          </TouchableOpacity>
          {song.lien && (
            <TouchableOpacity onPress={() => { if (song.lien) { require('react-native').Linking.openURL(song.lien); } }}
              style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 0.5,
                       borderColor: C.green.border, backgroundColor: C.green.bg }}>
              <Text style={{ fontSize: 13, color: C.primary }}>🎧 Écouter</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowRemarque(true)}
            style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 0.5,
                     borderColor: C.border, backgroundColor: "#f5f5f5" }}>
            <Text style={{ fontSize: 13, color: C.textSecondary }}>💬 Modif</Text>
          </TouchableOpacity>
          {song.accords && (
            <TouchableOpacity onPress={() => setAccordsEpingles(!accordsEpingles)}
              style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 0.5,
                       borderColor: accordsEpingles ? '#f0c060' : C.border,
                       backgroundColor: accordsEpingles ? '#fff9f0' : '#f5f5f5' }}>
              <Text style={{ fontSize: 13, color: accordsEpingles ? '#7a4f00' : C.textSecondary }}>
                {accordsEpingles ? '🎸 Épinglé' : '🎸 Épingler'}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Playlist picker */}
      {showPlaylistPicker && (
        <Card>
          <Text style={{ fontSize: 13, fontWeight: "500", marginBottom: 8, color: C.textPrimary }}>Ajouter à une playlist :</Text>
          {playlists.length === 0 ? (
            <Text style={{ fontSize: 12, color: C.textSecondary }}>Aucune playlist — crée-en une d'abord !</Text>
          ) : (
            playlists.map((pl, i) => (
              <TouchableOpacity key={i} onPress={() => { onAddToPlaylist(song.id, i); setShowPlaylistPicker(false); }}
                style={{ paddingVertical: 8, borderBottomWidth: i < playlists.length - 1 ? 0.5 : 0, borderBottomColor: C.border }}>
                <Text style={{ fontSize: 13, color: C.textPrimary }}>📋 {pl.name}</Text>
              </TouchableOpacity>
            ))
          )}
        </Card>
      )}

      {/* Modification & remarques */}
      {showRemarque && (
        <Card>
          <RemarqueModal song={song} onClose={() => setShowRemarque(false)}
            onSubmit={async (r) => {
              try {
                const { soumettreRemarque } = await import('../../config/songService');
                await soumettreRemarque(r);
              } catch(e) { console.error(e); }
            }} />
        </Card>
      )}

      {/* Admin bar */}
      {isAdmin && song.statut === "en_attente" && (
        <View style={{ backgroundColor: "#fffde7", borderRadius: 10, borderWidth: 0.5, borderColor: "#f9a825",
                       padding: 12, marginBottom: 12, gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: "#7a4f00" }}>⚠️ En attente de validation</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Btn label="✓ Approuver" onPress={() => onApprove(song.id)} small />
            <Btn label="✕ Refuser" onPress={() => onRejectWithEmail(song)} variant="danger" small />
            <Btn label="✏️ Modifier" onPress={() => onEdit(song)} variant="secondary" small />
          </View>
        </View>
      )}
      {isAdmin && song.statut === "approuvé" && (
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <Btn label="✏️ Modifier" onPress={() => onEdit(song)} variant="secondary" small />
          <Btn label="🗑 Supprimer" onPress={() => onRejectWithEmail(song)} variant="danger" small />
        </View>
      )}

      {/* Song content */}
      <Text style={{ fontSize: 20, fontWeight: "600", color: C.textPrimary, marginBottom: 4 }}>{song.titre}</Text>

      {/* Auteur sous le titre */}
      {song.auteur && (
        <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 8, fontStyle: "italic" }}>
          ✍️ {song.auteur}{song.airDe ? `  —  Sur l'air de : ${song.airDe}` : ""}
        </Text>
      )}

      {/* Badges catégorie */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {song.categorie === "eeif" ? <Badge color="green">⚜️ EEIF</Badge> : null}
        {song.categorie === "diverse" ? <Badge color="blue">🎵 Diverse</Badge> : null}
            
        {song.isGL &&
          Array.isArray(song.glNoms) &&
          song.glNoms.map((nom, i) => (
            <Badge key={i} color="amber">
              {"📍 " + nom}
            </Badge>
          ))
        }
        
        {song.isCamp && song.annéeCamp ? (
          <Badge color="blue">⛺ Camp {song.annéeCamp}{song.nomCamp ? ` — ${song.nomCamp}` : ""}</Badge>
        ) : null}
      </View>

      {/* Note EN PREMIER, avant les accords */}
      {song.note && (
        <View style={{ backgroundColor: "#f0f7ff", borderRadius: 8, borderWidth: 0.5,
                       borderColor: "#90caf9", padding: 12, marginBottom: 14 }}>
          <Text style={{ fontSize: fontSize - 1, color: C.textSecondary, fontStyle: "italic" }}>{song.note}</Text>
        </View>
      )}

      {/* Rythme */}
      {song.rythme && (
        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 11, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.7,
                         color: C.textSecondary, marginBottom: 4 }}>🥁 Rythme</Text>
          <Text style={{ fontSize: fontSize, color: C.textSecondary }}>{song.rythme}</Text>
        </View>
      )}

      {/* Accords puis paroles */}
      {showAccordsFirst ? <>{globalAccordsSection}{lyricsSection}</> : <>{lyricsSection}{globalAccordsSection}</>}
      
      <Text style={{ fontSize: 11, color: C.textSecondary, marginTop: 4 }}>
        Ajouté par {song.soumisParNom} · {song.dateAjout}
      </Text>
    </ScrollView>
    </View>
  );
}

function FavoritesPage({ songs, favorites, onSelectSong, onNavigate, onToggleFavorite, playlists, onAddToPlaylist }:
  { songs: Chanson[]; favorites: string[]; onSelectSong: (s: Chanson) => void; onNavigate: (p: string) => void;
    onToggleFavorite?: (id: string) => void;
    playlists?: { name: string; songIds: string[] }[];
    onAddToPlaylist?: (songId: string, plIdx: number) => void }) {
  const [f, setF] = useState<FilterState>({ search: "", sort: "alpha", onlyCamp: false, campType: "", onlyGL: false, onlyDiverse: false, onlyEEIF: false, noCamp: false });
  const favSongs = applyFilters(songs.filter((s) => favorites.includes(s.id)), f);
  const total = songs.filter((s) => favorites.includes(s.id)).length;
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <BackBtn onPress={() => onNavigate("home")} />
      <Text style={{ fontSize: 22, fontWeight: "600", color: C.textPrimary, marginBottom: 2 }}>❤️ Mes favoris</Text>
      <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 10 }}>{total} chanson{total !== 1 ? "s" : ""} sauvegardée{total !== 1 ? "s" : ""}</Text>
      {total === 0 ? (
        <EmptyState emoji="🤍" title="Aucun favori pour l'instant"
          sub="Ouvre une chanson et appuie sur le cœur pour la sauvegarder ici"
          btnLabel="🎶 Parcourir toutes les chansons" onBtn={() => onNavigate("toutes")} />
      ) : (
        <>
          <SearchBar value={f.search} onChangeText={(t) => setF({ ...f, search: t })} />
          <FilterBar f={f} setF={setF} showCampSort config="favorites" />
          {favSongs.map((s) => <SongCard key={s.id} song={s} onPress={() => onSelectSong(s)}
            onToggleFavorite={onToggleFavorite} isFavorite={favorites.includes(s.id)}
            playlists={playlists} onAddToPlaylist={onAddToPlaylist} />)}
        </>
      )}
    </ScrollView>
  );
}
function PlaylistsPage({ songs, playlists, onAddPlaylist, onDeletePlaylist, onSelectPlaylist, selectedPlaylist,
  onBack, onSelectSong, onAddSongToPlaylist, onRemoveSongFromPlaylist }:
  { songs: Chanson[]; playlists: { name: string; songIds: string[] }[];
    onAddPlaylist: (name: string) => void; onDeletePlaylist: (i: number) => void;
    onSelectPlaylist: (i: number) => void; selectedPlaylist: number | null;
    onBack: () => void; onSelectSong: (s: Chanson) => void;
    onAddSongToPlaylist: (songId: string, plIdx: number) => void;
    onRemoveSongFromPlaylist: (songId: string, plIdx: number) => void;
    onNavigateHome: () => void }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [addingSong, setAddingSong] = useState(false);
  const [songSearch, setSongSearch] = useState("");

  if (selectedPlaylist !== null) {
    const pl = playlists[selectedPlaylist];
    const plSongs = songs.filter((s) => pl.songIds.includes(s.id) && s.statut === "approuvé");
    const available = songs.filter((s) => s.statut === "approuvé" && !pl.songIds.includes(s.id) &&
      (!songSearch || s.titre.toLowerCase().includes(songSearch.toLowerCase())));
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <BackBtn onPress={onBack} />
        <Text style={{ fontSize: 20, fontWeight: "600", color: C.textPrimary, marginBottom: 2 }}>📋 {pl.name}</Text>
        <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12 }}>{plSongs.length} chanson{plSongs.length !== 1 ? "s" : ""}</Text>
        {plSongs.length === 0 ? (
          <EmptyState emoji="🎵" title="Playlist vide" sub="Ajoute des chansons ci-dessous" />
        ) : (
          plSongs.map((s) => (
            <View key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <SongCard song={s} onPress={() => onSelectSong(s)} />
              </View>
              <TouchableOpacity onPress={() => onRemoveSongFromPlaylist(s.id, selectedPlaylist!)}
                style={{ padding: 10, borderRadius: 8, backgroundColor: C.red.bg, borderWidth: 0.5, borderColor: C.red.border }}>
                <Text style={{ color: C.red.text, fontSize: 13 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ marginTop: 10 }}>
          <TouchableOpacity onPress={() => setAddingSong(!addingSong)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ color: C.primary, fontWeight: "500", fontSize: 13 }}>
              {addingSong ? "▲ Masquer" : "➕ Ajouter des chansons"}
            </Text>
          </TouchableOpacity>
          {addingSong && (
            <View style={{ marginTop: 10 }}>
              <SearchBar value={songSearch} onChangeText={setSongSearch} placeholder="Chercher une chanson…" />
              {available.slice(0, 20).map((s) => (
                <TouchableOpacity key={s.id} onPress={() => onAddSongToPlaylist(s.id, selectedPlaylist)}
                  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                           paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: C.border }}>
                  <Text style={{ fontSize: 14, color: C.textPrimary, flex: 1 }}>{s.titre}</Text>
                  <Text style={{ color: C.primary, fontSize: 13 }}>+ Ajouter</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "600", color: C.textPrimary, marginBottom: 2 }}>📋 Playlists</Text>
      <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 14 }}>Organise tes veillées</Text>
      {playlists.length === 0 && !creating && (
        <EmptyState emoji="📋" title="Aucune playlist" sub="Crée ta première playlist pour organiser tes veillées" />
      )}
      {playlists.map((pl, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <TouchableOpacity onPress={() => onSelectPlaylist(i)} style={{ flex: 1 }}>
            <Card>
              <Text style={{ fontSize: 15, fontWeight: "500", color: C.textPrimary }}>📋 {pl.name}</Text>
              <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                {pl.songIds.length} chanson{pl.songIds.length !== 1 ? "s" : ""}
              </Text>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDeletePlaylist(i)}
            style={{ marginLeft: 8, padding: 10, borderRadius: 8, backgroundColor: C.red.bg, borderWidth: 0.5, borderColor: C.red.border }}>
            <Text style={{ color: C.red.text, fontSize: 13 }}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      {creating ? (
        <Card>
          <Text style={{ fontSize: 13, fontWeight: "500", marginBottom: 8, color: C.textPrimary }}>Nom de la playlist</Text>
          <TextInput value={newName} onChangeText={setNewName} placeholder="Ex: Veillée talent 2026"
            style={{ borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 9, fontSize: 14, color: C.textPrimary, marginBottom: 10 }} autoFocus />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Btn label="Créer" onPress={() => { if (newName.trim()) { onAddPlaylist(newName.trim()); setNewName(""); setCreating(false); } }} />
            <Btn label="Annuler" onPress={() => { setCreating(false); setNewName(""); }} variant="secondary" />
          </View>
        </Card>
      ) : (
        <Btn label="➕ Nouvelle playlist" onPress={() => setCreating(true)} />
      )}
    </ScrollView>
  );
}

function MultiGLSelector({ values, onChange }: { values: string[]; onChange: (ids: string[]) => void }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = GROUPES_LOCAUX.filter((g) =>
    !search || g.nom.toLowerCase().includes(search.toLowerCase()) ||
    g.ville.toLowerCase().includes(search.toLowerCase())
  );
  const toggle = (id: string) => {
    if (values.includes(id)) onChange(values.filter((x) => x !== id));
    else onChange([...values, id]);
  };
  const selectedGLs = GROUPES_LOCAUX.filter((g) => values.includes(g.id));
  return (
    <View style={{ marginBottom: 12 }}>
      {/* GL sélectionnés */}
      {selectedGLs.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {selectedGLs.map((g) => (
            <TouchableOpacity key={g.id} onPress={() => toggle(g.id)}
              style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#e8f5e9",
                       borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5,
                       borderWidth: 0.5, borderColor: C.primary }}>
              <Text style={{ fontSize: 12, color: C.primary, fontWeight: "500" }}>{g.nom}</Text>
              <Text style={{ fontSize: 12, color: C.primary }}>✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TouchableOpacity onPress={() => setOpen(!open)}
        style={{ borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 9, backgroundColor: C.white }}>
        <Text style={{ fontSize: 14, color: C.textSecondary }}>
          {open ? "▲ Fermer" : `➕ ${values.length > 0 ? "Ajouter un autre GL" : "Sélectionner un ou plusieurs GL"}`}
        </Text>
      </TouchableOpacity>
      {open && (
        <View style={{ borderWidth: 0.5, borderColor: C.border, borderRadius: 8, backgroundColor: C.white, maxHeight: 240, marginTop: 4 }}>
          <TextInput value={search} onChangeText={setSearch} placeholder="Rechercher un GL…"
            style={{ padding: 9, borderBottomWidth: 0.5, borderBottomColor: C.border, fontSize: 13, color: C.textPrimary }} autoFocus />
          <ScrollView nestedScrollEnabled style={{ maxHeight: 190 }}>
            {filtered.map((g) => (
              <TouchableOpacity key={g.id} onPress={() => toggle(g.id)}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                         padding: 10, borderBottomWidth: 0.5, borderBottomColor: C.border,
                         backgroundColor: values.includes(g.id) ? "#e8f5e9" : C.white }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: values.includes(g.id) ? "500" : "400", color: C.textPrimary }}>{g.nom}</Text>
                  <Text style={{ fontSize: 11, color: C.textSecondary }}>{g.ville}</Text>
                </View>
                {values.includes(g.id) && <Text style={{ color: C.primary, fontSize: 14 }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function SubmitPage({ onSubmit, onBack, editingSong = null }:
  { onSubmit: (s: Chanson) => void; onBack: () => void; editingSong?: Chanson | null }) {
  const [form, setForm] = useState({
    titre: editingSong?.titre || "",
    isEEIF: editingSong ? editingSong.categorie === "eeif" : false,
    isGL: editingSong?.isGL || false,
    //glId: editingSong?.glId || "",
    glIds: editingSong?.glIds || (editingSong?.glId ? [editingSong.glId] : []),
    isCamp: editingSong?.isCamp || false,
    annéeCamp: editingSong?.annéeCamp || "",
    nomCamp: editingSong?.nomCamp || "",
    typeCamp: editingSong?.typeCamp || "",
    auteur: editingSong?.auteur || "",
    airDe: editingSong?.airDe || "",
    note: editingSong?.note || "",
    accords: editingSong?.accords || "",
    rythme: editingSong?.rythme || "",
    lien: editingSong?.lien || "",
    soumisParEmail: editingSong?.soumisParEmail || "",
    texte: editingSong?.texte || [{ type: "couplet" as const, numero: 1, paroles: "", accords: "" }],
  });
  const [submitted, setSubmitted] = useState(false);
  const update = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const addVers = () => setForm((f) => ({
    ...f,
    texte: [...f.texte, {
      type: "couplet" as const,
      numero: f.texte.filter((v) => v.type === "couplet").length + 1,
      paroles: "",
      accords: "",
      multiplicateur: "",
    }],
  }));

  const updateVers = (i: number, key: string, val: any) => {
    const texte = [...form.texte];
    texte[i] = { ...texte[i], [key]: val };
    setForm((f) => ({ ...f, texte }));
  };
  const removeVers = (i: number) => setForm((f) => ({ ...f, texte: f.texte.filter((_, idx) => idx !== i) }));

  const handleSubmit = () => {
    if (!form.titre.trim()) { Alert.alert("Champ manquant", "Le titre est obligatoire"); return; }
    if (form.texte.every((v) => !v.paroles.trim())) { Alert.alert("Champ manquant", "Ajoute au moins des paroles"); return; }
    // Sécurisation des données en cascade
    const finalIsGL = form.isEEIF ? form.isGL : false;
    const finalIsCamp = finalIsGL ? form.isCamp : false;
    const glObjs = GROUPES_LOCAUX.filter((g) => (form.glIds || []).includes(g.id));
    //const glObj = GROUPES_LOCAUX.find((g) => g.id === form.glId);
    onSubmit({
      ...(editingSong || {}),
      id: editingSong?.id || ("s_" + Date.now()),
      titre: form.titre,
      categorie: form.isEEIF ? "eeif" : "diverse",
      isGL: finalIsGL,
      glIds: form.isGL ? (form.glIds || []) : undefined,
      glNoms: form.isGL ? glObjs.map((g) => g.nom) : undefined,
      //glId: finalIsGL ? form.glId : undefined,
      //glNom: glObj ? glObj.nom : undefined,
      isCamp: finalIsCamp,
      typeCamp: finalIsCamp ? (form.typeCamp || undefined) : undefined,
      annéeCamp: finalIsCamp ? form.annéeCamp : undefined,
      nomCamp: finalIsCamp ? form.nomCamp : undefined,
      texte: form.texte,
      accords: form.accords || null,
      rythme: form.rythme || null,
      auteur: form.auteur || null,
      airDe: form.airDe || null,
      note: form.note || null,
      lien: form.lien || null,
      soumisParEmail: form.soumisParEmail || undefined,
      statut: editingSong?.statut || "en_attente",
      soumisParNom: editingSong?.soumisParNom || "Contributeur",
      dateAjout: editingSong?.dateAjout || new Date().toISOString().slice(0, 10),
    } as Chanson);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <EmptyState emoji="🎉" title={editingSong ? "Chanson modifiée !" : "Chanson soumise !"}
          sub={editingSong ? "Les modifications ont été enregistrées." : "Ta chanson est en attente de validation par un administrateur."}
          btnLabel="← Retour à l'accueil" onBtn={onBack} />
      </ScrollView>
    );
  }

  const glSorted = [...GROUPES_LOCAUX].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  const inp = (val: string, key: string, placeholder: string, multiline = false) => (
    multiline ? (
      <TextInput value={val} onChangeText={(t) => update(key, t)} placeholder={placeholder}
        multiline numberOfLines={4}
        style={{ borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 9, fontSize: 14,
                 color: C.textPrimary, marginBottom: 12, minHeight: 80, textAlignVertical: "top" }} />
    ) : (
      <TextInput value={val} onChangeText={(t) => update(key, t)} placeholder={placeholder}
        style={{ borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 9, fontSize: 14,
                 color: C.textPrimary, marginBottom: 12 }} placeholderTextColor="#aaa"/>
    )
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "600", color: C.textPrimary, marginBottom: 4 }}>
        {editingSong ? "✏️ Modifier la chanson" : "➕ Soumettre une chanson"}
      </Text>
      <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 14 }}>
        Les champs * sont obligatoires.{!editingSong && " Ta soumission sera examinée avant publication."}
      </Text>

      <Text style={{ fontSize: 13, fontWeight: "500", color: C.textPrimary, marginBottom: 5 }}>Titre *</Text>
      {inp(form.titre, "titre", "Titre de la chanson")}

      {!editingSong && (
        <>
          <Text style={{ fontSize: 13, fontWeight: "500", color: C.textPrimary, marginBottom: 5 }}>Ton email (pour être notifié)</Text>
          {inp(form.soumisParEmail, "soumisParEmail", "email@exemple.com")}
        </>
      )}

      <Text style={{ fontSize: 13, fontWeight: "500", color: C.textPrimary, marginBottom: 5 }}>Accords épinglés</Text>
      <TextInput value={form.accords} onChangeText={(t) => update("accords", t)} placeholder="Ex: Am - F - C - G" placeholderTextColor="#aaa"
        multiline numberOfLines={3}
        style={{ borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 9, fontSize: 14,
                 color: C.textPrimary, marginBottom: 12, minHeight: 60, textAlignVertical: "top" }} />

      <Card>
        <Text style={{ fontWeight: "500", fontSize: 13, marginBottom: 12, color: C.textPrimary }}>Catégorie *</Text>

        {/* EEIF ou non */}
        <Text style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>Cette chanson est-elle une chanson EEIF ?</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
          {[{ v: true, label: "✅ Oui, chanson EEIF" }, { v: false, label: "🎵 Non, chanson diverse" }].map(({ v, label }) => (
            <TouchableOpacity key={String(v)} onPress={() => update("isEEIF", v)} style={{ flex: 1,
              paddingVertical: 10, borderRadius: 10, borderWidth: 1,
              borderColor: form.isEEIF === v ? C.primary : C.border,
              backgroundColor: form.isEEIF === v ? "#e8f5e9" : "#fafafa",
              alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: form.isEEIF === v ? C.primary : C.textSecondary,
                             fontWeight: form.isEEIF === v ? "600" : "400", textAlign: "center" }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* GL ou non — visible seulement si EEIF */}
        {form.isEEIF && (
          <>
            <Text style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>Chanson rattachée à un Groupe Local (GL) ?</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
              {[{ v: true, label: "📍 Oui, chanson de GL"},{ v: false, label: "⚜️ Non, chanson générale" }].map(({v, label }) => (
                <TouchableOpacity key={String(v)} onPress={() => update("isGL", v)} style={{ flex: 1,
                  paddingVertical: 10, borderRadius: 10, borderWidth: 1,
                  borderColor: form.isGL === v ? C.primary : C.border,
                  backgroundColor: form.isGL === v ? "#e8f5e9" : "#fafafa",
                  alignItems: "center" }}>
                  <Text style={{ fontSize: 13, color: form.isGL === v ? C.primary : C.textSecondary,
                                 fontWeight: form.isGL === v ? "600" : "400", textAlign: "center" }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Sélection du GL */}
            {form.isGL && (
              <>
                <Text style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>Quel GL ?</Text>
                <MultiGLSelector values={form.glIds || []} onChange={(v) => update("glIds", v)} />
            
                {/* Camp ou non */}
                <Text style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>Chanson créée lors d'un camp ?</Text>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
                  {[{ v: true, label: "⛺ Oui, chanson de camp" }, { v: false, label: "🎵 Non" }].map(({ v, label }) => (
                    <TouchableOpacity key={String(v)} onPress={() => update("isCamp", v)} style={{ flex: 1,
                      paddingVertical: 10, borderRadius: 10, borderWidth: 1,
                      borderColor: form.isCamp === v ? C.primary : C.border,
                      backgroundColor: form.isCamp === v ? "#e8f5e9" : "#fafafa",
                      alignItems: "center" }}>
                      <Text style={{ fontSize: 13, color: form.isCamp === v ? C.primary : C.textSecondary,
                                     fontWeight: form.isCamp === v ? "600" : "400", textAlign: "center" }}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Année et nom du camp */}
                {form.isCamp && (
                  <View style={{ paddingLeft: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: "500", color: C.textPrimary, marginBottom: 4 }}>Type de camp</Text>
                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                      {["BC", "BM", "BP"].map((type) => (
                        <TouchableOpacity key={type} onPress={() => update("typeCamp", form.typeCamp === type ? "" : type)}
                          style={{ flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: "center",
                                   borderColor: form.typeCamp === type ? C.primary : C.border,
                                   backgroundColor: form.typeCamp === type ? "#e8f5e9" : "#fafafa" }}>
                          <Text style={{ fontSize: 13, color: form.typeCamp === type ? C.primary : C.textSecondary,
                                         fontWeight: form.typeCamp === type ? "600" : "400" }}>⛺ {type}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={{ fontSize: 12, fontWeight: "500", color: C.textPrimary, marginBottom: 4 }}>Année du camp *</Text>
                    <TextInput value={form.annéeCamp} onChangeText={(t) => update("annéeCamp", t)} placeholder="Ex: 2023"
                      style={{ borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 9,
                               fontSize: 14, color: C.textPrimary, marginBottom: 10 }} />
                    <Text style={{ fontSize: 12, fontWeight: "500", color: C.textSecondary, marginBottom: 4 }}>Nom du camp (facultatif)</Text>
                    <TextInput value={form.nomCamp} onChangeText={(t) => update("nomCamp", t)} placeholder="Ex: Masumtini"
                      style={{ borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 9,
                               fontSize: 14, color: C.textPrimary, marginBottom: 10 }} />
                  </View>
                )}
              </>
            )}
          </>
        )}
      </Card>

      <Card>
        <Text style={{ fontWeight: "500", fontSize: 13, marginBottom: 10, color: C.textPrimary }}>Paroles *</Text>
        {form.texte.map((v, i) => (
          <View key={i} style={{ marginBottom: 12, padding: 10, backgroundColor: "#f8f8f8", borderRadius: 10 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8, alignItems: "center" }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
                {VERS_TYPES.map((t) => (
                  <TouchableOpacity key={t} onPress={() => {
                    const PRE_REMPLIR = ["refrain", "pré-refrain", "pont", "post-refrain"];
                    const currentTexte = form.texte;
                    const sameType = currentTexte.filter((v, idx) => idx !== i && v.type === t);
                    const last = sameType.length > 0 ? sameType[sameType.length - 1] : null;
                    const currentVers = currentTexte[i];
                    const newParoles = (PRE_REMPLIR.includes(t) && last && !currentVers.paroles)
                      ? (last.paroles || "") : currentVers.paroles;
                    const newAccords = (last && !currentVers.accords)
                      ? (last.accords || "") : currentVers.accords;
                    const newNumero = t === "couplet"
                      ? currentTexte.filter((v, idx) => idx !== i && v.type === "couplet").length + 1
                      : undefined;
                    const newTexte = [...currentTexte];
                    newTexte[i] = { ...currentVers, type: t as any, paroles: newParoles, accords: newAccords, numero: newNumero };
                    setForm((prev) => ({ ...prev, texte: newTexte }));
                  }}
                    style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, borderWidth: 0.5,
                             borderColor: v.type === t ? C.primary : C.border,
                             backgroundColor: v.type === t ? "#e8f5e9" : C.white }}>
                    <Text style={{ fontSize: 12, color: v.type === t ? C.primary : C.textSecondary }}>{versTypeLabel[t]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {form.texte.length > 1 && (
                <TouchableOpacity onPress={() => removeVers(i)} style={{ padding: 6, borderRadius: 6, backgroundColor: C.red.bg }}>
                  <Text style={{ color: C.red.text, fontSize: 12 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={{ fontSize: 12, color: C.textPrimary, marginBottom: 4 }}>Paroles</Text>
            <TextInput value={v.paroles} onChangeText={(t) => updateVers(i, "paroles", t)}
              placeholder="Paroles de cette partie…" multiline numberOfLines={4}
              placeholderTextColor="#aaa"
              style={{ borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 9, fontSize: 14,
                       color: C.textPrimary, minHeight: 70, textAlignVertical: "top", marginBottom: 8 }} />
            <Text style={{ fontSize: 12, color: C.textPrimary, marginBottom: 4 }}>Accords pour cette partie (facultatif)</Text>
            <TextInput value={v.accords || ""} onChangeText={(t) => updateVers(i, "accords", t)}
              placeholder="Ex: Am - F - C - G"
              placeholderTextColor="#aaa"
              style={{ borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 9, fontSize: 14, color: C.textPrimary }} />
            <Text style={{ fontSize: 12, color: C.textPrimary, marginBottom: 4, marginTop: 8 }}>Multiplicateur (facultatif)</Text>
            <TextInput value={v.multiplicateur || ""} onChangeText={(t) => updateVers(i, "multiplicateur", t)}
              placeholder="Ex: x2"
              placeholderTextColor="#aaa"
              style={{ borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 9,
                       fontSize: 14, color: C.textPrimary, width: 80 }} />
          </View>
        ))}
        <Btn label="+ Ajouter une partie" onPress={addVers} variant="secondary" small />
      </Card>

      <Text style={{ fontSize: 13, fontWeight: "500", color: C.textSecondary, marginVertical: 10 }}>Éléments facultatifs</Text>
      <Text style={{ fontSize: 13, fontWeight: "500", color: C.textPrimary, marginBottom: 5 }}>Auteur / compositeur</Text>
      {inp(form.auteur, "auteur", "Nom de l'auteur")}
      <Text style={{ fontSize: 13, fontWeight: "500", color: C.textPrimary, marginBottom: 5 }}>Sur l'air de…</Text>
      {inp(form.airDe, "airDe", "Titre d'origine")}

      <Text style={{ fontSize: 13, fontWeight: "500", color: C.textPrimary, marginBottom: 5 }}>Rythme</Text>
      {inp(form.rythme, "rythme", "Ex: B BH HBHB BH")}
      <Text style={{ fontSize: 13, fontWeight: "500", color: C.textPrimary, marginBottom: 5 }}>Lien (YouTube, Spotify, SoundCloud)</Text>
      {inp(form.lien, "lien", "https://…")}
      <Text style={{ fontSize: 13, fontWeight: "500", color: C.textPrimary, marginBottom: 5 }}>Note personnelle / explicative</Text>
      {inp(form.note, "note", "Contexte, anecdote, recommandation de jeu…", true)}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
        <Btn label="🎵 Soumettre" onPress={handleSubmit} />
        <Btn label="Annuler" onPress={onBack} variant="secondary" />
      </View>
    </ScrollView>
  );
}

// GL selector with search
function GLSelector({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const selected = GROUPES_LOCAUX.find((g) => g.id === value);
  const filtered = GROUPES_LOCAUX.filter((g) =>
    !search || g.nom.toLowerCase().includes(search.toLowerCase()) ||
    g.figure.toLowerCase().includes(search.toLowerCase()) ||
    g.ville.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <View style={{ marginBottom: 12 }}>
      <TouchableOpacity onPress={() => setOpen(!open)}
        style={{ borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 9, backgroundColor: C.white, marginBottom: 4 }}>
        <Text style={{ fontSize: 14, color: selected ? C.textPrimary : C.textSecondary }}>
          {selected ? `${selected.nom} — ${selected.ville}` : "— Sélectionner un GL —"}
        </Text>
      </TouchableOpacity>
      {open && (
        <View style={{ borderWidth: 0.5, borderColor: C.border, borderRadius: 8, backgroundColor: C.white, maxHeight: 220 }}>
          <TextInput value={search} onChangeText={setSearch} placeholder="Rechercher un GL…"
            style={{ padding: 9, borderBottomWidth: 0.5, borderBottomColor: C.border, fontSize: 13, color: C.textPrimary }} autoFocus />
          <ScrollView nestedScrollEnabled style={{ maxHeight: 170 }}>
            {filtered.map((g) => (
              <TouchableOpacity key={g.id} onPress={() => { onChange(g.id); setOpen(false); setSearch(""); }}
                style={{ padding: 10, borderBottomWidth: 0.5, borderBottomColor: C.border,
                         backgroundColor: value === g.id ? "#e8f5e9" : C.white }}>
                <Text style={{ fontSize: 13, fontWeight: value === g.id ? "500" : "400", color: C.textPrimary }}>
                  {g.nom} — {g.figure}
                </Text>
                <Text style={{ fontSize: 11, color: C.textSecondary }}>{g.ville}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function RemarqueModal({ song, onClose, onSubmit }:
  { song: Chanson; onClose: () => void; onSubmit: (r: any) => void }) {
  const [type, setType] = useState<"correction"|"accords"|"paroles"|"autre">("correction");
  const [contenu, setContenu] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const types = [
    { k: "correction", label: "✏️ Correction générale" },
    { k: "accords",    label: "🎸 Accords manquants/erronés" },
    { k: "paroles",    label: "📝 Paroles incomplètes" },
    { k: "autre",      label: "💬 Autre remarque" },
  ];
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", color: C.textPrimary, marginBottom: 4 }}>
        💬 Proposer une modification
      </Text>
      <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 14 }}>
        Pour : {song.titre}
      </Text>
      <Text style={{ fontSize: 12, fontWeight: "500", color: C.textPrimary, marginBottom: 6 }}>Type de remarque</Text>
      {types.map(({ k, label }) => (
        <TouchableOpacity key={k} onPress={() => setType(k as any)}
          style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 9,
                   borderBottomWidth: 0.5, borderBottomColor: C.border }}>
          <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5,
                         borderColor: type === k ? C.primary : C.border,
                         backgroundColor: type === k ? C.primary : "transparent",
                         alignItems: "center", justifyContent: "center" }}>
            {type === k && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.white }} />}
          </View>
          <Text style={{ fontSize: 14, color: C.textPrimary }}>{label}</Text>
        </TouchableOpacity>
      ))}
      <Text style={{ fontSize: 12, fontWeight: "500", color: C.textPrimary, marginTop: 14, marginBottom: 6 }}>
        Ta remarque / correction *
      </Text>
      <TextInput value={contenu} onChangeText={setContenu}
        placeholder="Décris la correction ou la modification souhaitée…"
        multiline numberOfLines={5} placeholderTextColor="#aaa"
        style={{ borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 9, fontSize: 14,
                 color: C.textPrimary, minHeight: 100, textAlignVertical: "top", marginBottom: 12 }} />
      <Text style={{ fontSize: 12, fontWeight: "500", color: C.textPrimary, marginBottom: 6 }}>Ton prénom</Text>
      <TextInput value={nom} onChangeText={setNom} placeholder="Prénom" placeholderTextColor="#aaa"
        style={{ borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 9,
                 fontSize: 14, color: C.textPrimary, marginBottom: 12 }} />
      <Text style={{ fontSize: 12, fontWeight: "500", color: C.textSecondary, marginBottom: 6 }}>Email (facultatif)</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="email@exemple.com" placeholderTextColor="#aaa"
        style={{ borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 9,
                 fontSize: 14, color: C.textPrimary, marginBottom: 16 }} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Btn label="Envoyer" onPress={() => {
          if (!contenu.trim()) { Alert.alert("Champ manquant", "Écris ta remarque"); return; }
          onSubmit({ type, contenu, soumisParNom: nom || "Anonyme", soumisParEmail: email || undefined,
                     chansonId: song.id, dateAjout: new Date().toISOString().slice(0, 10), statut: "en_attente" });
          onClose();
        }} />
        <Btn label="Annuler" onPress={onClose} variant="secondary" />
      </View>
    </ScrollView>
  );
}

function AdminPage({ songs, onApprove, onRejectWithEmail, onEdit, onBack }:
  { songs: Chanson[]; onApprove: (id: string) => void;
    onRejectWithEmail: (song: Chanson) => void; onEdit: (song: Chanson) => void; onBack: () => void }) {
  const pending = songs.filter((s) => s.statut === "en_attente");
  const approved = songs.filter((s) => s.statut === "approuvé");
  const [remarques, setRemarques] = useState<any[]>([]);
  useEffect(() => {
    const { ecouterRemarques } = require('../../config/songService');
    return ecouterRemarques(setRemarques);
  }, []);
  const remarquesEnAttente = remarques.filter(r => r.statut === "en_attente");
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <BackBtn onPress={onBack} />
      <Text style={{ fontSize: 22, fontWeight: "600", color: C.textPrimary, marginBottom: 4 }}>⚙️ Administration</Text>
      <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 14 }}>
        {pending.length} chanson{pending.length !== 1 ? "s" : ""} en attente
      </Text>
      {pending.length === 0 ? (
        <EmptyState emoji="✅" title="Tout est à jour !" sub="Aucune chanson en attente de validation" />
      ) : (
        pending.map((s) => (
          <Card key={s.id}>
            <Text style={{ fontSize: 15, fontWeight: "500", color: C.textPrimary, marginBottom: 4 }}>{s.titre}</Text>
            <Text style={{ fontSize: 12, color: C.textSecondary, marginBottom: 10 }}>
              Soumis par {s.soumisParNom}{s.soumisParEmail ? ` (${s.soumisParEmail})` : ""} · {s.dateAjout}
            </Text>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Btn label="✓ Approuver" onPress={() => onApprove(s.id)} small />
              <Btn label="✕ Refuser" onPress={() => onRejectWithEmail(s)} variant="danger" small />
              <Btn label="✏️ Modifier" onPress={() => onEdit(s)} variant="secondary" small />
            </View>
          </Card>
        ))
      )}
      {remarquesEnAttente.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <View style={{ backgroundColor: "#e3f2fd", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
                           borderWidth: 0.5, borderColor: "#90caf9" }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#1565c0", textTransform: "uppercase" }}>
                💬 REMARQUES — {remarquesEnAttente.length} en attente
              </Text>
            </View>
          </View>
          {remarquesEnAttente.map((r) => {
            const chanson = songs.find(s => s.id === r.chansonId);
            return (
              <View key={r.id} style={{ backgroundColor: "#f0f7ff", borderRadius: 10, borderWidth: 1,
                                        borderColor: "#90caf9", padding: 12, marginBottom: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#1565c0", textTransform: "uppercase",
                               marginBottom: 4 }}>
                  {r.type === "accords" ? "🎸 Accords" : r.type === "paroles" ? "📝 Paroles" :
                   r.type === "correction" ? "✏️ Correction" : "💬 Autre"}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: "500", color: C.textPrimary, marginBottom: 2 }}>
                  Chanson : {chanson?.titre || r.chansonId}
                </Text>
                <Text style={{ fontSize: 13, color: C.textPrimary, marginBottom: 8 }}>{r.contenu}</Text>
                <Text style={{ fontSize: 11, color: C.textSecondary, marginBottom: 8 }}>
                  Par {r.soumisParNom}{r.soumisParEmail ? ` (${r.soumisParEmail})` : ""} · {r.dateAjout}
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Btn label="✓ Traité" small onPress={async () => {
                    const { marquerRemarqueTraitee } = await import('../../config/songService');
                    await marquerRemarqueTraitee(r.id);
                  }} />
                  <Btn label="🗑 Supprimer" small variant="danger" onPress={async () => {
                    const { supprimerRemarque } = await import('../../config/songService');
                    await supprimerRemarque(r.id);
                  }} />
                </View>
              </View>
            );
          })}
        </View>
      )}
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontWeight: "500", marginBottom: 10, color: C.textSecondary, fontSize: 13 }}>
          Chansons approuvées ({approved.length})
        </Text>
        {approved.map((s) => (
          <View key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Card>
                <Text style={{ fontSize: 14, fontWeight: "500", color: C.textPrimary }}>{s.titre}</Text>
                <Text style={{ fontSize: 11, color: C.textSecondary }}>{s.categorie} · {s.dateAjout}</Text>
              </Card>
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <TouchableOpacity onPress={() => onEdit(s)}
                style={{ padding: 8, borderRadius: 8, backgroundColor: "#f5f5f5", borderWidth: 0.5, borderColor: C.border }}>
                <Text style={{ fontSize: 13 }}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onRejectWithEmail(s)}
                style={{ padding: 8, borderRadius: 8, backgroundColor: C.red.bg, borderWidth: 0.5, borderColor: C.red.border }}>
                <Text style={{ fontSize: 13 }}>🗑</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// Email de refus
function RejectEmailModal({ song, onSend, onCancel }:
  { song: Chanson; onSend: (msg: string) => void; onCancel: () => void }) {
  const intro = `Bonjour,\n\nMerci d'avoir soumis la chanson "${song.titre}" sur l'application Chant-EEIF.\n\nAprès examen, nous ne pouvons malheureusement pas la publier pour la raison suivante :\n\n`;
  const outro = `\n\nSi tu as des questions, n'hésite pas à nous contacter.\n\nL'équipe Chant-EEIF`;
  const [body, setBody] = useState("");
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "600", color: C.textPrimary, marginBottom: 4 }}>✉️ Email de refus</Text>
      <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 14 }}>
        Rédige la raison du refus — l'email complet sera composé automatiquement.
      </Text>
      <View style={{ backgroundColor: "#f8f8f8", borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <Text style={{ fontSize: 13, color: C.textSecondary, fontStyle: "italic" }}>{intro}</Text>
      </View>
      <TextInput value={body} onChangeText={setBody} placeholder="Raison du refus (ex: les paroles sont incomplètes, la chanson existe déjà sous un autre titre…)"
        multiline numberOfLines={5}
        style={{ borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 9, fontSize: 14,
                 color: C.textPrimary, minHeight: 100, textAlignVertical: "top", marginBottom: 12 }} autoFocus />
      <View style={{ backgroundColor: "#f8f8f8", borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <Text style={{ fontSize: 13, color: C.textSecondary, fontStyle: "italic" }}>{outro}</Text>
      </View>
      {song.soumisParEmail ? (
        <Text style={{ fontSize: 12, color: C.textSecondary, marginBottom: 12 }}>
          Email envoyé à : {song.soumisParEmail}
        </Text>
      ) : (
        <View style={{ backgroundColor: C.amber.bg, borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 0.5, borderColor: C.amber.border }}>
          <Text style={{ fontSize: 12, color: C.amber.text }}>⚠️ Le soumetteur n'a pas renseigné d'email — l'email ne pourra pas être envoyé automatiquement.</Text>
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Btn label="Envoyer & Supprimer" onPress={() => onSend(intro + body + outro)} />
        <Btn label="Annuler" onPress={onCancel} variant="secondary" />
      </View>
    </ScrollView>
  );
}

function AccountPage({ isAdmin, adminPwd, onToggleAdmin, onBack, settings, onUpdateSettings }:
  { isAdmin: boolean; adminPwd: string; onToggleAdmin: (v: boolean, pwd?: string) => void;
    onBack: () => void; settings: Settings; onUpdateSettings: (s: Settings) => void }) {
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState(false);
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <BackBtn onPress={onBack} />
      <Text style={{ fontSize: 22, fontWeight: "600", color: C.textPrimary, marginBottom: 14 }}>👤 Mon compte</Text>
      <Card>
        <Text style={{ fontSize: 15, fontWeight: "500", color: C.textPrimary, marginBottom: 8 }}>Connexion</Text>
        <View style={{ backgroundColor: "#f0f7ff", borderRadius: 8, borderWidth: 0.5, borderColor: "#90caf9", padding: 10, marginBottom: 10 }}>
          <Text style={{ fontSize: 13, color: "#1565c0" }}>
            La connexion permettra de synchroniser tes favoris sur tous tes appareils. Fonctionnalité à venir !
          </Text>
        </View>
        <Btn label="Se connecter (bientôt)" onPress={() => {}} disabled />
      </Card>

      <Card>
        <Text style={{ fontSize: 15, fontWeight: "500", color: C.textPrimary, marginBottom: 8 }}>Mode administrateur</Text>
        {isAdmin ? (
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#4caf50" }} />
              <Text style={{ fontSize: 13, color: "#2e7d32", fontWeight: "500" }}>Mode admin activé</Text>
            </View>
            <Btn label="Se déconnecter" onPress={() => onToggleAdmin(false)} variant="secondary" small />
          </View>
        ) : (
          <View>
            <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 8 }}>Mot de passe administrateur :</Text>
            <TextInput value={pwd} onChangeText={(t) => { setPwd(t); setPwdError(false); }}
              placeholder="Mot de passe" secureTextEntry
              style={{ borderWidth: 0.5, borderColor: pwdError ? C.red.border : C.border, borderRadius: 8, padding: 9,
                       fontSize: 14, color: C.textPrimary, marginBottom: 8 }} />
            {pwdError && <Text style={{ color: C.red.text, fontSize: 12, marginBottom: 6 }}>Mot de passe incorrect</Text>}
            <Btn label="Connexion admin" onPress={() => {
              if (pwd === adminPwd) { onToggleAdmin(true, pwd); setPwd(""); }
              else { setPwdError(true); }
            }} small />
          </View>
        )}
        <Text style={{ fontSize: 11, color: C.textSecondary, marginTop: 10 }}>
          Champ réservé a l'administration
          {/*Mot de passe par défaut : admin123 (à changer dans le code)*/}
        </Text>
      </Card>
    </ScrollView>
  );
}

function SettingsPage({ settings, onUpdate, onBack }:
  { settings: Settings; onUpdate: (s: Settings) => void; onBack: () => void }) {
  const row = (label: string, sub: string, control: React.ReactNode) => (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                   paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: C.border }}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: "500", color: C.textPrimary }}>{label}</Text>
        {sub ? <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      {control}
    </View>
  );
  const sizes = [12, 14, 16, 18, 20];
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <BackBtn onPress={onBack} />
      <Text style={{ fontSize: 22, fontWeight: "600", color: C.textPrimary, marginBottom: 14 }}>⚙️ Réglages</Text>
      <Card>
        {row("Taille de la police", `Actuelle : ${settings.fontSize}px`,
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
            {sizes.map((s) => (
              <TouchableOpacity key={s} onPress={() => onUpdate({ ...settings, fontSize: s })}
                style={{ width: 34, height: 34, borderRadius: 8, borderWidth: 0.5,
                         borderColor: settings.fontSize === s ? C.primary : C.border,
                         backgroundColor: settings.fontSize === s ? "#e8f5e9" : C.white,
                         alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 13, color: settings.fontSize === s ? C.primary : C.textSecondary }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        {row("Accords avant les paroles",
          "Affiche les accords en haut, avant le texte de la chanson",
          <TouchableOpacity onPress={() => onUpdate({ ...settings, showAccordsFirst: !settings.showAccordsFirst })}
            style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: settings.showAccordsFirst ? C.primary : "#ccc",
                     justifyContent: "center", paddingHorizontal: 3 }}>
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: C.white,
                           alignSelf: settings.showAccordsFirst ? "flex-end" : "flex-start" }} />
          </TouchableOpacity>
        )}
        {row("Vue compacte", "Réduit l'espacement entre les chansons dans les listes",
          <TouchableOpacity onPress={() => onUpdate({ ...settings, compactView: !settings.compactView })}
            style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: settings.compactView ? C.primary : "#ccc",
                     justifyContent: "center", paddingHorizontal: 3 }}>
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: C.white,
                           alignSelf: settings.compactView ? "flex-end" : "flex-start" }} />
          </TouchableOpacity>
        )}
      </Card>
    </ScrollView>
  );
}

// ─── DRAWER ──────────────────────────────────────────────────────────────────

function Drawer({ open, onClose, page, onNavigate, isAdmin, pendingCount }:
  { open: boolean; onClose: () => void; page: string; onNavigate: (p: string) => void;
    isAdmin: boolean; pendingCount: number }) {
  if (!open) return null;
  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      <TouchableOpacity style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)" }}
        onPress={onClose} activeOpacity={1} />
      <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 280,
                     backgroundColor: C.white, shadowColor: "#000", shadowOpacity: 0.2,
                     shadowRadius: 10, elevation: 10 }}>
        <ScrollView>
          <View style={{ backgroundColor: C.primary, padding: 20, paddingTop: 50 }}>
            <Text style={{ color: "#e8f5e9", fontSize: 20, fontWeight: "700", letterSpacing: 0.5 }}>🏕️ Chant-EEIF</Text>
            <Text style={{ color: "#a5d6a7", fontSize: 12, marginTop: 2 }}>Carnet de chants du mouvement</Text>
          </View>
          {/* Home */}
          <DrawerItem label="🏠 Accueil" active={page === "home"} onPress={() => onNavigate("home")} />
          <View style={{ height: 0.5, backgroundColor: C.border, marginVertical: 4 }} />
          <Text style={{ fontSize: 11, fontWeight: "500", color: C.textSecondary, textTransform: "uppercase",
                         letterSpacing: 0.8, paddingHorizontal: 16, paddingVertical: 4 }}>Chansons</Text>
          {HERO_TABS.map((t) => (
            <DrawerItem key={t.id} label={`${t.emoji} ${t.label}`} active={page === t.id} onPress={() => onNavigate(t.id)} />
          ))}
          <View style={{ height: 0.5, backgroundColor: C.border, marginVertical: 4 }} />
          {isAdmin && (
            <DrawerItem label={`⚙️ Administration${pendingCount > 0 ? ` (${pendingCount})` : ""}`}
              active={page === "admin"} onPress={() => onNavigate("admin")} />
          )}
          <DrawerItem label="⚙️ Réglages" active={page === "reglages"} onPress={() => onNavigate("reglages")} />
          <DrawerItem label="👤 Mon compte" active={page === "compte"} onPress={() => onNavigate("compte")} />
        </ScrollView>
      </View>
    </View>
  );
}

function DrawerItem({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress}
      style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: active ? "rgba(26,58,42,0.08)" : "transparent",
               borderLeftWidth: 3, borderLeftColor: active ? C.primary : "transparent" }}>
      <Text style={{ fontSize: 14, color: active ? C.primary : C.textPrimary, fontWeight: active ? "500" : "400" }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── TOAST ───────────────────────────────────────────────────────────────────

function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <View style={{ position: "absolute", bottom: 32, left: 20, right: 20, backgroundColor: C.primary,
                   borderRadius: 12, padding: 14, alignItems: "center", zIndex: 999 }}>
      <Text style={{ color: "#e8f5e9", fontSize: 14 }}>{msg}</Text>
    </View>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = "admin123"; // ← Change ce mot de passe !

export default function App() {
  const [page, setPage] = useState("home");
  const [drawerOpen, setDrawerOpen] = useState(false);
//const [songs, setSongs] = useState<Chanson[]>(CHANSONS_INITIALES);
  const [songs, setSongs] = useState<Chanson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState<Chanson | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<{ name: string; songIds: string[] }[]>([]);
  //const [playlists, setPlaylists] = useState([{ name: "Veillée feu de camp", songIds: ["s1", "s2"] }]);
  const [selectedPlaylistIdx, setSelectedPlaylistIdx] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [rejectingSong, setRejectingSong] = useState<Chanson | null>(null);
  const [editingSong, setEditingSong] = useState<Chanson | null>(null);

    // Connexion à Firebase au démarrage
  useEffect(() => {
    // Initialise avec les chansons de départ si c'est la première fois
    initialiserChansons().catch(console.error);

    // Écoute les changements en temps réel
    const unsubscribe = ecouterChansons((chansons) => {
      setSongs(chansons);
      setLoading(false);
    });

    // Nettoyage quand l'app se ferme
    return () => unsubscribe();
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const navigate = useCallback((p: string) => {
    setPage(p); setSelectedSong(null); setSelectedPlaylistIdx(null);
    setRejectingSong(null); setEditingSong(null); setDrawerOpen(false);
  }, []);

  const handleToggleFavorite = (id: string) => {
    setFavorites((f) => {
      const has = f.includes(id);
      showToast(has ? "Retiré des favoris" : "Ajouté aux favoris ❤️");
      return has ? f.filter((x) => x !== id) : [...f, id];
    });
  };

  const handleSubmitSong = async (song: Chanson) => {
    try {
      const { id, ...songSansId } = song;
      if (editingSong) {
        await mettreAJourChanson(song.id, songSansId);
        showToast('Chanson modifiée ✓');
      } else {
        await soumettreChangon(songSansId);
        showToast('Chanson soumise ✓ — en attente de validation');
      }
      setEditingSong(null);
      navigate('home');
    } catch (e) {
      showToast('Erreur — vérifie ta connexion internet');
      console.error(e);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await mettreAJourChanson(id, { statut: 'approuvé' });
      setSelectedSong(null);
      showToast('Chanson approuvée ✓');
    } catch (e) {
      showToast('Erreur lors de la validation');
    }
  };

  const handleRejectWithEmail = (song: Chanson) => {
    if (song.statut === 'en_attente') {
      setRejectingSong(song);
    } else {
      Alert.alert('Supprimer', `Supprimer "${song.titre}" ?`, [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            try {
              await supprimerChanson(song.id);
              setSelectedSong(null);
              showToast('Chanson supprimée');
            } catch (e) {
              showToast('Erreur lors de la suppression');
            }
          },
        },
      ]);
    }
  };

  const handleSendRejectEmail = async (msg: string) => {
    if (!rejectingSong) return;
    try {
      await supprimerChanson(rejectingSong.id);
      if (rejectingSong.soumisParEmail) {
        showToast(`Chanson supprimée — email à envoyer à ${rejectingSong.soumisParEmail}`);
        // En production: appel à un service d'email ici (ex: EmailJS, SendGrid)
      } else {
        showToast('Chanson supprimée (pas d\'email renseigné)');
      }
    } catch (e) {
      showToast('Erreur lors de la suppression');
    }
    setRejectingSong(null);
    setSelectedSong(null);
  };

  const handleAddToPlaylist = (songId: string, plIdx: number) => {
    setPlaylists((p) => {
      const updated = [...p];
      if (!updated[plIdx].songIds.includes(songId)) {
        updated[plIdx] = { ...updated[plIdx], songIds: [...updated[plIdx].songIds, songId] };
        showToast(`Ajouté à "${updated[plIdx].name}" ✓`);
      } else {
        showToast("Déjà dans cette playlist");
      }
      return updated;
    });
  };

  const handleRemoveFromPlaylist = (songId: string, plIdx: number) => {
    setPlaylists((p) => {
      const updated = [...p];
      updated[plIdx] = { ...updated[plIdx], songIds: updated[plIdx].songIds.filter((id) => id !== songId) };
      showToast("Retiré de la playlist");
      return updated;
    });
  };

  const pendingCount = songs.filter((s) => s.statut === "en_attente").length;

  // Mode email de refus
  if (rejectingSong) {
    return (
      <SettingsCtx.Provider value={settings}>
        <View style={{ flex: 1, backgroundColor: C.lightBg, paddingTop: Platform.OS === "ios" ? 50 : 24 }}>
          <RejectEmailModal song={rejectingSong}
            onSend={handleSendRejectEmail}
            onCancel={() => setRejectingSong(null)} />
          <Toast msg={toast} />
        </View>
      </SettingsCtx.Provider>
    );
  }

  // Mode édition
  if (editingSong) {
    return (
      <SettingsCtx.Provider value={settings}>
        <View style={{ flex: 1, backgroundColor: C.lightBg, paddingTop: Platform.OS === "ios" ? 50 : 24 }}>
          <SubmitPage onSubmit={handleSubmitSong} onBack={() => setEditingSong(null)} editingSong={editingSong} />
          <Toast msg={toast} />
        </View>
      </SettingsCtx.Provider>
    );
  }

  const renderContent = () => {
    if (selectedSong) return (
      <SongDetailPage song={selectedSong} onBack={() => setSelectedSong(null)}
        favorites={favorites} onToggleFavorite={handleToggleFavorite}
        playlists={playlists} onAddToPlaylist={handleAddToPlaylist}
        isAdmin={isAdmin} onApprove={handleApprove}
        onRejectWithEmail={handleRejectWithEmail} onEdit={(s) => setEditingSong(s)} />
    );
    if (page === "home")      return <HomePage onNavigate={navigate} />;
    if (page === "toutes")    return <SongListPage title="🎶 Toutes les chansons" songs={songs}
      onSelectSong={setSelectedSong} onSubmit={() => navigate("soumettre")} onBack={() => navigate("home")} filterConfig="toutes"
      onToggleFavorite={handleToggleFavorite} favorites={favorites} playlists={playlists} onAddToPlaylist={handleAddToPlaylist}/>;
    if (page === "eeif")      return <SongListPage title="⚜️ Chansons EEIF" subtitle="Chansons officielles du mouvement"
      songs={songs.filter((s) => s.categorie === "eeif")} onSelectSong={setSelectedSong}
      onSubmit={() => navigate("soumettre")} onBack={() => navigate("home")} filterConfig="eeif"
      onToggleFavorite={handleToggleFavorite} favorites={favorites} playlists={playlists} onAddToPlaylist={handleAddToPlaylist}/>;
    if (page === "gl")        return <GLPage songs={songs} onSelectSong={setSelectedSong} onSubmit={() => navigate("soumettre")} onNavigateHome={() => navigate("home")}/>;
    if (page === "diverses")  return <SongListPage title="🎵 Chansons diverses" subtitle="Chansons populaires et classiques scouts"
      songs={songs.filter((s) => s.categorie === "diverse")} onSelectSong={setSelectedSong}
      onSubmit={() => navigate("soumettre")} onBack={() => navigate("home")} filterConfig="diverses"
      onToggleFavorite={handleToggleFavorite} favorites={favorites} playlists={playlists} onAddToPlaylist={handleAddToPlaylist}/>;
    if (page === "favorites") return <FavoritesPage songs={songs} favorites={favorites} onSelectSong={setSelectedSong}
      onNavigate={navigate} onToggleFavorite={handleToggleFavorite} playlists={playlists} onAddToPlaylist={handleAddToPlaylist}/>;
//    if (page === "toutes")    return <SongListPage title="🎶 Toutes les chansons" songs={songs} onSelectSong={setSelectedSong} onSubmit={() => navigate("soumettre")} onBack={() => navigate("home")}/>;
//    if (page === "eeif")      return <SongListPage title="⚜️ Chansons EEIF" subtitle="Chansons officielles du mouvement" songs={songs.filter((s) => s.categorie === "eeif")} onSelectSong={setSelectedSong} onSubmit={() => navigate("soumettre")} onBack={() => navigate("home")}/>;
//    if (page === "gl")        return <GLPage songs={songs} onSelectSong={setSelectedSong} onSubmit={() => navigate("soumettre")} onNavigateHome={() => navigate("home")}/>;
//    if (page === "diverses")  return <SongListPage title="🎵 Chansons diverses" subtitle="Chansons populaires et classiques scouts" songs={songs.filter((s) => s.categorie === "diverse")} onSelectSong={setSelectedSong} onSubmit={() => navigate("soumettre")} onBack={() => navigate("home")}/>;
//    if (page === "favorites") return <FavoritesPage songs={songs} favorites={favorites} onSelectSong={setSelectedSong} onNavigate={navigate} />;
    if (page === "playlists") return (
      <PlaylistsPage songs={songs} playlists={playlists}
        onAddPlaylist={(name) => setPlaylists((p) => [...p, { name, songIds: [] }])}
        onDeletePlaylist={(i) => setPlaylists((p) => p.filter((_, idx) => idx !== i))}
        onSelectPlaylist={setSelectedPlaylistIdx} selectedPlaylist={selectedPlaylistIdx}
        onBack={() => setSelectedPlaylistIdx(null)} onSelectSong={setSelectedSong}
        onAddSongToPlaylist={handleAddToPlaylist}
        onNavigateHome={() => navigate("home")}
        onRemoveSongFromPlaylist={handleRemoveFromPlaylist} />
    );
    if (page === "soumettre") return <SubmitPage onSubmit={handleSubmitSong} onBack={() => navigate("home")} />;
    if (page === "admin")     return <AdminPage songs={songs} onApprove={handleApprove} onRejectWithEmail={handleRejectWithEmail} onEdit={(s) => setEditingSong(s)} onBack={() => navigate("home")} />;
    if (page === "compte")    return <AccountPage isAdmin={isAdmin} adminPwd={ADMIN_PASSWORD} onToggleAdmin={(v) => setIsAdmin(v)} onBack={() => navigate("home")} settings={settings} onUpdateSettings={setSettings} />;
    if (page === "reglages")  return <SettingsPage settings={settings} onUpdate={setSettings} onBack={() => navigate("home")} />;
    return <HomePage onNavigate={navigate} />;
  };

  // Ajouté avec claude etape F
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🏕️</Text>
        <Text style={{ color: '#e8f5e9', fontSize: 16, fontWeight: '500' }}>Chant-EEIF</Text>
        <Text style={{ color: '#a5d6a7', fontSize: 13, marginTop: 8 }}>Chargement des chansons…</Text>
      </View>
    );
  }

  return (
    <SettingsCtx.Provider value={settings}>
      <View style={{ flex: 1, backgroundColor: C.lightBg }}>
        {/* STATUS BAR SPACER */}
        <View style={{ height: Platform.OS === "ios" ? 50 : 24, backgroundColor: C.primary }} />
        {/* HEADER */}
        <View style={{ backgroundColor: C.primary, flexDirection: "row", alignItems: "center",
                       paddingHorizontal: 12, paddingVertical: 12, gap: 10 }}>
          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={{ padding: 6 }}>
            <Text style={{ color: "#e8f5e9", fontSize: 22, lineHeight: 22 }}>☰</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigate("home")} style={{ flex: 1 }}>
            <Text style={{ color: "#e8f5e9", fontSize: 17, fontWeight: "600", letterSpacing: 0.3 }}>🏠 Chant-EEIF</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            {isAdmin && pendingCount > 0 && (
              <TouchableOpacity onPress={() => navigate("admin")}
                style={{ backgroundColor: "rgba(255,200,0,0.25)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                <Text style={{ color: "#ffe082", fontSize: 12, fontWeight: "500" }}>⚠️ {pendingCount}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => navigate("reglages")}
              style={{ backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ color: "#e8f5e9", fontSize: 13 }}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigate("compte")}
              style={{ backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ color: "#e8f5e9", fontSize: 13 }}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CONTENT */}
        <View style={{ flex: 1 }}>
          {renderContent()}
        </View>

        {/* DRAWER */}
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
          page={page} onNavigate={navigate} isAdmin={isAdmin} pendingCount={pendingCount} />

        {/* TOAST */}
        <Toast msg={toast} />
      </View>
    </SettingsCtx.Provider>
  );
}
