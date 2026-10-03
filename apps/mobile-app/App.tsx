import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
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
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getMobileAuth } from './mobile-auth';

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

type Screen = 'home' | 'search' | 'saved';

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
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);
  const [screen, setScreen] = useState<Screen>('home');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [savedTrackIds, setSavedTrackIds] = useState<string[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
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
    if (screen === 'saved') {
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

    return tracks.slice(0, 30);
  }, [query, savedTrackIds, screen, tracks]);

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

  const playTrack = useCallback(
    async (track: Track) => {
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
      } catch (error) {
        console.error('Unable to play track:', error);
        const message =
          error instanceof Error ? error.message : 'This track could not be played.';
        setPlaybackError(message);
        Alert.alert('Track unavailable', message);
      }
    },
    [account, player]
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

  const renderTrack = ({ item }: { item: Track }) => {
    const isCurrentTrack = currentTrack?.id === item.id;
    const isSaved = savedTrackIds.includes(item.id);
    const isLocked =
      item.accessType === 'PAY_PER_VIEW' ||
      (item.accessType === 'PREMIUM' && !account?.isPremium);
    const lockedLabel =
      item.accessType === 'PREMIUM'
        ? 'PREMIUM'
        : item.price !== null && Number.isFinite(item.price) && item.price > 0
          ? `$${item.price.toFixed(2)}`
          : 'BUY';

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isSaved ? `Remove ${item.title} from saved tracks` : `Save ${item.title}`}
          onPress={() => void toggleSavedTrack(item)}
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
        >
          <Text style={[styles.saveGlyph, isSaved && styles.accentText]}>{isSaved ? '♥' : '♡'}</Text>
        </Pressable>
      </View>
    );
  };

  const listHeader = (
    <View>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.brand}>FWAYA</Text>
          <Text style={styles.brandSubtitle}>MUSIC FOR YOUR MOMENT</Text>
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
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>YOUR SOUND. YOUR SCENE.</Text>
          <Text style={styles.heroTitle}>Find your{'\n'}next favorite.</Text>
          <Text style={styles.heroCopy}>
            Discover music from artists on Fwaya.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setScreen('search')}
            style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
          >
            <Text style={styles.heroButtonText}>EXPLORE MUSIC  →</Text>
          </Pressable>
          {!account?.isPremium && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSignInError(null);
                setAccountOpen(true);
              }}
              style={({ pressed }) => [styles.heroPremiumButton, pressed && styles.pressed]}
            >
              <Text style={styles.heroPremiumText}>DISCOVER PREMIUM</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>
            {screen === 'search' ? 'DISCOVER' : 'YOUR COLLECTION'}
          </Text>
          <Text style={styles.sectionTitle}>
            {screen === 'search' ? 'Search music' : 'Saved tracks'}
          </Text>
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

      {screen === 'home' && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>MADE FOR DISCOVERY</Text>
          <Text style={styles.sectionTitle}>Fresh on Fwaya</Text>
        </View>
      )}
    </View>
  );

  const listEmpty = (
    <View style={styles.emptyState}>
      {loading || !savedTracksReady ? (
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
              ? 'Your collection starts here'
              : screen === 'search'
                ? 'No matches yet'
                : 'No tracks to show yet'}
          </Text>
          <Text style={styles.emptyCopy}>
            {screen === 'saved'
              ? 'Tap the heart beside a track to save it for later.'
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

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredTracks}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={listEmpty}
          ListHeaderComponent={listHeader}
          refreshControl={
            <RefreshControl
              colors={[palette.accent]}
              onRefresh={() => void loadCatalog(true)}
              refreshing={refreshing}
              tintColor={palette.accent}
            />
          }
          renderItem={renderTrack}
          showsVerticalScrollIndicator={false}
        />

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
            <Text style={styles.elapsedTime}>{formatTime(playerStatus.currentTime)}</Text>
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
              <View style={styles.fullTrackInfo}>
                <Text numberOfLines={2} style={styles.fullTrackTitle}>{currentTrack.title}</Text>
                <Text numberOfLines={1} style={styles.fullTrackArtist}>{currentTrack.artist}</Text>
                <View style={[styles.progressTrack, styles.fullProgressTrack]}>
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
                <View style={styles.timeLabels}>
                  <Text style={styles.elapsedTime}>{formatTime(playerStatus.currentTime)}</Text>
                  <Text style={styles.elapsedTime}>{formatTime(playerStatus.duration)}</Text>
                </View>
                <View style={styles.fullPlayerControls}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Skip back 15 seconds"
                    disabled={!playerStatus.isLoaded}
                    onPress={() => player.seekTo(Math.max(0, playerStatus.currentTime - 15))}
                    style={({ pressed }) => [styles.skipControl, pressed && styles.pressed]}
                  >
                    <Text style={styles.skipLabel}>−15</Text>
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
                    accessibilityLabel="Skip forward 15 seconds"
                    disabled={!playerStatus.isLoaded}
                    onPress={() =>
                      player.seekTo(
                        Math.min(playerStatus.duration, playerStatus.currentTime + 15)
                      )
                    }
                    style={({ pressed }) => [styles.skipControl, pressed && styles.pressed]}
                  >
                    <Text style={styles.skipLabel}>+15</Text>
                  </Pressable>
                </View>
              </View>
            </SafeAreaView>
          )}
        </Modal>

        <View style={styles.tabBar}>
          {([
            ['home', 'HOME'],
            ['search', 'SEARCH'],
            ['saved', 'SAVED'],
          ] as const).map(([key, label]) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: screen === key }}
              key={key}
              onPress={() => setScreen(key)}
              style={styles.tab}
            >
              <Text style={[styles.tabText, screen === key && styles.activeTabText]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const palette = {
  background: '#090B10',
  surface: '#121620',
  surfaceRaised: '#191E2A',
  text: '#F7F7F8',
  muted: '#9299A8',
  accent: '#EE174C',
  border: '#242A38',
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  listContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 22 },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 25,
  },
  brand: { color: palette.text, fontSize: 20, fontWeight: '900', letterSpacing: 2.6 },
  brandSubtitle: { color: palette.muted, fontSize: 8, fontWeight: '700', letterSpacing: 1.7, marginTop: 3 },
  accountBadge: {
    alignItems: 'center',
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  liveDot: { backgroundColor: palette.accent, borderRadius: 4, height: 7, width: 7 },
  liveText: { color: palette.text, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  hero: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 30,
    overflow: 'hidden',
    padding: 22,
  },
  eyebrow: { color: palette.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { color: palette.text, fontSize: 38, fontWeight: '900', letterSpacing: -1.3, lineHeight: 42, marginTop: 15 },
  heroCopy: { color: palette.muted, fontSize: 14, lineHeight: 21, marginTop: 12 },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: palette.accent,
    borderRadius: 12,
    marginTop: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  heroButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  heroPremiumButton: { alignSelf: 'flex-start', marginTop: 14, paddingVertical: 4 },
  heroPremiumText: { color: palette.text, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  sectionHeader: { marginBottom: 15, marginTop: 4 },
  sectionEyebrow: { color: palette.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  sectionTitle: { color: palette.text, fontSize: 24, fontWeight: '800', marginTop: 5 },
  searchInput: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    color: palette.text,
    fontSize: 15,
    marginBottom: 25,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  trackRow: {
    alignItems: 'center',
    borderBottomColor: palette.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 25,
    padding: 16,
  },
  premiumHeading: { color: palette.text, fontSize: 20, fontWeight: '800', lineHeight: 26, marginTop: 7 },
  premiumDescription: { color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 7 },
  premiumPlan: {
    alignItems: 'center',
    backgroundColor: palette.surfaceRaised,
    borderColor: '#3A3040',
    borderRadius: 12,
    borderWidth: 1,
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
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
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
    backgroundColor: '#42121F',
    borderRadius: 9,
    color: '#FFD8E0',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
    padding: 12,
  },
  accountSpinner: { marginTop: 18 },
  disabledButton: { opacity: 0.55 },
  catalogNotice: { backgroundColor: '#342B12', color: '#F7E5B0', paddingHorizontal: 20, paddingVertical: 9, fontSize: 12 },
  playbackError: { backgroundColor: '#42121F', color: '#FFD8E0', paddingHorizontal: 20, paddingVertical: 9, fontSize: 12 },
  playerBar: {
    alignItems: 'center',
    backgroundColor: palette.surfaceRaised,
    borderTopColor: palette.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  playerMain: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10, minWidth: 0 },
  playerCover: { borderRadius: 7, height: 42, width: 42 },
  playerDetails: { flex: 1, minWidth: 0 },
  playerTitle: { color: palette.text, fontSize: 12, fontWeight: '700' },
  playerArtist: { color: palette.muted, fontSize: 10, marginTop: 2 },
  progressTrack: { backgroundColor: '#343A48', borderRadius: 2, height: 2, marginTop: 6, overflow: 'hidden' },
  progressValue: { backgroundColor: palette.accent, height: 2 },
  elapsedTime: { color: palette.muted, fontSize: 9 },
  playerControl: { alignItems: 'center', height: 38, justifyContent: 'center', width: 38 },
  playerControlGlyph: { color: palette.text, fontSize: 18, fontWeight: '800' },
  fullPlayer: { backgroundColor: palette.background, flex: 1, paddingHorizontal: 24 },
  fullPlayerTopBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  closePlayerButton: { alignItems: 'center', height: 38, justifyContent: 'center', width: 38 },
  closePlayerText: { color: palette.text, fontSize: 29, lineHeight: 32 },
  nowPlayingLabel: { color: palette.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  fullCoverContainer: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingVertical: 22 },
  fullCover: { aspectRatio: 1, borderRadius: 22, maxHeight: 380, maxWidth: 380, width: '100%' },
  fullTrackInfo: { paddingBottom: 35 },
  fullTrackTitle: { color: palette.text, fontSize: 25, fontWeight: '800', lineHeight: 31 },
  fullTrackArtist: { color: palette.muted, fontSize: 15, marginTop: 6 },
  fullProgressTrack: { height: 4, marginTop: 27 },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  fullPlayerControls: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 26 },
  skipControl: { alignItems: 'center', height: 54, justifyContent: 'center', marginHorizontal: 24, width: 54 },
  skipLabel: { color: palette.muted, fontSize: 15, fontWeight: '800' },
  fullPlayButton: { alignItems: 'center', backgroundColor: palette.accent, borderRadius: 34, height: 68, justifyContent: 'center', width: 68 },
  fullPlayGlyph: { color: '#FFFFFF', fontSize: 25, fontWeight: '900' },
  tabBar: {
    backgroundColor: palette.background,
    borderTopColor: palette.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingBottom: 8,
    paddingHorizontal: 8,
    paddingTop: 9,
  },
  tab: { alignItems: 'center', flex: 1, paddingVertical: 10 },
  tabText: { color: palette.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  activeTabText: { color: palette.accent },
});
