import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Purchases, {
  LOG_LEVEL,
  type PurchasesPackage,
} from 'react-native-purchases';
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  type TextProps,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getMobileAuth } from './mobile-auth';
import {
  downloadTrackPrivately,
  getPlayableDownload,
  listPrivateDownloads,
  removePrivateDownload,
  type PrivateMobileDownload,
} from './private-downloads';

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://fwayamusic1-backend.vercel.app'
).replace(/\/+$/, '');
const SAVED_TRACKS_KEY = 'fwaya-mobile-saved-tracks';
const CATALOG_CACHE_KEY = 'fwaya-mobile-catalog-v1';
const REVENUECAT_API_KEY =
  Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
const DEFAULT_COVER =
  'https://res.cloudinary.com/dayn5vifn/image/upload/v1777062569/fwaya-01-01_xx0lgo.jpg';

const HOME_TABS: { key: HomeTab; label: string }[] = [
  { key: 'for-you', label: 'For You' },
  { key: 'local', label: 'Local' },
  { key: 'videos', label: 'Videos' },
  { key: 'new-releases', label: 'New Releases' },
  { key: 'playlists', label: 'Playlists' },
  { key: 'trending', label: 'Trending' },
  { key: 'artists', label: 'Artists' },
  { key: 'producers', label: 'Producers' },
  { key: 'albums', label: 'Albums' },
  { key: 'eps', label: 'EPs' },
  { key: 'top-charts', label: 'Top Charts' },
];

const BANNER_IMAGES = [
  require('./assets/home-banner-1.jpg'),
  require('./assets/home-banner-2.jpg'),
  require('./assets/home-banner-3.jpg'),
];

function extractItems(payload: unknown): HomeItem[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is HomeItem => item !== null && typeof item === 'object');
  }
  if (!payload || typeof payload !== 'object') return [];
  for (const key of ['data', 'artists', 'users', 'playlists', 'items']) {
    const items = (payload as Record<string, unknown>)[key];
    if (Array.isArray(items)) {
      return items.filter((item): item is HomeItem => item !== null && typeof item === 'object');
    }
  }
  return [];
}

function getFontFamily(style: TextProps['style']): string {
  const weight = StyleSheet.flatten(style)?.fontWeight;
  if (weight === '900') return 'Poppins_900Black';
  if (weight === '800') return 'Poppins_800ExtraBold';
  if (weight === '700' || weight === 'bold') return 'Poppins_700Bold';
  if (weight === '600') return 'Poppins_600SemiBold';
  if (weight === '500') return 'Poppins_500Medium';
  return 'Poppins_400Regular';
}

function Text({ style, ...props }: TextProps) {
  return <NativeText {...props} style={[{ fontFamily: getFontFamily(style) }, style]} />;
}

type Screen = 'home' | 'search' | 'saved';
type LibraryTab = 'saved' | 'downloads';
type HomeTab =
  | 'for-you'
  | 'local'
  | 'videos'
  | 'new-releases'
  | 'playlists'
  | 'trending'
  | 'artists'
  | 'producers'
  | 'albums'
  | 'eps'
  | 'top-charts';

type HomeItem = ApiMedia & {
  name?: string | null;
  displayName?: string | null;
  username?: string | null;
  producerName?: string | null;
  avatarUrl?: string | null;
  lyrics?: string | null;
  releaseType?: string | null;
  coverUrl?: string | null;
  coverPreview?: string | null;
  createdAt?: string | null;
  role?: string | null;
  isProducer?: boolean;
  mediaCount?: number | null;
};

interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  artCoverUrl: string;
  duration: number;
  genre: string;
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price: number | null;
  lyrics?: string | null;
  createdAt?: string | null;
  localDownload?: boolean;
  downloadUserId?: number;
  localExpiresAt?: string | null;
}

interface ApiMedia {
  id?: number | string;
  title?: string | null;
  artist?: string | null;
  url?: string | null;
  artCoverUrl?: string | null;
  thumbnailUrl?: string | null;
  coverArt?: string | null;
  duration?: number | null;
  genre?: string | null;
  type?: string | null;
  accessType?: string | null;
  price?: number | null;
  lyrics?: string | null;
  createdAt?: string | null;
  user?: {
    displayName?: string | null;
    username?: string | null;
  } | null;
}

interface MobileAccount {
  id: number;
  email: string;
  isPremium: boolean;
  premiumUntil: string | null;
}

function normalizeTrack(media: ApiMedia): Track | null {
  if (media.id === undefined || !media.title?.trim() || !media.url?.trim()) {
    return null;
  }

  const normalizedAccessType = media.accessType?.toUpperCase();
  const accessType: Track['accessType'] =
    normalizedAccessType === 'PREMIUM' || normalizedAccessType === 'PAY_PER_VIEW'
      ? normalizedAccessType
      : normalizedAccessType === 'FREE'
        ? 'FREE'
        : 'PAY_PER_VIEW';

  return {
    id: String(media.id),
    title: media.title.trim(),
    artist:
      media.artist?.trim() ||
      media.user?.displayName?.trim() ||
      media.user?.username?.trim() ||
      'Fwaya artist',
    url: media.url.trim(),
    artCoverUrl: media.artCoverUrl || media.thumbnailUrl || media.coverArt || DEFAULT_COVER,
    duration: Math.max(0, Number(media.duration) || 0),
    genre: media.genre?.trim() || 'Music',
    accessType,
    price: media.price === null || media.price === undefined ? null : Number(media.price),
    lyrics: media.lyrics || null,
    createdAt: media.createdAt || null,
  };
}

function asDownloadedTrack(download: PrivateMobileDownload): Track {
  return {
    id: download.mediaId,
    title: download.title,
    artist: download.artist,
    url: download.fileUri,
    artCoverUrl: download.artCoverUrl,
    duration: download.duration,
    genre: download.genre,
    accessType: download.accessType,
    price: download.price,
    localDownload: true,
    downloadUserId: download.userId,
    localExpiresAt: download.expiresAt,
  };
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function formatSubscriptionPeriod(period: string | null): string {
  if (!period) return 'subscription period';
  const match = /^P(\d+)(D|W|M|Y)$/.exec(period);
  if (!match) return 'subscription period';
  const count = Number(match[1]);
  const unit = { D: 'day', W: 'week', M: 'month', Y: 'year' }[match[2] as 'D' | 'W' | 'M' | 'Y'];
  return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });
  const { width: windowWidth } = useWindowDimensions();
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);
  const [screen, setScreen] = useState<Screen>('home');
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('saved');
  const [homeTab, setHomeTab] = useState<HomeTab>('for-you');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [downloadedTracks, setDownloadedTracks] = useState<PrivateMobileDownload[]>([]);
  const [downloadBusyTrackId, setDownloadBusyTrackId] = useState<string | null>(null);
  const [downloadsLoading, setDownloadsLoading] = useState(false);
  const [localTracksLoading, setLocalTracksLoading] = useState(false);
  const [localPermissionDenied, setLocalPermissionDenied] = useState(false);
  const [homeSections, setHomeSections] = useState<Record<string, HomeItem[]>>({});
  const [homeError, setHomeError] = useState<string | null>(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [savedTrackIds, setSavedTrackIds] = useState<string[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queueTracks, setQueueTracks] = useState<Track[]>([]);
  const [playerPanel, setPlayerPanel] = useState<'queue' | 'lyrics'>('queue');
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);
  const [accountOpen, setAccountOpen] = useState(false);
  const [account, setAccount] = useState<MobileAccount | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authConfigError, setAuthConfigError] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [purchasesConfigured, setPurchasesConfigured] = useState(false);
  const [premiumPackages, setPremiumPackages] = useState<PurchasesPackage[]>([]);
  const [purchasesBusy, setPurchasesBusy] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [purchasesError, setPurchasesError] = useState<string | null>(null);
  const revenueCatUserId = useRef<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInError, setSignInError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [savedTracksReady, setSavedTracksReady] = useState(false);
  const bannerRef = useRef<ScrollView>(null);

  const loadAccount = useCallback(async (firebaseUser: FirebaseUser) => {
    setAccountLoading(true);
    setAccountError(null);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/mobile/me`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          payload && typeof payload === 'object' && 'message' in payload &&
          typeof payload.message === 'string'
            ? payload.message
            : `Could not load your account (${response.status}).`;
        throw new Error(message);
      }
      if (
        !payload ||
        typeof payload !== 'object' ||
        !('id' in payload) ||
        typeof payload.id !== 'number' ||
        !('email' in payload) ||
        typeof payload.email !== 'string' ||
        !('isPremium' in payload) ||
        typeof payload.isPremium !== 'boolean'
      ) {
        throw new Error('The account service returned an unexpected profile.');
      }
      const profile: MobileAccount = {
        id: payload.id,
        email: payload.email,
        isPremium: payload.isPremium,
        premiumUntil:
          'premiumUntil' in payload && typeof payload.premiumUntil === 'string'
            ? payload.premiumUntil
            : null,
      };
      setAccount(profile);
      return profile;
    } catch (error) {
      console.error('Unable to load mobile account:', error);
      setAccount(null);
      setAccountError(
        error instanceof Error ? error.message : 'Could not load your account.'
      );
      return null;
    } finally {
      setAccountLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      return onAuthStateChanged(getMobileAuth(), (firebaseUser) => {
        setAuthReady(true);
        if (firebaseUser) {
          void loadAccount(firebaseUser);
        } else {
          setAccount(null);
          setAccountError(null);
          setAccountLoading(false);
        }
      });
    } catch (error) {
      console.error('Mobile sign-in configuration error:', error);
      setAuthConfigError(
        error instanceof Error ? error.message : 'Sign-in is not configured.'
      );
      setAuthReady(true);
      return undefined;
    }
  }, [loadAccount]);

  const loadPremiumPackages = useCallback(async () => {
    if (!purchasesConfigured) return;
    try {
      const offerings = await Purchases.getOfferings();
      setPremiumPackages(offerings.current?.availablePackages ?? []);
      if (!offerings.current) {
        setPurchasesError('Premium plans are not available right now.');
      }
    } catch (error) {
      console.error('Unable to load store offerings:', error);
      setPremiumPackages([]);
      setPurchasesError(
        error instanceof Error ? error.message : 'Could not load Premium plans.'
      );
    }
  }, [purchasesConfigured]);

  const syncPremiumEntitlement = useCallback(async () => {
    const firebaseUser = getMobileAuth().currentUser;
    if (!firebaseUser) throw new Error('Sign in to verify your Premium purchase.');

    const token = await firebaseUser.getIdToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/subscriptions/mobile/sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload && typeof payload === 'object' && 'message' in payload &&
        typeof payload.message === 'string'
          ? payload.message
          : `Premium verification failed (${response.status}).`;
      throw new Error(message);
    }
    if (
      !payload ||
      typeof payload !== 'object' ||
      !('isPremium' in payload) ||
      typeof payload.isPremium !== 'boolean' ||
      !('premiumUntil' in payload) ||
      (payload.premiumUntil !== null && typeof payload.premiumUntil !== 'string')
    ) {
      throw new Error('The subscription service returned an unexpected response.');
    }

    const isPremium = payload.isPremium;
    const premiumUntil = payload.premiumUntil;
    setAccount((current) =>
      current
        ? {
            ...current,
            isPremium,
            premiumUntil,
          }
        : current
    );
    setPurchasesError(null);
    return isPremium;
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setPurchasesError('In-app purchases are available in the iOS and Android apps.');
      return;
    }
    if (!REVENUECAT_API_KEY) {
      setPurchasesError('Store purchases are not configured for this build yet.');
      return;
    }

    try {
      void Purchases.setLogLevel(LOG_LEVEL.ERROR);
      Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      setPurchasesConfigured(true);
    } catch (error) {
      console.error('RevenueCat could not be configured:', error);
      setPurchasesError('Store purchases could not be initialized on this device.');
    }
  }, []);

  useEffect(() => {
    if (!purchasesConfigured) return;

    let cancelled = false;
    const identifyCustomer = async () => {
      try {
        if (!account) {
          if (revenueCatUserId.current) {
            await Purchases.logOut();
            revenueCatUserId.current = null;
          }
          return;
        }

        const appUserId = String(account.id);
        if (revenueCatUserId.current !== appUserId) {
          await Purchases.logIn(appUserId);
          revenueCatUserId.current = appUserId;
        }
        await loadPremiumPackages();
        await syncPremiumEntitlement();
      } catch (error) {
        if (cancelled) return;
        console.error('Could not sync mobile store entitlements:', error);
        setPurchasesError(
          error instanceof Error ? error.message : 'Could not verify Premium access.'
        );
      }
    };

    void identifyCustomer();
    return () => {
      cancelled = true;
    };
  }, [account?.id, loadPremiumPackages, purchasesConfigured, syncPremiumEntitlement]);

  useEffect(() => {
    void loadPremiumPackages();
  }, [loadPremiumPackages]);

  const loadCatalog = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setCatalogError(null);

    let cachedTracks: Track[] = [];
    try {
      const storedCatalog = await AsyncStorage.getItem(CATALOG_CACHE_KEY);
      if (storedCatalog) {
        const parsed: unknown = JSON.parse(storedCatalog);
        if (!Array.isArray(parsed)) {
          throw new Error('Cached catalog data has an invalid format.');
        }
        cachedTracks = parsed
          .filter((item): item is ApiMedia => item !== null && typeof item === 'object')
          .map(normalizeTrack)
          .filter((track): track is Track => track !== null);
        if (cachedTracks.length > 0) setTracks(cachedTracks);
      }
    } catch (error) {
      console.error('Unable to read cached catalog:', error);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/media?type=AUDIO`);
      if (!response.ok) {
        throw new Error(`The music catalog could not be loaded (${response.status}).`);
      }

      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) {
        throw new Error('The music catalog returned an unexpected response.');
      }

      const catalog = payload
        .filter((item): item is ApiMedia => item !== null && typeof item === 'object')
        .map(normalizeTrack)
        .filter((track): track is Track => track !== null);
      setTracks(catalog);
      void AsyncStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(catalog)).catch((error: unknown) => {
        console.error('Unable to cache the music catalog:', error);
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'The music catalog could not be loaded.';
      setCatalogError(
        cachedTracks.length > 0
          ? `Offline: showing ${cachedTracks.length} saved catalog tracks. Connect to stream music or refresh the catalog.`
          : message
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const loadHomeSections = useCallback(async () => {
    setHomeError(null);
    try {
      const [homeResult, artistsResult, usersResult, playlistsResult] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/v1/media/homepage-sections`),
        fetch(`${API_BASE_URL}/api/v1/artists`),
        fetch(`${API_BASE_URL}/api/v1/users`),
        fetch(`${API_BASE_URL}/api/v1/playlist`),
      ]);
      if (homeResult.status === 'rejected') {
        throw homeResult.reason;
      }
      const homeResponse = homeResult.value;
      if (!homeResponse.ok) {
        throw new Error(`Homepage sections could not be loaded (${homeResponse.status}).`);
      }

      const homepagePayload: unknown = await homeResponse.json();
      if (!homepagePayload || typeof homepagePayload !== 'object') {
        throw new Error('Homepage sections returned an unexpected response.');
      }
      const home = homepagePayload as Record<string, unknown>;
      const readOptionalItems = async (
        name: string,
        result: PromiseSettledResult<Response>
      ): Promise<HomeItem[]> => {
        if (result.status === 'rejected') {
          console.warn(`Unable to load ${name} for the mobile home screen:`, result.reason);
          return [];
        }
        if (!result.value.ok) {
          console.warn(`${name} request failed (${result.value.status}).`);
          return [];
        }
        return extractItems(await result.value.json());
      };
      const [artists, users, playlists] = await Promise.all([
        readOptionalItems('artists', artistsResult),
        readOptionalItems('users', usersResult),
        readOptionalItems('playlists', playlistsResult),
      ]);
      const producers = users.filter((person) =>
        String(person.role || '').toUpperCase() === 'PRODUCER' ||
        person.isProducer === true ||
        Boolean(person.producerName)
      );
      const fresh = [...tracks].sort((first, second) =>
        Date.parse(second.createdAt || '') - Date.parse(first.createdAt || '')
      );

      const asItems = (key: string) =>
        Array.isArray(home[key])
          ? (home[key] as unknown[]).filter(
              (item): item is HomeItem => item !== null && typeof item === 'object'
            )
          : [];
      setHomeSections({
        quickPicks: asItems('featuredSongs'),
        trending: asItems('trendingSongs'),
        topCharts: asItems('topCharts'),
        albums: asItems('featuredAlbums'),
        eps: asItems('featuredEPs'),
        videos: asItems('musicVideos'),
        artists,
        producers,
        playlists,
        newReleases: fresh,
      });
    } catch (error) {
      console.error('Unable to load mobile home sections:', error);
      setHomeError(error instanceof Error ? error.message : 'Home sections could not be loaded.');
    }
  }, [tracks]);

  useEffect(() => {
    void loadHomeSections();
  }, [loadHomeSections]);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((index) => (index + 1) % BANNER_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    bannerRef.current?.scrollTo({ x: bannerIndex * (windowWidth - 32), animated: true });
  }, [bannerIndex, windowWidth]);

  const loadLocalTracks = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Local music unavailable', 'Device music library access is available in the installed app.');
      return;
    }

    setLocalTracksLoading(true);
    try {
      if (Platform.OS === 'ios') {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'audio/*',
          multiple: true,
          copyToCacheDirectory: true,
        });
        if (!result.canceled) {
          setLocalPermissionDenied(false);
          setLocalTracks(result.assets.map((asset) => ({
            id: `local-${asset.uri}`,
            title: asset.name.replace(/\.[^.]+$/, ''),
            artist: 'On this device',
            url: asset.uri,
            artCoverUrl: DEFAULT_COVER,
            duration: 0,
            genre: 'Local music',
            accessType: 'FREE',
            price: null,
          })));
        }
        return;
      }

      const permission = await MediaLibrary.requestPermissionsAsync(false, ['audio']);
      if (!permission.granted) {
        setLocalPermissionDenied(true);
        setLocalTracks([]);
        return;
      }

      setLocalPermissionDenied(false);
      const assets: MediaLibrary.Asset[] = [];
      let after: string | undefined;
      let hasNextPage = true;
      while (hasNextPage) {
        const page = await MediaLibrary.getAssetsAsync({
          first: 100,
          after,
          mediaType: 'audio',
          sortBy: [MediaLibrary.SortBy.creationTime],
        });
        assets.push(...page.assets);
        hasNextPage = page.hasNextPage;
        after = page.endCursor;
      }

      setLocalTracks(assets.map((asset) => ({
        id: `local-${asset.id}`,
        title: asset.filename.replace(/\.[^.]+$/, ''),
        artist: 'On this device',
        url: asset.uri,
        artCoverUrl: DEFAULT_COVER,
        duration: Math.max(0, asset.duration),
        genre: 'Local music',
        accessType: 'FREE',
        price: null,
      })));
    } catch (error) {
      console.error('Unable to read local music library:', error);
      Alert.alert(
        'Could not read local music',
        error instanceof Error ? error.message : 'Try again after checking media permissions.'
      );
    } finally {
      setLocalTracksLoading(false);
    }
  }, []);

  const purchasePremiumPackage = useCallback(
    async (packageToPurchase: PurchasesPackage) => {
      if (!account) {
        setPurchasesError('Sign in to link this purchase to your Fwaya account.');
        setAccountOpen(true);
        return;
      }
      if (!purchasesConfigured) {
        setPurchasesError('Store purchases are not configured for this build yet.');
        return;
      }

      setPurchasesBusy(true);
      setSelectedPackageId(packageToPurchase.identifier);
      setPurchasesError(null);
      try {
        const appUserId = String(account.id);
        if (revenueCatUserId.current !== appUserId) {
          await Purchases.logIn(appUserId);
          revenueCatUserId.current = appUserId;
        }
        await Purchases.purchasePackage(packageToPurchase);
        const isPremium = await syncPremiumEntitlement();
        if (!isPremium) {
          throw new Error(
            'The store completed the purchase, but Fwaya could not verify Premium yet. Use Restore Purchases or try again.'
          );
        }
        Alert.alert('Welcome to Premium', 'Your Fwaya Premium access is active.');
      } catch (error) {
        const userCancelled =
          error !== null &&
          typeof error === 'object' &&
          'userCancelled' in error &&
          error.userCancelled === true;
        if (userCancelled) return;
        console.error('Premium purchase failed:', error);
        setPurchasesError(
          error instanceof Error ? error.message : 'The purchase could not be completed.'
        );
      } finally {
        setPurchasesBusy(false);
        setSelectedPackageId(null);
      }
    },
    [account, purchasesConfigured, syncPremiumEntitlement]
  );

  const restorePremiumPurchases = useCallback(async () => {
    if (!account) {
      setPurchasesError('Sign in to restore purchases to your Fwaya account.');
      setAccountOpen(true);
      return;
    }
    if (!purchasesConfigured) {
      setPurchasesError('Store purchases are not configured for this build yet.');
      return;
    }

    setPurchasesBusy(true);
    setPurchasesError(null);
    try {
      const appUserId = String(account.id);
      if (revenueCatUserId.current !== appUserId) {
        await Purchases.logIn(appUserId);
        revenueCatUserId.current = appUserId;
      }
      await Purchases.restorePurchases();
      const isPremium = await syncPremiumEntitlement();
      Alert.alert(
        isPremium ? 'Purchases restored' : 'No active Premium purchase',
        isPremium
          ? 'Your Fwaya Premium access is active.'
          : 'No active Fwaya Premium subscription was found for this store account.'
      );
    } catch (error) {
      console.error('Premium restore failed:', error);
      setPurchasesError(
        error instanceof Error ? error.message : 'Purchases could not be restored.'
      );
    } finally {
      setPurchasesBusy(false);
    }
  }, [account, purchasesConfigured, syncPremiumEntitlement]);

  const openSubscriptionManagement = useCallback(async () => {
    const url =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Could not open subscription management:', error);
      Alert.alert('Subscriptions unavailable', 'Open your App Store or Play Store account to manage your plan.');
    }
  }, []);

  const openLegalPage = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Could not open legal information:', error);
      Alert.alert('Page unavailable', 'Visit fwaya.net to review this information.');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const restoreSavedTracks = async () => {
      try {
        const stored = await AsyncStorage.getItem(SAVED_TRACKS_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (
            !Array.isArray(parsed) ||
            !parsed.every((id) => typeof id === 'string')
          ) {
            throw new Error('Saved track data has an invalid format.');
          }
          if (mounted) setSavedTrackIds(parsed);
        }
      } catch (error) {
        console.error('Unable to restore saved tracks:', error);
        if (mounted) {
          Alert.alert(
            'Saved tracks unavailable',
            'Your saved tracks could not be read from this device.'
          );
        }
      } finally {
        if (mounted) setSavedTracksReady(true);
      }
    };

    void restoreSavedTracks();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!account) {
      setDownloadedTracks([]);
      return () => {
        mounted = false;
      };
    }

    setDownloadsLoading(true);
    void listPrivateDownloads(account.id)
      .then((items) => {
        if (mounted) setDownloadedTracks(items);
      })
      .catch((error: unknown) => {
        console.error('Unable to load private downloads:', error);
        if (mounted) {
          Alert.alert(
            'Downloads unavailable',
            error instanceof Error ? error.message : 'Saved downloads could not be read.'
          );
        }
      })
      .finally(() => {
        if (mounted) setDownloadsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [account]);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch((error: unknown) => {
      console.error('Unable to configure audio playback:', error);
      setPlaybackError('Audio could not be configured on this device.');
    });
  }, []);

  useEffect(() => {
    if (playerStatus.error) {
      console.error('Audio player failed:', playerStatus.error);
      setPlaybackError('This track could not be played. Please try another one.');
    }
  }, [playerStatus.error]);

  const filteredTracks = useMemo(() => {
    if (screen === 'home') return [];
    if (screen === 'saved') {
      if (libraryTab === 'downloads') {
        return downloadedTracks.map(asDownloadedTrack);
      }
      return tracks.filter((track) => savedTrackIds.includes(track.id));
    }

    if (screen === 'search') {
      const searchTerm = query.trim().toLocaleLowerCase();
      if (!searchTerm) return tracks;
      return tracks.filter((track) =>
        [track.title, track.artist, track.genre]
          .join(' ')
          .toLocaleLowerCase()
          .includes(searchTerm)
      );
    }

    return tracks;
  }, [downloadedTracks, libraryTab, query, savedTrackIds, screen, tracks]);

  const toggleSavedTrack = useCallback(
    async (track: Track) => {
      if (!savedTracksReady) return;

      const nextIds = savedTrackIds.includes(track.id)
        ? savedTrackIds.filter((id) => id !== track.id)
        : [...savedTrackIds, track.id];
      setSavedTrackIds(nextIds);

      try {
        await AsyncStorage.setItem(SAVED_TRACKS_KEY, JSON.stringify(nextIds));
      } catch (error) {
        console.error('Unable to save track list:', error);
        setSavedTrackIds(savedTrackIds);
        Alert.alert('Could not save track', 'Please try saving this track again.');
      }
    },
    [savedTrackIds, savedTracksReady]
  );

  const downloadTrack = useCallback(async (track: Track) => {
    if (!account) {
      Alert.alert(
        'Create a Fwaya account',
        'Sign up or sign in to save tracks to your private Fwaya downloads.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Create account', onPress: () => void Linking.openURL('https://fwaya.net/auth/user/signup') },
          { text: 'Sign in', onPress: () => setAccountOpen(true) },
        ]
      );
      return;
    }

    setDownloadBusyTrackId(track.id);
    try {
      const firebaseUser = getMobileAuth().currentUser;
      if (!firebaseUser) {
        setAccount(null);
        setAccountOpen(true);
        throw new Error('Sign in to your Fwaya account before downloading.');
      }
      const token = await firebaseUser.getIdToken();
      const download = await downloadTrackPrivately(
        {
          id: track.id,
          mediaId: track.id,
          userId: account.id,
          title: track.title,
          artist: track.artist,
          url: track.url,
          artCoverUrl: track.artCoverUrl,
          duration: track.duration,
          genre: track.genre,
          accessType: track.accessType,
          price: track.price,
        },
        token,
        API_BASE_URL
      );
      setDownloadedTracks((existing) => [
        ...existing.filter((item) => item.mediaId !== download.mediaId),
        download,
      ]);
      Alert.alert(
        'Saved to Fwaya Downloads',
        download.encrypted
          ? 'This protected track is encrypted for this device and cannot be played from a copy on another device.'
          : 'This free track is saved in Fwaya’s private app storage, not the public Music or Downloads folder.'
      );
    } catch (error) {
      console.error('Private track download failed:', error);
      Alert.alert(
        'Download failed',
        error instanceof Error ? error.message : 'The track could not be saved.'
      );
    } finally {
      setDownloadBusyTrackId(null);
    }
  }, [account]);

  const deleteDownload = useCallback(async (mediaId: string) => {
    if (!account) return;
    try {
      await removePrivateDownload(account.id, mediaId);
      setDownloadedTracks((existing) => existing.filter((item) => item.mediaId !== mediaId));
    } catch (error) {
      console.error('Could not delete private download:', error);
      Alert.alert('Could not delete download', error instanceof Error ? error.message : 'Try again.');
    }
  }, [account]);

  const playTrack = useCallback(
    async (track: Track, queueOverride?: Track[]) => {
      if (track.localDownload) {
        const savedDownload = downloadedTracks.find(
          (item) => item.mediaId === track.id && item.userId === account?.id
        );
        if (!savedDownload) {
          Alert.alert('Download unavailable', 'This download is not available for the signed-in Fwaya account.');
          return;
        }
        try {
          setPlaybackError(null);
          const playableUri = await getPlayableDownload(savedDownload);
          player.replace({ uri: playableUri });
          player.setActiveForLockScreen(true, {
            title: savedDownload.title,
            artist: savedDownload.artist,
            albumTitle: 'Fwaya Downloads',
            artworkUrl: savedDownload.artCoverUrl,
          });
          player.play();
          const playableTrack = { ...track, url: playableUri };
          setCurrentTrack(playableTrack);
          setQueueTracks(queueOverride ?? downloadedTracks.map(asDownloadedTrack));
        } catch (error) {
          console.error('Unable to play a private download:', error);
          Alert.alert(
            'Download cannot be played',
            error instanceof Error ? error.message : 'This private download is unavailable.'
          );
        }
        return;
      }

      if (track.accessType === 'PREMIUM' && !account?.isPremium) {
        if (!account) {
          Alert.alert('Sign in for Premium', 'Sign in to check your Fwaya Premium access.', [
            { text: 'Not now', style: 'cancel' },
            { text: 'Sign in', onPress: () => setAccountOpen(true) },
          ]);
        } else {
          setAccountOpen(true);
        }
        return;
      }

      try {
        setPlaybackError(null);
        let playbackUrl = track.url;
        if (track.accessType !== 'FREE') {
          const firebaseUser = getMobileAuth().currentUser;
          if (!firebaseUser) {
            if (track.accessType === 'PREMIUM') {
              setAccountOpen(true);
            } else {
              Alert.alert('Sign in required', 'Sign in to check whether you purchased this track.');
            }
            return;
          }

          const token = await firebaseUser.getIdToken();
          const response = await fetch(
            `${API_BASE_URL}/api/v1/media/${encodeURIComponent(track.id)}/playback`,
            { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
          );
          const payload: unknown = await response.json().catch(() => null);
          if (!response.ok) {
            const message =
              payload && typeof payload === 'object' && 'message' in payload &&
              typeof payload.message === 'string'
                ? payload.message
                : `Playback authorization failed (${response.status}).`;
            throw new Error(message);
          }
          if (
            !payload ||
            typeof payload !== 'object' ||
            !('url' in payload) ||
            typeof payload.url !== 'string'
          ) {
            throw new Error('The playback service returned an invalid URL.');
          }
          playbackUrl = payload.url;
        }

        player.replace({ uri: playbackUrl });
        player.setActiveForLockScreen(true, {
          title: track.title,
          artist: track.artist,
          albumTitle: 'Fwaya Music',
          artworkUrl: track.artCoverUrl,
        });
        player.play();
        setCurrentTrack(track);
        setQueueTracks(queueOverride ?? (homeTab === 'local' ? localTracks : tracks));
      } catch (error) {
        console.error('Unable to play track:', error);
        const message =
          error instanceof Error ? error.message : 'This track could not be played.';
        setPlaybackError(message);
        Alert.alert('Track unavailable', message);
      }
    },
    [account, downloadedTracks, homeTab, localTracks, player, tracks]
  );

  const submitSignIn = async () => {
    setAuthBusy(true);
    setSignInError(null);
    try {
      const credential = await signInWithEmailAndPassword(
        getMobileAuth(),
        email.trim(),
        password
      );
      const profile = await loadAccount(credential.user);
      if (profile) {
        setPassword('');
        setAccountOpen(false);
      } else {
        setSignInError('Signed in, but your Fwaya account could not be loaded. Try again.');
      }
    } catch (error) {
      console.error('Mobile sign-in failed:', error);
      setSignInError(
        error instanceof Error ? error.message : 'Sign-in failed. Check your details and try again.'
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      setSignInError('Enter your email address first.');
      return;
    }

    setAuthBusy(true);
    setSignInError(null);
    try {
      await sendPasswordResetEmail(getMobileAuth(), email.trim());
      Alert.alert('Reset email sent', 'Check your inbox for the password reset link.');
    } catch (error) {
      console.error('Mobile password reset failed:', error);
      setSignInError(
        error instanceof Error ? error.message : 'Could not send a password reset email.'
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const submitSignOut = async () => {
    setAuthBusy(true);
    try {
      await signOut(getMobileAuth());
      setAccountOpen(false);
    } catch (error) {
      console.error('Mobile sign-out failed:', error);
      Alert.alert('Could not sign out', 'Please try again.');
    } finally {
      setAuthBusy(false);
    }
  };

  const togglePlayback = useCallback(() => {
    if (!currentTrack) return;

    try {
      setPlaybackError(null);
      if (playerStatus.playing) player.pause();
      else player.play();
    } catch (error) {
      console.error('Unable to change playback state:', error);
      setPlaybackError('Playback controls are unavailable. Please try again.');
    }
  }, [currentTrack, player, playerStatus.playing]);

  const skipInQueue = useCallback((direction: -1 | 1) => {
    if (!currentTrack || queueTracks.length === 0) return;
    const currentIndex = queueTracks.findIndex((track) => track.id === currentTrack.id);
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < queueTracks.length) {
      void playTrack(queueTracks[nextIndex], queueTracks);
    }
  }, [currentTrack, playTrack, queueTracks]);

  const renderTrack = ({ item }: { item: Track }) => {
    const isCurrentTrack = currentTrack?.id === item.id;
    const isSaved = savedTrackIds.includes(item.id);
    const isDownloaded = downloadedTracks.some((download) => download.mediaId === item.id);
    const isLocked =
      !item.localDownload &&
      (item.accessType === 'PAY_PER_VIEW' ||
        (item.accessType === 'PREMIUM' && !account?.isPremium));
    const lockedLabel =
      item.accessType === 'PREMIUM'
        ? 'PREMIUM'
        : item.price !== null && Number.isFinite(item.price) && item.price > 0
          ? `$${item.price.toFixed(2)}`
          : 'BUY';

    if (screen === 'home') {
      return (
        <View style={styles.homeTrackCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${isLocked ? 'View' : 'Play'} ${item.title} by ${item.artist}`}
            onPress={() => void playTrack(item)}
            style={({ pressed }) => [styles.homeCoverButton, pressed && styles.pressed]}
          >
            <Image source={{ uri: item.artCoverUrl }} style={styles.homeCover} />
            <View style={styles.homeCoverAction}>
              <Text style={styles.homeCoverGlyph}>
                {isLocked ? lockedLabel : isCurrentTrack && playerStatus.playing ? 'Ⅱ' : '▶'}
              </Text>
            </View>
          </Pressable>
          <View style={styles.homeCardDetails}>
            <View style={styles.homeCardCopy}>
              <Text numberOfLines={1} style={[styles.trackTitle, isCurrentTrack && styles.accentText]}>
                {item.title}
              </Text>
              <Text numberOfLines={1} style={styles.trackArtist}>{item.artist}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isSaved ? `Remove ${item.title} from saved tracks` : `Save ${item.title}`}
              onPress={() => void toggleSavedTrack(item)}
              style={({ pressed }) => [styles.homeSaveButton, pressed && styles.pressed]}
            >
              <Text style={[styles.saveGlyph, isSaved && styles.accentText]}>{isSaved ? '♥' : '♡'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isDownloaded ? `${item.title} is downloaded` : `Download ${item.title} privately`}
              disabled={isDownloaded || downloadBusyTrackId === item.id}
              onPress={() => void downloadTrack(item)}
              style={({ pressed }) => [styles.homeSaveButton, pressed && styles.pressed]}
            >
              <Text style={[styles.downloadGlyph, isDownloaded && styles.accentText]}>
                {isDownloaded ? '✓' : downloadBusyTrackId === item.id ? '…' : '↓'}
              </Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.trackRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${isLocked ? 'View' : 'Play'} ${item.title} by ${item.artist}`}
          onPress={() => playTrack(item)}
          style={({ pressed }) => [styles.trackMain, pressed && styles.pressed]}
        >
          <Image source={{ uri: item.artCoverUrl }} style={styles.cover} />
          <View style={styles.trackDetails}>
            <Text numberOfLines={1} style={[styles.trackTitle, isCurrentTrack && styles.accentText]}>
              {item.title}
            </Text>
            <Text numberOfLines={1} style={styles.trackArtist}>
              {item.artist} · {item.genre}
            </Text>
          </View>
          {isLocked ? (
            <Text style={styles.lockLabel}>
              {item.accessType === 'PREMIUM' && account?.isPremium ? '▶' : lockedLabel}
            </Text>
          ) : (
            <Text style={styles.playGlyph}>{isCurrentTrack && playerStatus.playing ? 'Ⅱ' : '▶'}</Text>
          )}
        </Pressable>
        {screen === 'saved' && libraryTab === 'downloads' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete ${item.title} download from this device`}
            onPress={() => void deleteDownload(item.id)}
            style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
          >
            <Text style={styles.downloadGlyph}>×</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isSaved ? `Remove ${item.title} from saved tracks` : `Save ${item.title}`}
              onPress={() => void toggleSavedTrack(item)}
              style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
            >
              <Text style={[styles.saveGlyph, isSaved && styles.accentText]}>{isSaved ? '♥' : '♡'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isDownloaded ? `${item.title} is downloaded` : `Download ${item.title} privately`}
              disabled={isDownloaded || downloadBusyTrackId === item.id}
              onPress={() => void downloadTrack(item)}
              style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
            >
              <Text style={[styles.downloadGlyph, isDownloaded && styles.accentText]}>
                {isDownloaded ? '✓' : downloadBusyTrackId === item.id ? '…' : '↓'}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    );
  };

  const openWebSection = useCallback((path: string) => {
    void openLegalPage(`https://fwaya.net${path}`);
  }, [openLegalPage]);

  const tracksFromItems = (items: HomeItem[]) =>
    items
      .map((item) => normalizeTrack(item))
      .filter((item): item is Track => item !== null);

  const sectionData = (tab: HomeTab): HomeItem[] => {
    if (tab === 'new-releases') {
      return [...tracks]
        .sort((first, second) =>
          Date.parse(second.createdAt || '') - Date.parse(first.createdAt || '')
        )
        .map((item) => item as HomeItem);
    }
    const sectionKey: Record<Exclude<HomeTab, 'for-you' | 'local'>, string> = {
      videos: 'videos',
      'new-releases': 'newReleases',
      playlists: 'playlists',
      trending: 'trending',
      artists: 'artists',
      producers: 'producers',
      albums: 'albums',
      eps: 'eps',
      'top-charts': 'topCharts',
    };
    return homeSections[sectionKey[tab as Exclude<HomeTab, 'for-you' | 'local'>]] || [];
  };

  const sectionPaths: Record<HomeTab, string> = {
    'for-you': '/browse',
    local: '/browse',
    videos: '/videos',
    'new-releases': '/new-releases',
    playlists: '/playlist',
    trending: '/trending',
    artists: '/artists',
    producers: '/artists?role=producer',
    albums: '/albums',
    eps: '/albums?type=EP',
    'top-charts': '/top-charts',
  };

  const entityPath = (tab: HomeTab, id: string | number) => {
    const encodedId = encodeURIComponent(String(id));
    if (tab === 'producers') return `/artists/${encodedId}?role=producer`;
    if (tab === 'eps') return `/albums/${encodedId}?type=EP`;
    return `${sectionPaths[tab].split('?')[0]}/${encodedId}`;
  };

  const renderMediaRow = (title: string, tab: HomeTab, items: HomeItem[]) => {
    const mediaTracks = tracksFromItems(items);
    if (mediaTracks.length === 0) return null;
    return (
      <View key={tab} style={styles.homeSection}>
        <View style={styles.homeSectionHeading}>
          <Text style={styles.homeSectionTitle}>{title}</Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => {
              setHomeTab(tab);
              contentScrollRef.current?.scrollTo({ y: 0, animated: true });
            }}
          >
            <Text style={styles.seeAllText}>See All ›</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.homeRail}>
          {mediaTracks.map((item) => (
            <View key={item.id} style={styles.railTrackCard}>{renderTrack({ item })}</View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderEntityRow = (title: string, tab: HomeTab, items: HomeItem[]) => {
    if (items.length === 0) return null;
    return (
      <View key={tab} style={styles.homeSection}>
        <View style={styles.homeSectionHeading}>
          <Text style={styles.homeSectionTitle}>{title}</Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => {
              setHomeTab(tab);
              contentScrollRef.current?.scrollTo({ y: 0, animated: true });
            }}
          >
            <Text style={styles.seeAllText}>See All ›</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.homeRail}>
          {items.map((item, index) => {
            const name =
              item.title || item.name || item.displayName || item.producerName ||
              item.username || `Fwaya ${title.toLowerCase().replace(/s$/, '')}`;
            const image = item.avatarUrl || item.artCoverUrl || item.coverArt ||
              item.coverUrl || item.thumbnailUrl || DEFAULT_COVER;
            return (
              <Pressable
                accessibilityRole="button"
                key={String(item.id ?? `${tab}-${index}`)}
                onPress={() => openWebSection(entityPath(tab, item.id || index))}
                style={({ pressed }) => [styles.entityCard, pressed && styles.pressed]}
              >
                <Image
                  source={{ uri: image }}
                  style={[styles.entityImage, tab === 'artists' || tab === 'producers' ? styles.artistImage : null]}
                />
                <Text numberOfLines={1} style={styles.trackTitle}>{name}</Text>
                <Text numberOfLines={1} style={styles.trackArtist}>
                  {tab === 'playlists' ? `${item.mediaCount || 0} tracks` : title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderHomeSections = () => {
    if (homeTab === 'local') {
      if (localTracksLoading) {
        return <ActivityIndicator color={palette.accent} size="large" style={styles.localLoader} />;
      }
      if (localPermissionDenied) {
        return (
          <View style={styles.homeEmpty}>
            <Text style={styles.emptyTitle}>Allow access to local music</Text>
            <Text style={styles.emptyCopy}>Fwaya needs audio-library permission to show music saved on this device.</Text>
            <Pressable onPress={() => void loadLocalTracks()} style={styles.heroButton}>
              <Text style={styles.heroButtonText}>TRY AGAIN</Text>
            </Pressable>
          </View>
        );
      }
      if (localTracks.length === 0) {
        return (
          <View style={styles.homeEmpty}>
            <Text style={styles.emptyTitle}>No local audio found</Text>
            <Text style={styles.emptyCopy}>Audio files stored on this device will appear here.</Text>
            <Pressable onPress={() => void loadLocalTracks()} style={styles.heroButton}>
              <Text style={styles.heroButtonText}>SCAN DEVICE</Text>
            </Pressable>
          </View>
        );
      }
      return (
        <View style={styles.homeSection}>
          <View style={styles.homeSectionHeading}>
            <Text style={styles.homeSectionTitle}>On this device</Text>
            <Pressable onPress={() => void loadLocalTracks()}>
              <Text style={styles.seeAllText}>Refresh</Text>
            </Pressable>
          </View>
          {localTracks.map((item) => <View key={item.id}>{renderTrack({ item })}</View>)}
        </View>
      );
    }

    if (homeTab === 'for-you') {
      return (
        <>
          {renderMediaRow('Quick Picks for You', 'for-you', homeSections.quickPicks || [])}
          {renderMediaRow('Trending Now', 'trending', homeSections.trending || [])}
          {renderEntityRow('Music Videos', 'videos', homeSections.videos || [])}
          {renderEntityRow('Featured Artists', 'artists', homeSections.artists || [])}
          {renderEntityRow('Featured Producers', 'producers', homeSections.producers || [])}
          {renderEntityRow('Featured Albums', 'albums', homeSections.albums || [])}
          {renderEntityRow('Featured EPs', 'eps', homeSections.eps || [])}
          {renderMediaRow('Top Charts', 'top-charts', homeSections.topCharts || [])}
          {renderEntityRow('Playlists', 'playlists', homeSections.playlists || [])}
          {homeError && <Text style={styles.homeError}>{homeError}</Text>}
        </>
      );
    }

    const items = sectionData(homeTab);
    const trackItems = tracksFromItems(items);
    if (trackItems.length > 0) {
      return (
        <View style={styles.homeSection}>
          <Text style={styles.homeSectionTitle}>{HOME_TABS.find((tab) => tab.key === homeTab)?.label}</Text>
          <View style={styles.categoryGrid}>
            {trackItems.map((item) => <View key={item.id} style={styles.categoryCard}>{renderTrack({ item })}</View>)}
          </View>
        </View>
      );
    }

    if (homeTab === 'videos' || homeTab === 'artists' || homeTab === 'producers' ||
      homeTab === 'albums' || homeTab === 'eps' || homeTab === 'playlists') {
      return renderEntityRow(
        HOME_TABS.find((tab) => tab.key === homeTab)?.label || 'Explore',
        homeTab,
        items
      ) || (
        <View style={styles.homeEmpty}>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyCopy}>Check back soon for new Fwaya content.</Text>
        </View>
      );
    }

    return (
      <View style={styles.homeEmpty}>
        <Text style={styles.emptyTitle}>{homeError ? 'Could not load this section' : 'Nothing here yet'}</Text>
        <Text style={styles.emptyCopy}>{homeError || 'Check back soon for new Fwaya content.'}</Text>
        {homeError && <Pressable onPress={() => void loadHomeSections()} style={styles.heroButton}>
          <Text style={styles.heroButtonText}>TRY AGAIN</Text>
        </Pressable>}
      </View>
    );
  };

  const contentScrollRef = useRef<ScrollView>(null);
  const listHeader = (
    <View>
      <View style={styles.topBar}>
        <View style={styles.brandLockup}>
          <Image source={require('./assets/fwaya-01-01.jpg')} style={styles.brandMark} />
          <Text style={styles.brand}>Fwaya</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={account ? `Account: ${account.email}` : 'Sign in to your account'}
          onPress={() => {
            setSignInError(null);
            setAccountOpen(true);
          }}
          style={({ pressed }) => [styles.accountBadge, pressed && styles.pressed]}
        >
          <View style={styles.liveDot} />
          <Text numberOfLines={1} style={styles.liveText}>
            {account?.isPremium ? 'PREMIUM' : account ? 'ACCOUNT' : 'SIGN IN'}
          </Text>
        </Pressable>
      </View>

      {screen === 'home' ? (
        <>
          <ScrollView
            ref={bannerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.bannerCarousel}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
              setBannerIndex(index);
            }}
          >
            {BANNER_IMAGES.map((image, index) => (
              <Pressable
                key={index}
                onPress={() => setHomeTab(index === 2 ? 'videos' : 'for-you')}
                style={{ width: windowWidth }}
              >
                <ImageBackground source={image} resizeMode="cover" style={styles.homeBanner}>
                  <View style={styles.bannerShade} />
                  <View style={styles.bannerCopy}>
                    <Text style={styles.bannerEyebrow}>DISCOVER ON FWAYA</Text>
                    <Text style={styles.bannerTitle}>
                      {['We are Fwaya', 'New music for you', 'Watch the latest'][index]}
                    </Text>
                  </View>
                </ImageBackground>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.bannerDots}>
            {BANNER_IMAGES.map((_, index) => (
              <View key={index} style={[styles.bannerDot, index === bannerIndex && styles.activeBannerDot]} />
            ))}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.homeTabs}>
            {HOME_TABS.map(({ key, label }) => (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: homeTab === key }}
                key={key}
                onPress={() => {
                  setHomeTab(key);
                  if (key === 'local' && localTracks.length === 0 && !localTracksLoading) {
                    void loadLocalTracks();
                  }
                  contentScrollRef.current?.scrollTo({ y: 0, animated: true });
                }}
                style={[styles.homeTab, homeTab === key && styles.activeHomeTab]}
              >
                <Text style={[styles.homeTabText, homeTab === key && styles.activeHomeTabText]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {homeTab === 'for-you' ? renderHomeSections() : (
            <View style={styles.categoryContent}>
              {renderHomeSections()}
            </View>
          )}
        </>
      ) : (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>{screen === 'search' ? 'DISCOVER' : 'YOUR COLLECTION'}</Text>
          <Text style={styles.sectionTitle}>
            {screen === 'search' ? 'Search music' : libraryTab === 'downloads' ? 'Fwaya Downloads' : 'Saved tracks'}
          </Text>
          {screen === 'saved' && (
            <View style={styles.libraryTabs}>
              {([
                ['saved', 'Saved'],
                ['downloads', 'Downloads'],
              ] as const).map(([tab, label]) => (
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: libraryTab === tab }}
                  key={tab}
                  onPress={() => setLibraryTab(tab)}
                  style={[styles.libraryTab, libraryTab === tab && styles.libraryTabActive]}
                >
                  <Text style={[styles.libraryTabText, libraryTab === tab && styles.activeTabText]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {screen === 'search' && (
        <TextInput
          accessibilityLabel="Search tracks, artists, and genres"
          autoCapitalize="none"
          onChangeText={setQuery}
          placeholder="Tracks, artists, genres..."
          placeholderTextColor={palette.muted}
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
        />
      )}

    </View>
  );

  const listEmpty = (
    <View style={styles.emptyState}>
      {loading || !savedTracksReady || (screen === 'saved' && libraryTab === 'downloads' && downloadsLoading) ? (
        <ActivityIndicator color={palette.accent} size="large" />
      ) : catalogError ? (
        <>
          <Text style={styles.emptyTitle}>Can’t reach the music</Text>
          <Text style={styles.emptyCopy}>{catalogError}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadCatalog()}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          >
            <Text style={styles.retryText}>TRY AGAIN</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.emptyTitle}>
            {screen === 'saved'
              ? libraryTab === 'downloads'
                ? 'No private downloads yet'
                : 'Your collection starts here'
              : screen === 'search'
                ? 'No matches yet'
                : 'No tracks to show yet'}
          </Text>
          <Text style={styles.emptyCopy}>
            {screen === 'saved'
              ? libraryTab === 'downloads'
                ? 'Download tracks to keep them in Fwaya’s private app storage for offline playback.'
                : 'Tap the heart beside a track to save it for later.'
              : screen === 'search'
                ? 'Try another track, artist, or genre.'
                : 'Pull down to refresh the catalog.'}
          </Text>
        </>
      )}
    </View>
  );

  const premiumSection = (
    <View style={styles.premiumSection}>
      <Text style={styles.sectionEyebrow}>FWAYA PREMIUM</Text>
      <Text style={styles.premiumHeading}>
        {account?.isPremium ? 'You’re listening without limits.' : 'Go deeper with Premium.'}
      </Text>
      <Text style={styles.premiumDescription}>
        {account?.isPremium
          ? account.premiumUntil
            ? `Your access is active until ${new Date(account.premiumUntil).toLocaleDateString()}.`
            : 'Your Premium access is active.'
          : 'Unlock Premium tracks and support the artists you love.'}
      </Text>
      {!account?.isPremium &&
        premiumPackages.map((storePackage) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Subscribe to ${storePackage.product.title} for ${storePackage.product.priceString}`}
            disabled={purchasesBusy}
            key={storePackage.identifier}
            onPress={() => void purchasePremiumPackage(storePackage)}
            style={({ pressed }) => [
              styles.premiumPlan,
              pressed && styles.pressed,
              purchasesBusy && styles.disabledButton,
            ]}
          >
            <View style={styles.premiumPlanCopy}>
              <Text style={styles.premiumPlanName} numberOfLines={1}>
                {storePackage.product.title || storePackage.packageType}
              </Text>
              <Text style={styles.premiumPlanDetail} numberOfLines={1}>
                {`${storePackage.product.priceString} per ${formatSubscriptionPeriod(
                  storePackage.product.subscriptionPeriod
                )}`}
              </Text>
            </View>
            <Text style={styles.premiumPlanPrice}>
              {selectedPackageId === storePackage.identifier
                ? '…'
                : storePackage.product.priceString}
            </Text>
          </Pressable>
        ))}
      {purchasesError && (
        <Text accessibilityRole="alert" style={styles.accountError}>
          {purchasesError}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={purchasesBusy || !purchasesConfigured}
        onPress={() => void restorePremiumPurchases()}
        style={({ pressed }) => [
          styles.accountSecondaryButton,
          pressed && styles.pressed,
          (!purchasesConfigured || purchasesBusy) && styles.disabledButton,
        ]}
      >
        <Text style={styles.accountSecondaryText}>
          {purchasesBusy ? 'PLEASE WAIT…' : 'RESTORE PURCHASES'}
        </Text>
      </Pressable>
      {account?.isPremium && (
        <Pressable
          accessibilityRole="button"
          onPress={() => void openSubscriptionManagement()}
          style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
        >
          <Text style={styles.accountSecondaryText}>MANAGE SUBSCRIPTION</Text>
        </Pressable>
      )}
      <Text style={styles.purchaseDisclosure}>
        Payment is charged to your Apple or Google account at confirmation. Subscriptions renew
        automatically unless canceled at least 24 hours before the current period ends. Your store
        may charge for renewal within 24 hours before the period ends. Manage or cancel anytime in
        your store account.
      </Text>
      <View style={styles.legalLinks}>
        <Pressable
          accessibilityRole="link"
          onPress={() => void openLegalPage('https://fwaya.net/terms')}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.legalLink}>Terms of Use</Text>
        </Pressable>
        <Text style={styles.legalSeparator}>·</Text>
        <Pressable
          accessibilityRole="link"
          onPress={() => void openLegalPage('https://fwaya.net/privacy')}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </Pressable>
      </View>
    </View>
  );

  useEffect(() => {
    if (playerStatus.didJustFinish) skipInQueue(1);
  }, [playerStatus.didJustFinish, skipInQueue]);

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="light" />
          <ActivityIndicator color={palette.accent} size="large" style={styles.localLoader} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <ScrollView
          ref={contentScrollRef}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              colors={[palette.accent]}
              onRefresh={() => void loadCatalog(true)}
              refreshing={refreshing}
              tintColor={palette.accent}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {listHeader}
          {screen !== 'home' && (
            filteredTracks.length > 0
              ? filteredTracks.map((item) => <View key={item.id}>{renderTrack({ item })}</View>)
              : listEmpty
          )}
        </ScrollView>

        {catalogError && tracks.length > 0 && (
          <Text accessibilityRole="alert" style={styles.catalogNotice}>
            {catalogError}
          </Text>
        )}

        {playbackError && (
          <Text accessibilityRole="alert" style={styles.playbackError}>
            {playbackError}
          </Text>
        )}

        {currentTrack && (
          <View style={styles.playerBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open player for ${currentTrack.title}`}
              onPress={() => setNowPlayingOpen(true)}
              style={({ pressed }) => [styles.playerMain, pressed && styles.pressed]}
            >
              <Image source={{ uri: currentTrack.artCoverUrl }} style={styles.playerCover} />
              <View style={styles.playerDetails}>
                <Text numberOfLines={1} style={styles.playerTitle}>{currentTrack.title}</Text>
                <Text numberOfLines={1} style={styles.playerArtist}>{currentTrack.artist}</Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressValue,
                      {
                        width: `${
                          playerStatus.duration > 0
                            ? Math.min(100, (playerStatus.currentTime / playerStatus.duration) * 100)
                            : 0
                        }%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open play queue"
              onPress={() => {
                setPlayerPanel('queue');
                setNowPlayingOpen(true);
              }}
              style={styles.miniQueueButton}
            >
              <Text style={styles.playerControlGlyph}>☷</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={playerStatus.playing ? 'Pause track' : 'Resume track'}
              onPress={togglePlayback}
              style={({ pressed }) => [styles.playerControl, pressed && styles.pressed]}
            >
              <Text style={styles.playerControlGlyph}>{playerStatus.playing ? 'Ⅱ' : '▶'}</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.bottomNavigation}>
          {([
            ['home', 'Home', '⌂'],
            ['browse', 'Browse', '⌕'],
            ['help', 'Need Help?', '?'],
            ['library', 'Library', '♡'],
            ['more', 'More', '•••'],
          ] as const).map(([key, label, glyph]) => {
            const active =
              (key === 'home' && screen === 'home') ||
              (key === 'browse' && screen === 'search') ||
              (key === 'library' && screen === 'saved');
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={key}
                onPress={() => {
                  if (key === 'home') setScreen('home');
                  else if (key === 'browse') setScreen('search');
                  else if (key === 'library') setScreen('saved');
                  else if (key === 'more') {
                    setSignInError(null);
                    setAccountOpen(true);
                  } else {
                    Alert.alert('Need help?', 'Find answers or contact Fwaya support.', [
                      { text: 'FAQ', onPress: () => openWebSection('/help/faq') },
                      { text: 'Contact us', onPress: () => openWebSection('/help/contact') },
                      { text: 'Cancel', style: 'cancel' },
                    ]);
                  }
                }}
                style={({ pressed }) => [
                  styles.bottomNavigationItem,
                  active && styles.bottomNavigationItemActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.bottomNavigationGlyph, active && styles.bottomNavigationTextActive]}>
                  {glyph}
                </Text>
                <Text style={[styles.bottomNavigationText, active && styles.bottomNavigationTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Modal
          animationType="slide"
          onRequestClose={() => setAccountOpen(false)}
          presentationStyle="pageSheet"
          visible={accountOpen}
        >
          <SafeAreaView style={styles.accountScreen}>
            <View style={styles.accountHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close account"
                onPress={() => setAccountOpen(false)}
                style={styles.closePlayerButton}
              >
                <Text style={styles.closePlayerText}>×</Text>
              </Pressable>
              <Text style={styles.nowPlayingLabel}>YOUR ACCOUNT</Text>
              <View style={styles.closePlayerButton} />
            </View>

            {account ? (
              <ScrollView contentContainerStyle={styles.accountContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionEyebrow}>SIGNED IN</Text>
                <Text style={styles.accountEmail}>{account.email}</Text>
                <Text style={styles.accountMembership}>
                  {account.isPremium ? 'Fwaya Premium is active' : 'Free listener account'}
                </Text>
                {premiumSection}
                {accountError && (
                  <Text accessibilityRole="alert" style={styles.accountError}>
                    {accountError}
                  </Text>
                )}
                <Pressable
                  accessibilityRole="button"
                  disabled={authBusy}
                  onPress={() => void submitSignOut()}
                  style={({ pressed }) => [
                    styles.accountSecondaryButton,
                    pressed && styles.pressed,
                    authBusy && styles.disabledButton,
                  ]}
                >
                  <Text style={styles.accountSecondaryText}>
                    {authBusy ? 'PLEASE WAIT…' : 'SIGN OUT'}
                  </Text>
                </Pressable>
              </ScrollView>
            ) : (
              <ScrollView
                contentContainerStyle={styles.accountContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.sectionEyebrow}>WELCOME BACK</Text>
                <Text style={styles.sectionTitle}>Sign in to Fwaya</Text>
                <Text style={styles.emptyCopy}>
                  Use the email and password for your Fwaya account.
                </Text>
                {authConfigError && (
                  <Text accessibilityRole="alert" style={styles.accountError}>
                    {authConfigError}
                  </Text>
                )}
                {accountLoading && (
                  <ActivityIndicator color={palette.accent} style={styles.accountSpinner} />
                )}
                {accountError && !signInError && (
                  <Text accessibilityRole="alert" style={styles.accountError}>
                    {accountError}
                  </Text>
                )}
                <TextInput
                  accessibilityLabel="Email address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  editable={!authBusy}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor={palette.muted}
                  style={styles.accountInput}
                  textContentType="emailAddress"
                  value={email}
                />
                <TextInput
                  accessibilityLabel="Password"
                  autoCapitalize="none"
                  autoComplete="current-password"
                  editable={!authBusy}
                  onChangeText={setPassword}
                  onSubmitEditing={() => void submitSignIn()}
                  placeholder="Password"
                  placeholderTextColor={palette.muted}
                  returnKeyType="go"
                  secureTextEntry
                  style={styles.accountInput}
                  textContentType="password"
                  value={password}
                />
                {signInError && (
                  <Text accessibilityRole="alert" style={styles.accountError}>
                    {signInError}
                  </Text>
                )}
                <Pressable
                  accessibilityRole="button"
                  disabled={!authReady || Boolean(authConfigError) || authBusy}
                  onPress={() => void submitSignIn()}
                  style={({ pressed }) => [
                    styles.accountPrimaryButton,
                    pressed && styles.pressed,
                    (!authReady || Boolean(authConfigError) || authBusy) &&
                      styles.disabledButton,
                  ]}
                >
                  {authBusy ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.accountPrimaryText}>SIGN IN</Text>
                  )}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={authBusy || Boolean(authConfigError)}
                  onPress={() => void resetPassword()}
                  style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
                >
                  <Text style={styles.accountSecondaryText}>FORGOT PASSWORD?</Text>
                </Pressable>
                {premiumSection}
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>

        <Modal
          animationType="slide"
          onRequestClose={() => setNowPlayingOpen(false)}
          presentationStyle="pageSheet"
          visible={nowPlayingOpen && currentTrack !== null}
        >
          {currentTrack && (
            <SafeAreaView style={styles.fullPlayer}>
              <View style={styles.fullPlayerTopBar}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Minimize player"
                  onPress={() => setNowPlayingOpen(false)}
                  style={styles.closePlayerButton}
                >
                  <Text style={styles.closePlayerText}>⌄</Text>
                </Pressable>
                <Text style={styles.nowPlayingLabel}>NOW PLAYING</Text>
                <View style={styles.closePlayerButton} />
              </View>
              <View style={styles.fullCoverContainer}>
                <Image source={{ uri: currentTrack.artCoverUrl }} style={styles.fullCover} />
              </View>
              <View style={styles.visualizer} accessibilityLabel="Audio visualizer">
                {Array.from({ length: 36 }, (_, index) => {
                  const progress = playerStatus.duration > 0
                    ? playerStatus.currentTime / playerStatus.duration
                    : 0;
                  const pulse = playerStatus.playing
                    ? Math.abs(Math.sin(index * 0.77 + playerStatus.currentTime * 4))
                    : 0.15;
                  return (
                    <View
                      key={index}
                      style={[
                        styles.visualizerBar,
                        {
                          height: 5 + pulse * 28,
                          backgroundColor: index / 36 <= progress ? palette.accent : palette.surfaceRaised,
                        },
                      ]}
                    />
                  );
                })}
              </View>
              <View style={styles.fullTrackInfo}>
                <Text numberOfLines={2} style={styles.fullTrackTitle}>{currentTrack.title}</Text>
                <Text numberOfLines={1} style={styles.fullTrackArtist}>{currentTrack.artist}</Text>
                <Pressable
                  accessibilityRole="adjustable"
                  accessibilityLabel="Playback position"
                  onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width)}
                  onPress={(event) => {
                    if (!progressWidth || !playerStatus.duration) return;
                    const ratio = event.nativeEvent.locationX / progressWidth;
                    player.seekTo(Math.max(0, Math.min(1, ratio)) * playerStatus.duration);
                  }}
                  style={[styles.progressTrack, styles.fullProgressTrack]}
                >
                  <View
                    style={[
                      styles.progressValue,
                      {
                        width: `${
                          playerStatus.duration > 0
                            ? Math.min(100, (playerStatus.currentTime / playerStatus.duration) * 100)
                            : 0
                        }%`,
                      },
                    ]}
                  />
                </Pressable>
                <View style={styles.timeLabels}>
                  <Text style={styles.elapsedTime}>{formatTime(playerStatus.currentTime)}</Text>
                  <Text style={styles.elapsedTime}>{formatTime(playerStatus.duration)}</Text>
                </View>
                <View style={styles.fullPlayerControls}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Previous track"
                    disabled={!playerStatus.isLoaded}
                    onPress={() => skipInQueue(-1)}
                    style={({ pressed }) => [styles.skipControl, pressed && styles.pressed]}
                  >
                    <Text style={styles.skipLabel}>|◀</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={playerStatus.playing ? 'Pause track' : 'Resume track'}
                    onPress={togglePlayback}
                    style={({ pressed }) => [styles.fullPlayButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.fullPlayGlyph}>{playerStatus.playing ? 'Ⅱ' : '▶'}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Next track"
                    disabled={!playerStatus.isLoaded}
                    onPress={() => skipInQueue(1)}
                    style={({ pressed }) => [styles.skipControl, pressed && styles.pressed]}
                  >
                    <Text style={styles.skipLabel}>▶|</Text>
                  </Pressable>
                </View>
              </View>
              <View style={styles.playerPanelTabs}>
                {(['queue', 'lyrics'] as const).map((panel) => (
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected: playerPanel === panel }}
                    key={panel}
                    onPress={() => setPlayerPanel(panel)}
                    style={[styles.playerPanelTab, playerPanel === panel && styles.playerPanelTabActive]}
                  >
                    <Text style={[styles.playerPanelTabText, playerPanel === panel && styles.activeTabText]}>
                      {panel === 'queue' ? `UP NEXT (${queueTracks.length})` : 'LYRICS'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <ScrollView style={styles.playerPanelContent} showsVerticalScrollIndicator={false}>
                {playerPanel === 'queue' ? (
                  queueTracks.length > 0 ? queueTracks.map((track, index) => (
                    <Pressable
                      accessibilityRole="button"
                      key={track.id}
                      onPress={() => void playTrack(track, queueTracks)}
                      style={({ pressed }) => [styles.queueRow, pressed && styles.pressed]}
                    >
                      <Text style={styles.queueIndex}>{index + 1}</Text>
                      <Image source={{ uri: track.artCoverUrl }} style={styles.queueCover} />
                      <View style={styles.playerDetails}>
                        <Text numberOfLines={1} style={[styles.playerTitle, currentTrack.id === track.id && styles.activeTabText]}>
                          {track.title}
                        </Text>
                        <Text numberOfLines={1} style={styles.playerArtist}>{track.artist}</Text>
                      </View>
                      <Text style={styles.elapsedTime}>{formatTime(track.duration)}</Text>
                    </Pressable>
                  )) : (
                    <Text style={styles.emptyCopy}>Play a track to start your queue.</Text>
                  )
                ) : (
                  <View style={styles.lyricsContent}>
                    <Text style={styles.lyricsTitle}>Lyrics</Text>
                    <Text style={styles.lyricsText}>
                      {currentTrack.lyrics?.trim() ||
                        'Lyrics are not available for this track yet.'}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </SafeAreaView>
          )}
        </Modal>

        <View style={styles.bottomNavigation}>
          {([
            ['home', 'Home', '⌂'],
            ['search', 'Browse', '⌕'],
            ['help', 'Need Help?', '?'],
            ['saved', 'Library', '♡'],
            ['more', 'More', '•••'],
          ] as const).map(([key, label, glyph]) => {
            const isScreenTab = key === 'home' || key === 'search' || key === 'saved';
            const isActive = isScreenTab && screen === key;
            return (
              <Pressable
                accessibilityRole={isScreenTab ? 'tab' : 'button'}
                accessibilityState={isScreenTab ? { selected: isActive } : undefined}
                key={key}
                onPress={() => {
                  if (key === 'help') {
                    Alert.alert('Need help?', 'Choose a support option.', [
                      { text: 'FAQ', onPress: () => void openLegalPage('https://fwaya.net/help/faq') },
                      { text: 'Contact us', onPress: () => void openLegalPage('https://fwaya.net/help/contact') },
                      { text: 'Cancel', style: 'cancel' },
                    ]);
                  } else if (key === 'more') {
                    setSignInError(null);
                    setAccountOpen(true);
                  } else {
                    setScreen(key);
                  }
                }}
                style={({ pressed }) => [
                  styles.bottomNavigationItem,
                  isActive && styles.bottomNavigationItemActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.bottomNavigationGlyph, isActive && styles.bottomNavigationTextActive]}>{glyph}</Text>
                <Text style={[styles.bottomNavigationText, isActive && styles.bottomNavigationTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const palette = {
  background: '#000000',
  surface: 'rgba(54,69,79,0.18)',
  surfaceRaised: 'rgba(54,69,79,0.32)',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.65)',
  accent: '#9B5DE5',
  border: 'transparent',
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  listContent: { flexGrow: 1, paddingBottom: 8, paddingHorizontal: 16 },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 74,
    paddingTop: 5,
    paddingBottom: 8,
  },
  brandLockup: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  brandMark: { height: 60, width: 60 },
  brand: { color: palette.text, fontSize: 28, fontWeight: '700', letterSpacing: 0.1 },
  accountBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  liveDot: { backgroundColor: palette.accent, borderRadius: 4, height: 7, width: 7 },
  liveText: { color: palette.text, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  bannerCarousel: { marginHorizontal: -16 },
  homeBanner: { height: 164, justifyContent: 'flex-end', overflow: 'hidden' },
  bannerShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.24)' },
  bannerCopy: { paddingBottom: 18, paddingHorizontal: 20 },
  bannerEyebrow: { color: palette.accent, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  bannerTitle: { color: '#FFFFFF', fontSize: 23, fontWeight: '800', marginTop: 3 },
  bannerDots: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center', paddingTop: 9 },
  bannerDot: { backgroundColor: 'rgba(255,255,255,0.38)', borderRadius: 3, height: 6, width: 6 },
  activeBannerDot: { backgroundColor: '#FFFFFF', width: 18 },
  homeTabs: { gap: 8, paddingBottom: 9, paddingTop: 15 },
  homeTab: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8 },
  activeHomeTab: { backgroundColor: palette.accent },
  homeTabText: { color: palette.muted, fontSize: 12, fontWeight: '500' },
  activeHomeTabText: { color: '#FFFFFF' },
  homeSection: { marginTop: 17 },
  homeSectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11 },
  homeSectionTitle: { color: palette.text, fontSize: 18, fontWeight: '700' },
  seeAllText: { color: palette.accent, fontSize: 12, fontWeight: '500', padding: 6 },
  homeRail: { gap: 12, paddingRight: 8 },
  railTrackCard: { width: 142 },
  entityCard: { width: 126 },
  entityImage: { aspectRatio: 1, backgroundColor: palette.surfaceRaised, borderRadius: 14, marginBottom: 8, width: '100%' },
  artistImage: { borderRadius: 55 },
  categoryContent: { paddingBottom: 8 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  categoryCard: { width: '48%' },
  homeEmpty: { alignItems: 'center', justifyContent: 'center', minHeight: 230, paddingHorizontal: 18 },
  localLoader: { paddingVertical: 60 },
  homeError: { color: palette.text, fontSize: 12, marginTop: 16 },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: palette.accent,
    borderRadius: 20,
    marginTop: 15,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  heroButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  sectionHeader: { marginBottom: 15, marginTop: 4 },
  sectionEyebrow: { color: palette.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  sectionTitle: { color: palette.text, fontSize: 24, fontWeight: '800', marginTop: 5 },
  libraryTabs: { flexDirection: 'row', gap: 10, marginTop: 14 },
  libraryTab: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 18, paddingHorizontal: 15, paddingVertical: 8 },
  libraryTabActive: { backgroundColor: 'rgba(155,93,229,0.22)' },
  libraryTabText: { color: palette.muted, fontSize: 12, fontWeight: '600' },
  homeTrackRow: { gap: 12 },
  homeTrackCard: { marginBottom: 5, minWidth: 0 },
  homeCoverButton: { aspectRatio: 1, borderRadius: 14, overflow: 'hidden', position: 'relative', width: '100%' },
  homeCover: { backgroundColor: palette.surfaceRaised, height: '100%', width: '100%' },
  homeCoverAction: {
    alignItems: 'center',
    backgroundColor: 'rgba(155,93,229,0.92)',
    borderRadius: 18,
    bottom: 9,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 9,
    minWidth: 36,
    paddingHorizontal: 8,
  },
  homeCoverGlyph: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  homeCardDetails: { alignItems: 'center', flexDirection: 'row', gap: 5, paddingTop: 9 },
  homeCardCopy: { flex: 1, minWidth: 0 },
  homeSaveButton: { alignItems: 'center', justifyContent: 'center', minHeight: 38, minWidth: 32 },
  downloadGlyph: { color: palette.muted, fontSize: 19, fontWeight: '700' },
  searchInput: {
    backgroundColor: palette.surface,
    borderRadius: 14,
    color: palette.text,
    fontSize: 15,
    marginBottom: 25,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  trackRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 82,
  },
  trackMain: { alignItems: 'center', flex: 1, flexDirection: 'row', minWidth: 0, paddingVertical: 10 },
  pressed: { opacity: 0.68 },
  cover: { backgroundColor: palette.surfaceRaised, borderRadius: 11, height: 58, width: 58 },
  trackDetails: { flex: 1, marginHorizontal: 12, minWidth: 0 },
  trackTitle: { color: palette.text, fontSize: 14, fontWeight: '700' },
  trackArtist: { color: palette.muted, fontSize: 11, marginTop: 5 },
  playGlyph: { color: palette.text, fontSize: 16, paddingHorizontal: 8 },
  lockLabel: { color: palette.accent, fontSize: 8, fontWeight: '900', letterSpacing: 0.7, paddingHorizontal: 8 },
  saveButton: { alignItems: 'center', justifyContent: 'center', minHeight: 48, minWidth: 40 },
  saveGlyph: { color: palette.muted, fontSize: 21 },
  accentText: { color: palette.accent },
  emptyState: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 210, paddingHorizontal: 20 },
  emptyTitle: { color: palette.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyCopy: { color: palette.muted, fontSize: 13, lineHeight: 19, marginTop: 9, textAlign: 'center' },
  retryButton: { backgroundColor: palette.surfaceRaised, borderRadius: 10, marginTop: 16, paddingHorizontal: 16, paddingVertical: 11 },
  retryText: { color: palette.text, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  accountScreen: { backgroundColor: palette.background, flex: 1, paddingHorizontal: 20 },
  accountHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  accountContent: { flexGrow: 1, justifyContent: 'center', paddingBottom: 35 },
  accountEmail: { color: palette.text, fontSize: 20, fontWeight: '800', marginTop: 10 },
  accountMembership: { color: palette.muted, fontSize: 14, marginTop: 8 },
  premiumSection: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    marginTop: 25,
    padding: 16,
  },
  premiumHeading: { color: palette.text, fontSize: 20, fontWeight: '800', lineHeight: 26, marginTop: 7 },
  premiumDescription: { color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 7 },
  premiumPlan: {
    alignItems: 'center',
    backgroundColor: palette.surfaceRaised,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  premiumPlanCopy: { flex: 1, minWidth: 0 },
  premiumPlanName: { color: palette.text, fontSize: 13, fontWeight: '800' },
  premiumPlanDetail: { color: palette.muted, fontSize: 10, marginTop: 4 },
  premiumPlanPrice: { color: palette.text, fontSize: 14, fontWeight: '900' },
  purchaseDisclosure: { color: palette.muted, fontSize: 10, lineHeight: 15, marginTop: 13, textAlign: 'center' },
  legalLinks: { alignItems: 'center', flexDirection: 'row', gap: 9, justifyContent: 'center', marginTop: 11 },
  legalLink: { color: palette.muted, fontSize: 10, textDecorationLine: 'underline' },
  legalSeparator: { color: palette.muted, fontSize: 11 },
  accountInput: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    color: palette.text,
    fontSize: 15,
    marginTop: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  accountPrimaryButton: {
    alignItems: 'center',
    backgroundColor: palette.accent,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 48,
  },
  accountPrimaryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  accountSecondaryButton: {
    alignItems: 'center',
    backgroundColor: palette.surfaceRaised,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 28,
    minHeight: 48,
  },
  accountSecondaryText: { color: palette.text, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  resetButton: { alignSelf: 'center', marginTop: 22, padding: 10 },
  accountError: {
    backgroundColor: 'rgba(54,69,79,0.65)',
    borderRadius: 9,
    color: palette.text,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
    padding: 12,
  },
  accountSpinner: { marginTop: 18 },
  disabledButton: { opacity: 0.55 },
  catalogNotice: { backgroundColor: 'rgba(155,93,229,0.22)', color: palette.text, paddingHorizontal: 20, paddingVertical: 9, fontSize: 12 },
  playbackError: { backgroundColor: 'rgba(54,69,79,0.65)', color: palette.text, paddingHorizontal: 20, paddingVertical: 9, fontSize: 12 },
  playerBar: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  playerMain: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10, minWidth: 0 },
  playerCover: { borderRadius: 24, height: 40, width: 40 },
  miniQueueButton: { alignItems: 'center', height: 38, justifyContent: 'center', width: 32 },
  playerDetails: { flex: 1, minWidth: 0 },
  playerTitle: { color: palette.text, fontSize: 12, fontWeight: '700' },
  playerArtist: { color: palette.muted, fontSize: 10, marginTop: 2 },
  progressTrack: { backgroundColor: palette.surfaceRaised, borderRadius: 2, height: 2, marginTop: 6, overflow: 'hidden' },
  progressValue: { backgroundColor: palette.accent, height: 2 },
  elapsedTime: { color: palette.muted, fontSize: 9 },
  playerControl: { alignItems: 'center', height: 38, justifyContent: 'center', width: 38 },
  playerControlGlyph: { color: palette.text, fontSize: 18, fontWeight: '800' },
  fullPlayer: { backgroundColor: palette.background, flex: 1, paddingHorizontal: 24 },
  fullPlayerTopBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  closePlayerButton: { alignItems: 'center', height: 38, justifyContent: 'center', width: 38 },
  closePlayerText: { color: palette.text, fontSize: 29, lineHeight: 32 },
  nowPlayingLabel: { color: palette.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  fullCoverContainer: { alignItems: 'center', flex: 1, justifyContent: 'center', maxHeight: 285, paddingVertical: 12 },
  fullCover: { aspectRatio: 1, borderRadius: 18, maxHeight: 260, maxWidth: 340, width: '100%' },
  visualizer: { alignItems: 'center', flexDirection: 'row', gap: 3, height: 40, justifyContent: 'center', marginTop: 3 },
  visualizerBar: { borderRadius: 4, width: 3 },
  fullTrackInfo: { paddingBottom: 8 },
  fullTrackTitle: { color: palette.text, fontSize: 22, fontWeight: '800', lineHeight: 28 },
  fullTrackArtist: { color: palette.muted, fontSize: 14, marginTop: 4 },
  fullProgressTrack: { height: 4, marginTop: 17 },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  fullPlayerControls: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  skipControl: { alignItems: 'center', height: 48, justifyContent: 'center', marginHorizontal: 24, width: 50 },
  skipLabel: { color: palette.muted, fontSize: 15, fontWeight: '800' },
  fullPlayButton: { alignItems: 'center', backgroundColor: palette.accent, borderRadius: 34, height: 68, justifyContent: 'center', width: 68 },
  fullPlayGlyph: { color: '#FFFFFF', fontSize: 25, fontWeight: '900' },
  playerPanelTabs: { flexDirection: 'row', gap: 25, justifyContent: 'center', paddingVertical: 10 },
  playerPanelTab: { paddingHorizontal: 8, paddingVertical: 6 },
  playerPanelTabActive: { borderBottomColor: palette.accent, borderBottomWidth: 2 },
  playerPanelTabText: { color: palette.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  playerPanelContent: { flexGrow: 0, maxHeight: 155 },
  queueRow: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 54, paddingVertical: 6 },
  queueIndex: { color: palette.muted, fontSize: 11, width: 18 },
  queueCover: { borderRadius: 6, height: 38, width: 38 },
  lyricsContent: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14 },
  lyricsTitle: { color: palette.text, fontSize: 15, fontWeight: '700' },
  lyricsText: { color: palette.muted, fontSize: 13, lineHeight: 22, marginTop: 10, textAlign: 'center' },
  bottomNavigation: {
    backgroundColor: palette.background,
    flexDirection: 'row',
    paddingBottom: 4,
    paddingHorizontal: 5,
    paddingTop: 3,
  },
  bottomNavigationItem: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 52, paddingVertical: 3 },
  bottomNavigationItemActive: { backgroundColor: 'transparent' },
  bottomNavigationGlyph: { color: palette.muted, fontSize: 19, fontWeight: '600', height: 23, lineHeight: 22 },
  bottomNavigationText: { color: palette.muted, fontSize: 9, fontWeight: '500', marginTop: 1 },
  bottomNavigationTextActive: { color: palette.accent },
  activeTabText: { color: palette.accent },
});
