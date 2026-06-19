// ─── GROUPES LOCAUX ──────────────────────────────────────────────────────────
// Pour ajouter une image PNG à un GL :
// 1. Place le fichier dans assets/images/gl/ID_DU_GL.png  (ex: ASA.png)
// 2. Importe-le : import ASA from '../../assets/images/gl/ASA.png';
// 3. Ajoute-le dans GL_IMAGES ci-dessous : ASA: ASA,
// 4. Retire l'emoji du GL correspondant (laisse emoji: "" ou supprime le champ)

// Users/davidbenichou/chant-eeif/assets/images/gl/boulogne.jpg
// Exemple d'import d'image (décommente et adapte) :
// import ASAimg from '../../assets/images/gl/ASA.png';
// export const GL_IMAGES: Record<string, any> = { ASA: ASAimg };
import adm from '../../chant-eeif/assets/images/gl/aix.jpg';
import asa from '../../chant-eeif/assets/images/gl/asa.jpg';
import lbc from '../../chant-eeif/assets/images/gl/barcokhba.png';
import bdx from '../../chant-eeif/assets/images/gl/bordeaux.png';
import hsb from '../../chant-eeif/assets/images/gl/boulogne.jpg';
import bjk from '../../chant-eeif/assets/images/gl/buffault.jpg';
import can from '../../chant-eeif/assets/images/gl/canne.png';
import cmba from '../../chant-eeif/assets/images/gl/colmar.png';
import cpdg from '../../chant-eeif/assets/images/gl/copernic.png';
import csb from '../../chant-eeif/assets/images/gl/courbevoie.png';
import pdv from '../../chant-eeif/assets/images/gl/dorvador.png';
import dmm from '../../chant-eeif/assets/images/gl/dufrenoy.png';
import pef from '../../chant-eeif/assets/images/gl/edmond.jpg';
import pgm from '../../chant-eeif/assets/images/gl/golda.png';
import gmc from '../../chant-eeif/assets/images/gl/grenoble.jpeg';
import ira from '../../chant-eeif/assets/images/gl/israel.png';
import irc from '../../chant-eeif/assets/images/gl/issy.jpg';
import slgk from '../../chant-eeif/assets/images/gl/koumi.jpeg';
import rda from '../../chant-eeif/assets/images/gl/laroquette.png';
import vjpb from '../../chant-eeif/assets/images/gl/lavictoire.png';
import lrw from '../../chant-eeif/assets/images/gl/lille.png';
import lsv from '../../chant-eeif/assets/images/gl/londre.jpg';
import lma from '../../chant-eeif/assets/images/gl/lyon.jpg';
import mrg from '../../chant-eeif/assets/images/gl/marseille.png';
import mmc from '../../chant-eeif/assets/images/gl/montpellier.png';
import nml from '../../chant-eeif/assets/images/gl/nancy.png';
import nby from '../../chant-eeif/assets/images/gl/nice.png';
import nlk from '../../chant-eeif/assets/images/gl/nlk.jpg';
import npxv from '../../chant-eeif/assets/images/gl/noam.png';
import njcr from '../../chant-eeif/assets/images/gl/nrose.png';
import njcv from '../../chant-eeif/assets/images/gl/nvert.png';
import slgo from '../../chant-eeif/assets/images/gl/ori.jpeg';
import lkl from '../../chant-eeif/assets/images/gl/paris12.png';
import pgl from '../../chant-eeif/assets/images/gl/paris17.png';
import psb from '../../chant-eeif/assets/images/gl/psb.jpg';
import sbmd from '../../chant-eeif/assets/images/gl/sb.jpg';
import sth from '../../chant-eeif/assets/images/gl/segur.png';
import sib from '../../chant-eeif/assets/images/gl/shemab.png';
import sin from '../../chant-eeif/assets/images/gl/sheman.png';
import sfh from '../../chant-eeif/assets/images/gl/strasbourg.jpg';
import tmd from '../../chant-eeif/assets/images/gl/toulon.jpg';
import tlb from '../../chant-eeif/assets/images/gl/toulouse.png';
import vmb from '../../chant-eeif/assets/images/gl/versailles.jpg';
import ysm from '../../chant-eeif/assets/images/gl/yona.png';

export const GL_IMAGES: Record<string, any> = {
  // ASA: require('../../assets/images/gl/ASA.png'),  ← exemple pour image1.png
  ADM:  adm,
  ASA:  asa,
  BDX:  bdx,
  HSB:  hsb,
  BJK:  bjk,
  CAN:  can,
  CMBA: cmba,
  CPDG: cpdg,
  CSB:  csb,
  DMM:  dmm,
  LBC:  lbc,
  PDV:  pdv,
  PEF:  pef,
  PGM:  pgm,
  GMC:  gmc,
  IRC:  irc,
  SLGK: slgk,
  SLGO: slgo,
  VJPB: vjpb,
  LKL:  lkl,
  LRW:  lrw,
  LSV:  lsv,
  LMA:  lma,
  MRG:  mrg,
  NML:  nml,
  MMC:  mmc,
  NJCV: njcv,
  NJCR: njcr,
  NLK:  nlk,
  NBY:  nby,
  NPXV: npxv,
  RDA:  rda,
  PGL:  pgl,
  PSB:  psb,
  SBMD: sbmd,
  STH:  sth,
  SIB:  sib,
  SIN:  sin,
  SFH:  sfh,
  TMD:  tmd,
  TLB:  tlb,
  VMB:  vmb,
  YSM:  ysm,
  IRA:  ira
};

export type GroupeLocal = {
  id: string;
  nom: string;
  figure: string;
  ville: string;
  region: string;
//  region: "paris" | "idf" | "province" | "international";
  emoji: string;
};

export const GROUPES_LOCAUX: GroupeLocal[] = [
  { id: "ASA",  nom: "Antony",               figure: "Shlomo Hamelekh",    ville: "Antony",                region: "idf",           emoji: GL_IMAGES.ASA },
  { id: "HSB",  nom: "Boulogne",             figure: "Henri Schili",       ville: "Boulogne-Billancourt",  region: "idf",           emoji: GL_IMAGES.HSB },
  { id: "ADM",  nom: "Aix en Provence",      figure: "Darius Milhaud",     ville: "Aix en Provence",       region: "province",      emoji: GL_IMAGES.ADM },
  { id: "BDX",  nom: "Bordeaux",             figure: "Cohav",              ville: "Bordeaux",              region: "province",      emoji: GL_IMAGES.BDX },
  { id: "BJK",  nom: "Buffault",             figure: "Janusz Korczak",     ville: "Paris 9",               region: "paris",         emoji: GL_IMAGES.BJK },
  { id: "CAN",  nom: "Cannes",               figure: "André Neher",        ville: "Cannes",                region: "province",      emoji: GL_IMAGES.CAN },
  { id: "CMBA", nom: "Colmar Mulhouse",      figure: "Buisson ardent",     ville: "Colmar Mulhouse",       region: "province",      emoji: GL_IMAGES.CMBA },
  { id: "CPDG", nom: "Copernic",             figure: "Pivert - D. Gamzon", ville: "Paris 16",              region: "paris",         emoji: GL_IMAGES.CPDG },
  { id: "CSB",  nom: "Courbevoie",           figure: "Shatta et Bouli",    ville: "Courbevoie",            region: "idf",           emoji: GL_IMAGES.CSB },
  { id: "DMM",  nom: "Dufrenoy",             figure: "Moses Montefiore",   ville: "Paris 16",              region: "paris",         emoji: GL_IMAGES.DMM },
  { id: "LBC",  nom: "Barcokhba",            figure: "Bar Kohba",          ville: "Levallois-Perret",      region: "idf",           emoji: GL_IMAGES.LBC },
  { id: "PDV",  nom: "Dor Vador",            figure: "Dor Vador",          ville: "Paris 20",              region: "paris",         emoji: GL_IMAGES.PDV },
  { id: "PEF",  nom: "Paris 5/6",            figure: "Edmond Fleg",        ville: "Paris 5/6",             region: "paris",         emoji: GL_IMAGES.PEF },
  { id: "PGM",  nom: "Golda",                figure: "Golda Meir",         ville: "Paris 15",              region: "paris",         emoji: GL_IMAGES.PGM },
  { id: "GMC",  nom: "Grenoble",             figure: "Marc Chagall",       ville: "Grenoble",              region: "province",      emoji: GL_IMAGES.GMC },
  { id: "IRC",  nom: "Issy",                 figure: "René Cassin",        ville: "Issy-les-Moulineaux",   region: "idf",           emoji: GL_IMAGES.IRC },
  { id: "SLGK", nom: "Koumi SLG",            figure: "Shoshana Loup Gris", ville: "Vincennes",             region: "idf",           emoji: GL_IMAGES.SLGK },
  { id: "SLGO", nom: "Ori SLG",              figure: "Shoshana Loup Gris", ville: "Vincennes",             region: "idf",           emoji: GL_IMAGES.SLGO },
  { id: "VJPB", nom: "La victoire",          figure: "JP et Paulette Bader",ville: "Paris 9",              region: "paris",         emoji: GL_IMAGES.VJPB },
  { id: "LKL",  nom: "Paris 12",             figure: "Liliane Klein Lieber",ville: "Paris 12",             region: "paris",         emoji: GL_IMAGES.LKL },
  { id: "LRW",  nom: "Lille",                figure: "Raymond Winter",     ville: "Lille",                 region: "province",      emoji: GL_IMAGES.LRW },
  { id: "LSV",  nom: "Londres",              figure: "Simone Veil",        ville: "Londres",               region: "international", emoji: GL_IMAGES.LSV },
  { id: "LMA",  nom: "Lyon",                 figure: "Mordechaï Anielewicz",ville: "Lyon",                 region: "province",      emoji: GL_IMAGES.LMA },
  { id: "MRG",  nom: "Marseille",            figure: "Robert Gamzon",      ville: "Marseille",             region: "province",      emoji: GL_IMAGES.MRG },
  { id: "NML",  nom: "Nancy",                figure: "Young Perez",        ville: "Nancy Metz Luxembourg", region: "province",      emoji: GL_IMAGES.NML },
  { id: "MMC",  nom: "Montpellier",          figure: "Marianne Cohn",      ville: "Montpellier",           region: "province",      emoji: GL_IMAGES.MMC },
  { id: "NJCV", nom: "Neuilly Vert",         figure: "Jerome Cahen",       ville: "Neuilly-Sur-Seine",     region: "idf",           emoji: GL_IMAGES.NJCV },
  { id: "NJCR", nom: "Neuilly Rose",         figure: "Jerome Cahen",       ville: "Neuilly-Sur-Seine",     region: "idf",           emoji: GL_IMAGES.NJCR },
  { id: "NLK",  nom: "Neuilly NLK",          figure: "Laurent Kern",       ville: "Neuilly-Sur-Seine",     region: "idf",           emoji: GL_IMAGES.NLK },
  { id: "NBY",  nom: "Nice",                 figure: "Ben Yehouda",        ville: "Nice",                  region: "province",      emoji: GL_IMAGES.NBY },
  { id: "NPXV", nom: "Noam",                 figure: "Noam",               ville: "Paris 15",              region: "paris",         emoji: GL_IMAGES.NPXV },
  { id: "RDA",  nom: "La Roquette",          figure: "Don Abravanel",      ville: "Paris 9",               region: "paris",         emoji: GL_IMAGES.RDA },
  { id: "PGL",  nom: "PGL",                  figure: "Georges Loinger",    ville: "Paris 17",              region: "paris",         emoji: GL_IMAGES.PGL },
  { id: "PSB",  nom: "Pavillon Sous Bois",   figure: "Irena Sandler",      ville: "Pavillon-Sous-Bois",    region: "idf",           emoji: GL_IMAGES.PSB },
  { id: "SBMD", nom: "Saint-Brice District", figure: "Moshe Dayan",       ville: "Saint-Brice-Sous-Foret", region: "idf",           emoji: GL_IMAGES.SBMD },
  { id: "STH",  nom: "Ségur",                figure: "Théodore Herzl",     ville: "Paris 7",               region: "paris",         emoji: GL_IMAGES.STH },
  { id: "SIB",  nom: "Shema Bleu",           figure: "Shema Israël",       ville: "Paris 4",               region: "paris",         emoji: GL_IMAGES.SIB },
  { id: "SIN",  nom: "Shema Noir",           figure: "Shema Israël",       ville: "Paris 4",               region: "paris",         emoji: GL_IMAGES.SIN },
  { id: "SFH",  nom: "Strasbourg",           figure: "Frederic Hammel",    ville: "Strasbourg",            region: "province",      emoji: GL_IMAGES.SFH },
  { id: "TMD",  nom: "Toulon",               figure: "Maguen David",       ville: "Toulon",                region: "province",      emoji: GL_IMAGES.TMD },
  { id: "TLB",  nom: "Toulouse",             figure: "Lazare Brousse",     ville: "Toulouse",              region: "province",      emoji: GL_IMAGES.TLB },
  { id: "VMB",  nom: "Versailles",           figure: "Martin Buber",       ville: "Versailles",            region: "idf",           emoji: GL_IMAGES.VMB },
  { id: "YSM",  nom: "Saint Maur",           figure: "Yona",               ville: "Saint-Maur",            region: "idf",           emoji: GL_IMAGES.YSM },
  { id: "IRA",  nom: "Israël",               figure: "Ron Arad",           ville: "Israël",                region: "international", emoji: GL_IMAGES.IRA }
].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

export const REGIONS: Record<string, string> = {
  paris:         "Paris",
  idf:           "Île-de-France (hors Paris)",
  province:      "Province",
  international: "International",
};
