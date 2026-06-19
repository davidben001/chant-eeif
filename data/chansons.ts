// ─── CHANSONS ────────────────────────────────────────────────────────────────
// Toutes les chansons de l'application sont stockées ici.
// Pour ajouter une chanson, copie un bloc existant et modifie les valeurs.
// statut: "approuvé" = visible, "en_attente" = en attente de validation admin

export type Vers = {
  type: "couplet" | "refrain" | "pré-refrain" | "pont" | "intro" | "outro";
  numero?: number;
  paroles: string;
  accords?: string; // accords spécifiques à cette partie (optionnel)
  multiplicateur?: string;
};

export type Chanson = {
  id: string;
  titre: string;
  categorie: "eeif" | "diverse";
  isGL: boolean;
  glId?: string;
  glNom?: string;
  glIds?: string[];
  glNoms?: string[];
  isCamp: boolean;
  typeCamp?: "BC" | "BM" | "BP";
  annéeCamp?: string;
  nomCamp?: string;
  texte: Vers[];
  accords?: string | null;   // accords globaux de la chanson
  rythme?: string | null;
  auteur?: string | null;
  airDe?: string | null;
  note?: string | null;
  lien?: string | null;
  statut: "approuvé" | "en_attente";
  soumisParNom: string;
  soumisParEmail?: string;
  dateAjout: string;
};

export type Remarque = {
  id: string;
  chansonId: string;
  type: "correction" | "accords" | "paroles" | "autre";
  contenu: string;
  soumisParNom: string;
  soumisParEmail?: string;
  dateAjout: string;
  statut: "en_attente" | "traitée";
};

export const CHANSONS_INITIALES: Chanson[] = [
  //{
  //  id: "s1",
  //  titre: "BM - Léa est en 5e au college",
  //  categorie: "eeif",
  //  isGL: false,
  //  isCamp: false,
  //  texte: [
  //    {
  //      type: "couplet",
  //      numero: 1,
  //      paroles: "Léa est en 5ème au collège\nElle s’ennuie le dimanche dans son lit\nBien sûr elle a son cours de solfège\nMais elle voudrait rencontrer des amis\n\nDepuis qu’on lui parle des EEIF\nMichael l’emmène à une sortie\nElle avait prévu son repas froid\nMais la houltsa elle connaissait pas !!",
  //      accords: "",
  //    },
  //    {
  //      type: "refrain",
  //      paroles: "Bienvenue dans la branche moyenne\nSuis la boussole pour qu’elle t’emmène\nChacun son chemin\nL’Azimut te tends la main",
  //      accords: "",
  //    },
  //    {
  //      type: "couplet",
  //      numero: 2,
  //      paroles: "Le soleil s’est levé sur le camp\nLéa est la zadeck des chameaux\nOn doit réveiller tous les enfants,\nCe matin c’est le départ d’explo.\n\nEnsemble ils ont monté un projet,\nEnsemble l’équipe a su progresser,\nLéa fait sa promesse en chantant,\nEnsemble en BM évidemment !",
  //      accords: "",
  //    },
  //    {
  //      type: "refrain",
  //      paroles: "Bienvenue dans la branche moyenne\nSuis la boussole pour qu’elle t’emmène\nChacun son chemin\nL’Azimut te tends la main",
  //      accords: "",
  //    },
  //    {
  //      type: "couplet",
  //      numero: 3,
  //      paroles: "A 80 ans elle se souvient\nEncore du nom de tous ses éclais\nEt qu’on voulait l’appeler Marsouin\nDe l’odeur du feu de ses veillés\n\nSes petits enfants sont aux EEIF\nC’est le 120ème du mouvement\nElle va retrouver tous ses amis\nEnsemble en BM évidemment !",
  //      accords: "",
  //    },
  //    {
  //      type: "refrain",
  //      paroles: "Bienvenue dans la branche moyenne\nSuis la boussole pour qu’elle t’emmène\nChacun son chemin\nL’Azimut te tends la main",
  //      accords: "",
  //    },
  //  ],
  //  accords: "",
  //  rythme: "",
  //  auteur: null,
  //  airDe: null,
  //  note: "Ancienne chanson de la BM",
  //  lien: null,
  //  statut: "approuvé",
  //  soumisParNom: "Admin",
  //  dateAjout: "2026-06-18",
  //},
  //{
  //  id: "s2",
  //  titre: "Shir LaShalom",
  //  categorie: "eeif",
  //  isGL: false,
  //  isCamp: false,
  //  texte: [
  //    {
  //      type: "couplet",
  //      numero: 1,
  //      paroles: "Ten ta shemesh bo'ara\nAl al tistakel le'ahor\nHachziri et hanishkachot\nLa, lo titchazer lepoar",
  //      accords: "G - D - Em - C",
  //    },
  //    {
  //      type: "refrain",
  //      paroles: "Shiru shir la'shalom\nAl tilchashi tefilla\nTov tazaaki b'shir shel shalom\nAl tilchashi tefilla",
  //      accords: "G - D - Em - C",
  //    },
  //  ],
  //  accords: "G - D - Em - C",
  //  rythme: "Modéré 4/4",
  //  auteur: "Yaakov Rotblit",
  //  airDe: null,
  //  note: "Hymne à la paix, incontournable des veillées",
  //  lien: "https://www.youtube.com/watch?v=f_o-mzaxhrA",
  //  statut: "approuvé",
  //  soumisParNom: "Admin",
  //  dateAjout: "2024-01-15",
  //},
  //{
  //  id: "s3",
  //  titre: "La Chanson du Camp Kfar 2022",
  //  categorie: "eeif",
  //  isGL: true,
  //  glId: "SLGK",
  //  glNom: "Koumi SLG",
  //  isCamp: true,
  //  annéeCamp: "2022",
  //  nomCamp: "Camp Kfar",
  //  texte: [
  //    {
  //      type: "couplet",
  //      numero: 1,
  //      paroles: "On est partis le cœur léger\nSous les étoiles d'été\nAvec nos foulards bien serrés\nLa forêt nous attendait",
  //      accords: "C - Am - F - G",
  //    },
  //    {
  //      type: "refrain",
  //      paroles: "Kfar, Kfar, notre foyer d'un soir\nEtoiles au-dessus de nous\nKfar, Kfar, pour toujours le souvenir\nDu camp qui nous a tous réunis",
  //      accords: "C - G - Am - F",
  //    },
  //  ],
  //  accords: "C - Am - F - G",
  //  rythme: "Enlevé 4/4",
  //  auteur: "Maîtrise Koumi SLG",
  //  airDe: null,
  //  note: "Créée lors du camp Kfar 2022",
  //  lien: null,
  //  statut: "approuvé",
  //  soumisParNom: "Admin",
  //  dateAjout: "2024-02-10",
  //},
  //{
  //  id: "s4",
  //  titre: "Le Lion est Mort Ce Soir",
  //  categorie: "diverse",
  //  isGL: false,
  //  isCamp: false,
  //  texte: [
  //    {
  //      type: "couplet",
  //      numero: 1,
  //      paroles: "Dans la jungle, la grande jungle\nLe lion est mort ce soir",
  //      accords: "C - F - G - C",
  //    },
  //    {
  //      type: "refrain",
  //      paroles: "Oui oh wé, oui oh wé wé\nOui oh wé, oui oh wé wé",
  //      accords: "C - F - G - C",
  //    },
  //  ],
  //  accords: "C - F - G - C",
  //  rythme: "Modéré 4/4",
  //  auteur: null,
  //  airDe: null,
  //  note: "Classique de toutes les veillées scouts",
  //  lien: null,
  //  statut: "approuvé",
  //  soumisParNom: "Admin",
  //  dateAjout: "2024-01-20",
  //},
  //{
  //  id: "s5",
  //  titre: "Nouvelle Chanson en Attente",
  //  categorie: "eeif",
  //  isGL: false,
  //  isCamp: false,
  //  texte: [
  //    { type: "couplet", numero: 1, paroles: "Exemple de chanson\nEn attente de validation" },
  //  ],
  //  accords: null,
  //  rythme: null,
  //  auteur: "Utilisateur Test",
  //  soumisParEmail: "test@example.com",
  //  airDe: null,
  //  note: null,
  //  lien: null,
  //  statut: "en_attente",
  //  soumisParNom: "Utilisateur Test",
  //  dateAjout: "2024-06-01",
  //},
];
