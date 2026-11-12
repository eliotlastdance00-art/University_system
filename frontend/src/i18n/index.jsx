import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../lib/hooks';
import { setFormatLocale } from '../lib/format';

/* ═══════════════════════════════════════════════════════════
   i18n — ýeňil sözlük esasly terjime (daşarky kitaphana ýok)

   Ulanylyşy:
     const { t, locale, setLocale } = useI18n();
     t('nav.dashboard')
     t('common.save')

   Sözlüge täze açar goşmak: `dictionary.<dil>.<topar>.<açar>`
   Interpolýasiýa:  t('table.rows', { count: 12 })  → "{count} setir"
   ═══════════════════════════════════════════════════════════ */

export const SUPPORTED_LOCALES = [
  { code: 'tk', label: 'Türkmençe', short: 'TK', intl: 'tk-TM', dir: 'ltr' },
  { code: 'en', label: 'English',   short: 'EN', intl: 'en-GB', dir: 'ltr' },
];

export const DEFAULT_LOCALE = 'en';

const dictionary = {
  /* ─── Türkmençe ─────────────────────────────────────────── */
  tk: {
    app: { name: 'UniSystem', tagline: 'Universitet dolandyryş ulgamy' },

    common: {
      save: 'Ýatda saklamak', cancel: 'Ýatyr', delete: 'Pozmak', edit: 'Üýtgetmek',
      create: 'Döretmek', add: 'Goşmak', close: 'Ýapmak', search: 'Gözleg',
      filter: 'Süzgüç', filters: 'Süzgüçler', clear: 'Arassalamak', reset: 'Täzeden',
      confirm: 'Tassyklamak', back: 'Yza', next: 'Indiki', previous: 'Öňki',
      loading: 'Ýüklenýär…', submit: 'Ibermek', apply: 'Ulanmak', export: 'Eksport',
      import: 'Import', refresh: 'Täzelemek', retry: 'Gaýtada synanyş',
      view: 'Görkezmek', details: 'Jikme-jiklik', actions: 'Hereketler',
      all: 'Hemmesi', none: 'Hiç zat', yes: 'Hawa', no: 'Ýok',
      required: 'Hökmany', optional: 'Hökmany däl', copy: 'Göçürmek',
      copied: 'Göçürildi', expand: 'Giňeltmek', collapse: 'Ýygnamak',
      more: 'Has köp', less: 'Az', today: 'Şu gün', yesterday: 'Düýn',
      tomorrow: 'Ertir', of: '/', from: 'den', to: '-e',
      created: 'Döredildi', unsaved: 'Ýatda saklanmady', discard: 'Üýtgeşmeleri aýyrmak',
      unsavedChanges: 'Ýatda saklanmadyk üýtgeşmeler bar',
      allSaved: 'Ähli üýtgeşmeler ýatda saklandy',
    },

    status: {
      active: 'Işjeň', inactive: 'Işjeň däl', pending: 'Garaşylýar',
      completed: 'Tamamlanan', failed: 'Şowsuz', processing: 'Işlenýär',
      present: 'Gatnaşdy', absent: 'Gatnaşmady', late: 'Gijä galdy',
      excused: 'Sebäpli', scheduled: 'Meýilleşdirilen', held: 'Geçirildi',
      cancelled: 'Ýatyryldy', sent: 'Iberildi', read: 'Okalan', unread: 'Okalmadyk',
      draft: 'Garalama', published: 'Çap edilen', closed: 'Ýapyk', open: 'Açyk',
      verified: 'Tassyklanan', unverified: 'Tassyklanmadyk',
    },

    nav: {
      dashboard: 'Dolandyryş paneli', users: 'Ulanyjylar', faculties: 'Fakultetler',
      departments: 'Kafedralar', academic: 'Akademiki', academicYears: 'Okuw ýyllary',
      programs: 'Programmalar', subjects: 'Dersler', cohorts: 'Akymlar',
      sections: 'Toparlar', assignments: 'Berkidilenler', timetable: 'Ders tertibi',
      lessons: 'Sapaklar', attendance: 'Gatnaşyk', grades: 'Bahalar',
      notifications: 'Bildirişler', profile: 'Profil', settings: 'Sazlamalar',
      myAssignments: 'Meniň derslerim', mySchedule: 'Meniň tertibim',
      myGrades: 'Meniň bahalarym', myAttendance: 'Meniň gatnaşygym',
      main: 'Esasy', manage: 'Dolandyryş', learning: 'Okuw', account: 'Hasap',
      other: 'Başga', otp: 'OTP kody',
    },

    auth: {
      signIn: 'Ulgama girmek', signOut: 'Çykmak', logout: 'Çykmak',
      email: 'Email salgy', password: 'Parol', welcomeBack: 'Hoş geldiňiz',
      signInSubtitle: 'Universitet hasabyňyza giriň',
      authenticating: 'Barlanýar…', verifyOtp: 'Tassyklama kody',
      otpSubtitle: 'Email salgyňyza iberilen 6 sanly kody giriziň',
      otpSent: 'Kod {email} salgyňa iberildi', resend: 'Kody gaýtadan ibermek',
      resendIn: '{seconds}s-den soň gaýtadan', verify: 'Tassyklamak',
      verifying: 'Barlanýar…', newPassword: 'Täze parol',
      forgotPassword: 'Parolyňyzy ýatdan çykardyňyzmy?',
      invalidCredentials: 'Email ýa-da parol nädogry',
      noCode: 'Tassyklama kody gelmedimi?',
      codeLength: 'Kod 6 sanly bolmaly',
    },

    command: {
      placeholder: 'Sahypa, hereket ýa-da ulanyjy gözle…',
      noResults: 'Hiç zat tapylmady', pages: 'Sahypalar', actions: 'Hereketler',
      hint: 'Basyň ýa-da {key} basyň', navigation: 'Nawigasiýa',
      theme: 'Tema', language: 'Dil', enterSelect: 'Saýlamak',
      escClose: 'Ýapmak', arrowNavigate: 'Gezmek',
    },

    theme: {
      light: 'Açyk', dark: 'Garaňky', system: 'Ulgam boýunça', title: 'Tema',
      activeIs: 'Häzirki tema: {theme}',
    },

    table: {
      rows: '{count} ýazgy', empty: 'Ýazgy tapylmady',
      emptyHint: 'Süzgüçleri üýtgediň ýa-da täze ýazgy goşuň',
      searchPlaceholder: 'Gözleg…', perPage: 'Sahypada',
      page: 'Sahypa {page} / {total}', selected: '{count} saýlandy',
      sortAsc: 'Artýan tertipde', sortDesc: 'Kemelýän tertipde',
      loading: 'Ýüklenýär…', error: 'Maglumat ýüklenmedi',
      columns: 'Sütünler', noColumns: 'Sütün ýok',
    },

    modal: { close: 'Ýapmak', confirmTitle: 'Tassyklaň' },

    toast: {
      saved: 'Üstünlikli ýatda saklandy', created: 'Döredildi',
      deleted: 'Pozuldy', updated: 'Täzelendi',
      error: 'Ýalňyşlyk ýüze çykdy', networkError: 'Tor bilen baglanyşyk ýok',
      copied: 'Göçürildi',
    },

    errors: {
      title: 'Bir zat nädogry boldy',
      generic: 'Haýyş, gaýtadan synanyşyň.',
      notFoundTitle: 'Sahypa tapylmady',
      notFoundBody: 'Baran sahypaňyz ýok ýa-da başga ýere göçürilen.',
      goHome: 'Baş sahypa', reload: 'Sahypany täzelemek',
      boundaryTitle: 'Sahypa ýalňyşlygy',
      boundaryBody: 'Bu bölüm ýüklenende näsazlyk ýüze çykdy.',
      forbidden: 'Bu sahypa üçin rugsadyňyz ýok',
      forbiddenBody:
        '“{role}” roly bilen bu sahypa girip bolmaýar. Öz bölümiňize geçiň ýa-da administratora ýüz tutuň.',
      offline: 'Internet baglanyşygy ýok',
    },

    header: {
      notifications: 'Bildirişler', markAllRead: 'Hemmesini okalan belle',
      noNotifications: 'Bildiriş ýok', viewAll: 'Hemmesini gör',
      myProfile: 'Meniň profilim', search: 'Gözleg',
      unread: '{count} okalmadyk', menu: 'Menýu',
    },

    validation: {
      required: 'Bu meýdan hökmany',
      email: 'Dogry e-poçta salgysyny giriziň',
      passwordMin: 'Parol azyndan {min} belgiden ybarat bolmaly',
      passwordMatch: 'Parollar gabat gelmeýär',
      number: 'San giriziň',
      positive: 'Baha 0-dan uly bolmaly',
      maxLen: 'Iň köp {max} belgi',
    },

    profile: {
      role: 'Rol', faculty: 'Fakultet', department: 'Kafedra',
      section: 'Topar', fullName: 'Doly ady', memberSince: 'Agza bolan senesi',
      admin: 'Administrator', dean: 'Dekan', teacher: 'Mugallym', student: 'Student',
      subtitle: 'Şahsy maglumatlaryňyz, howpsuzlyk we interfeýs sazlamalary',
      unknown: 'Näbelli ulanyjy',
      saved: 'Profil maglumatlary täzelendi',
      personalInfo: 'Şahsy maglumatlar',
      email: 'E-poçta',
      emailHint: 'E-poçta üýtgedilse, indiki girişde täze salgyny ulanyň',
      sourceProfileApi: 'Maglumat /profile/me endpoint-inden alyndy',
      academicPlacement: 'Akademiki degişlilik',
      structureHint: 'Diňe administrator we dekan üýtgedip bilýär',
      structureReadonly: 'Degişlilik diňe okaýar',
      structureReadonlyBody:
        'Fakultet, kafedra we topar degişliligini diňe administrator ýa-da dekan üýtgedip bilýär. Zerur bolsa administratora ýüz tutuň.',
      editProfile: 'Profili üýtgetmek',
      editProfileHint: 'At we e-poçta her bir ulanyjy tarapyndan üýtgedilip bilner',
      accountSecurity: 'Hasap howpsuzlygy',
      authentication: 'Autentifikasiýa',
      twoFactor: 'Iki ädimli barlag (OTP)',
      sessionStorage: 'Token saklanyşy',
      lastLogin: 'Soňky giriş',
      securityNote: 'Howpsuzlyk bellikleri',
      securityNoteBody:
        'Tokenlar brauzeriň localStorage-ynda saklanýar (AUDIT S10). Umumy kompýuterde ulananyňyzdan soň hasapdan çykyň.',
      changePassword: 'Paroly üýtgetmek',
      passwordHint: 'Azyndan 8 belgi — san we baş harp maslahat berilýär',
      newPassword: 'Täze parol',
      confirmPassword: 'Paroly tassyklaň',
      passwordChanged: 'Parol üýtgedildi',
      passwordWarning: 'Üns beriň',
      passwordWarningBody:
        'Backend häzirki wagtda täze paroly hash etmän ýazýar (AUDIT B16/S1). Bu düzedilýänçä paroly üýtgetmek maslahat berilmeýär — üýtgetseňiz, indiki giriş şowsuz bolup biler.',
      updatePassword: 'Paroly täzelemek',
      sessions: 'Sessiýalar',
      accessToken: 'Access token',
      refreshToken: 'Refresh token',
      otpChannel: 'OTP iberilýän kanal',
      device: 'Enjam',
      sessionsHint: 'Aktiw sessiýalar',
      sessionsHintBody:
        'Backend-de sessiýa dolandyryşy ýok (AUDIT H6) — şonuň üçin beýleki enjamlary uzakdan ýapyp bolmaýar. Şübheli ýagdaýda paroly üýtgediň.',
      appearance: 'Daşky görnüş',
      theme: 'Tema',
      themeHint: 'Ulgam temasyny saýlasaňyz, brauzer sazlamasy awtomatiki yzarlanýar',
      collapseSidebar: 'Gapdal paneli ýygnamak',
      desktopOnly: 'Diňe uly ekranlarda elýeterli',
      languageRegion: 'Dil we sebit',
      language: 'Dil',
      languageHint: 'Interfeýs dili — seneleriň we sanlaryň formaty hem buna uýgunlaşýar',
      dateFormat: 'Sene formaty',
      timeFormat: 'Wagt formaty',
      timezone: 'Wagt zolagy',
    },

    pwa: {
      install: 'Programma hökmünde gurmak', installHint: 'Baş ekrana goşuň',
      offlineReady: 'Offline režime taýýar', updateAvailable: 'Täze wersiýa bar',
      reload: 'Täzeden ýüklemek', dismiss: 'Ýapmak',
    },

    dashboard: {
      welcome: 'Hoş geldiňiz, {name}', overview: 'Umumy syn',
      quickActions: 'Çalt hereketler', recentActivity: 'Soňky hereketler',
      todaySchedule: 'Şu güniň tertibi', noLessonsToday: 'Şu gün sapak ýok',
    },
  },

  /* ─── English ───────────────────────────────────────────── */
  en: {
    app: { name: 'UniSystem', tagline: 'University management system' },

    common: {
      save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
      create: 'Create', add: 'Add', close: 'Close', search: 'Search',
      filter: 'Filter', filters: 'Filters', clear: 'Clear', reset: 'Reset',
      confirm: 'Confirm', back: 'Back', next: 'Next', previous: 'Previous',
      loading: 'Loading…', submit: 'Submit', apply: 'Apply', export: 'Export',
      import: 'Import', refresh: 'Refresh', retry: 'Try again',
      view: 'View', details: 'Details', actions: 'Actions',
      all: 'All', none: 'None', yes: 'Yes', no: 'No',
      required: 'Required', optional: 'Optional', copy: 'Copy',
      copied: 'Copied', expand: 'Expand', collapse: 'Collapse',
      more: 'More', less: 'Less', today: 'Today', yesterday: 'Yesterday',
      tomorrow: 'Tomorrow', of: 'of', from: 'from', to: 'to',
      created: 'Created', unsaved: 'Unsaved', discard: 'Discard changes',
      unsavedChanges: 'You have unsaved changes',
      allSaved: 'All changes saved',
    },

    status: {
      active: 'Active', inactive: 'Inactive', pending: 'Pending',
      completed: 'Completed', failed: 'Failed', processing: 'Processing',
      present: 'Present', absent: 'Absent', late: 'Late',
      excused: 'Excused', scheduled: 'Scheduled', held: 'Held',
      cancelled: 'Cancelled', sent: 'Sent', read: 'Read', unread: 'Unread',
      draft: 'Draft', published: 'Published', closed: 'Closed', open: 'Open',
      verified: 'Verified', unverified: 'Unverified',
    },

    nav: {
      dashboard: 'Dashboard', users: 'Users', faculties: 'Faculties',
      departments: 'Departments', academic: 'Academic', academicYears: 'Academic years',
      programs: 'Programs', subjects: 'Subjects', cohorts: 'Cohorts',
      sections: 'Sections', assignments: 'Assignments', timetable: 'Timetable',
      lessons: 'Lessons', attendance: 'Attendance', grades: 'Grades',
      notifications: 'Notifications', profile: 'Profile', settings: 'Settings',
      myAssignments: 'My assignments', mySchedule: 'My schedule',
      myGrades: 'My grades', myAttendance: 'My attendance',
      main: 'Main', manage: 'Management', learning: 'Learning', account: 'Account',
      other: 'Other', otp: 'OTP code',
    },

    auth: {
      signIn: 'Sign in', signOut: 'Sign out', logout: 'Log out',
      email: 'Email address', password: 'Password', welcomeBack: 'Welcome back',
      signInSubtitle: 'Sign in to your university account',
      authenticating: 'Authenticating…', verifyOtp: 'Verification code',
      otpSubtitle: 'Enter the 6-digit code sent to your email',
      otpSent: 'Code sent to {email}', resend: 'Resend code',
      resendIn: 'Resend in {seconds}s', verify: 'Verify',
      verifying: 'Verifying…', newPassword: 'New password',
      forgotPassword: 'Forgot your password?',
      invalidCredentials: 'Invalid email or password',
      noCode: "Didn't receive a code?",
      codeLength: 'Code must be 6 digits',
    },

    command: {
      placeholder: 'Search pages, actions or people…',
      noResults: 'No results found', pages: 'Pages', actions: 'Actions',
      hint: 'Press {key}', navigation: 'Navigation',
      theme: 'Theme', language: 'Language', enterSelect: 'to select',
      escClose: 'to close', arrowNavigate: 'to navigate',
    },

    theme: {
      light: 'Light', dark: 'Dark', system: 'System', title: 'Theme',
      activeIs: 'Current theme: {theme}',
    },

    table: {
      rows: '{count} records', empty: 'No records found',
      emptyHint: 'Adjust your filters or create a new record',
      searchPlaceholder: 'Search…', perPage: 'Per page',
      page: 'Page {page} of {total}', selected: '{count} selected',
      sortAsc: 'Sort ascending', sortDesc: 'Sort descending',
      loading: 'Loading…', error: 'Failed to load data',
      columns: 'Columns', noColumns: 'No columns',
    },

    modal: { close: 'Close', confirmTitle: 'Please confirm' },

    toast: {
      saved: 'Saved successfully', created: 'Created',
      deleted: 'Deleted', updated: 'Updated',
      error: 'Something went wrong', networkError: 'Network unavailable',
      copied: 'Copied to clipboard',
    },

    errors: {
      title: 'Something went wrong',
      generic: 'Please try again.',
      notFoundTitle: 'Page not found',
      notFoundBody: "The page you're looking for doesn't exist or has been moved.",
      goHome: 'Go home', reload: 'Reload page',
      boundaryTitle: 'Page error',
      boundaryBody: 'An unexpected error occurred while rendering this section.',
      forbidden: "You don't have access to this page",
      forbiddenBody:
        'The “{role}” role cannot open this page. Head back to your own section or contact an administrator.',
      offline: 'You are offline',
    },

    header: {
      notifications: 'Notifications', markAllRead: 'Mark all as read',
      noNotifications: 'No notifications yet', viewAll: 'View all',
      myProfile: 'My profile', search: 'Search',
      unread: '{count} unread', menu: 'Menu',
    },

    validation: {
      required: 'This field is required',
      email: 'Enter a valid email address',
      passwordMin: 'Password must be at least {min} characters',
      passwordMatch: 'Passwords do not match',
      number: 'Enter a number',
      positive: 'Value must be greater than 0',
      maxLen: 'At most {max} characters',
    },

    profile: {
      role: 'Role', faculty: 'Faculty', department: 'Department',
      section: 'Section', fullName: 'Full name', memberSince: 'Member since',
      admin: 'Administrator', dean: 'Dean', teacher: 'Teacher', student: 'Student',
      subtitle: 'Your personal details, security and interface preferences',
      unknown: 'Unknown user',
      saved: 'Profile details updated',
      personalInfo: 'Personal information',
      email: 'Email',
      emailHint: 'If you change your email, use the new address at the next sign-in',
      sourceProfileApi: 'Loaded from the /profile/me endpoint',
      academicPlacement: 'Academic placement',
      structureHint: 'Only administrators and deans can change this',
      structureReadonly: 'Placement is read-only',
      structureReadonlyBody:
        'Faculty, department and section placement can only be changed by an administrator or dean. Contact them if an update is needed.',
      editProfile: 'Edit profile',
      editProfileHint: 'Name and email can be changed by every signed-in user',
      accountSecurity: 'Account security',
      authentication: 'Authentication',
      twoFactor: 'Two-step verification (OTP)',
      sessionStorage: 'Token storage',
      lastLogin: 'Last sign-in',
      securityNote: 'Security notes',
      securityNoteBody:
        'Tokens are stored in browser localStorage (AUDIT S10). Always sign out on shared machines.',
      changePassword: 'Change password',
      passwordHint: 'At least 8 characters — digits and mixed case recommended',
      newPassword: 'New password',
      confirmPassword: 'Confirm password',
      passwordChanged: 'Password changed',
      passwordWarning: 'Heads up',
      passwordWarningBody:
        'The backend currently stores the new password without hashing it (AUDIT B16/S1). Until that is fixed, changing your password is not recommended — you may be unable to sign in afterwards.',
      updatePassword: 'Update password',
      sessions: 'Sessions',
      accessToken: 'Access token',
      refreshToken: 'Refresh token',
      otpChannel: 'OTP delivery channel',
      device: 'Device',
      sessionsHint: 'Active sessions',
      sessionsHintBody:
        'There is no session management on the backend (AUDIT H6), so other devices cannot be revoked remotely. Change your password if anything looks suspicious.',
      appearance: 'Appearance',
      theme: 'Theme',
      themeHint: 'Choosing “System” follows your browser preference automatically',
      collapseSidebar: 'Collapse the sidebar',
      desktopOnly: 'Only available on large screens',
      languageRegion: 'Language & region',
      language: 'Language',
      languageHint: 'Interface language — dates and numbers are formatted to match',
      dateFormat: 'Date format',
      timeFormat: 'Time format',
      timezone: 'Time zone',
    },

    pwa: {
      install: 'Install as app', installHint: 'Add to your home screen',
      offlineReady: 'Offline ready', updateAvailable: 'Update available',
      reload: 'Reload', dismiss: 'Dismiss',
    },

    dashboard: {
      welcome: 'Welcome back, {name}', overview: 'Overview',
      quickActions: 'Quick actions', recentActivity: 'Recent activity',
      todaySchedule: "Today's schedule", noLessonsToday: 'No lessons today',
    },
  },
};

const I18nContext = createContext(null);

const resolve = (dict, key) => {
  // "nav.dashboard" → dict.nav.dashboard ; ýok bolsa null
  const parts = key.split('.');
  let node = dict;
  for (const part of parts) {
    if (node == null || typeof node !== 'object') return null;
    node = node[part];
  }
  return typeof node === 'string' ? node : null;
};

const interpolate = (template, vars) => {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name) =>
    (name in vars ? String(vars[name]) : `{${name}}`),
  );
};

export function I18nProvider({ children, defaultLocale = DEFAULT_LOCALE }) {
  const [locale, setLocale] = useLocalStorage('us_locale', defaultLocale);

  const current = SUPPORTED_LOCALES.find((l) => l.code === locale) || SUPPORTED_LOCALES[1];

  // Intl format kömekçileri locale bilen sinhron
  useEffect(() => {
    setFormatLocale(current.intl);
    document.documentElement.lang = current.code;
    document.documentElement.dir = current.dir;
  }, [current]);

  const t = useCallback(
    (key, vars) => {
      const value = resolve(dictionary[locale], key) ?? resolve(dictionary.en, key);
      if (value == null) {
        if (import.meta.env?.DEV) {
          // eslint-disable-next-line no-console
          console.warn(`[i18n] missing translation: "${key}" (${locale})`);
        }
        return interpolate(key, vars);
      }
      return interpolate(value, vars);
    },
    [locale],
  );

  /** Sözlükde açar barmy? (şertli render üçin) */
  const has = useCallback((key) => resolve(dictionary[locale], key) != null, [locale]);

  const value = useMemo(
    () => ({ t, has, locale, setLocale, locales: SUPPORTED_LOCALES, current }),
    [t, has, locale, setLocale, current],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Provider ýok bolsa — i18n ulanmaýan test/story üçin howpsuz fallback
    return {
      t: (key, vars) => interpolate(key, vars),
      has: () => false,
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      locales: SUPPORTED_LOCALES,
      current: SUPPORTED_LOCALES[1],
    };
  }
  return ctx;
}

/** Diňe `t` gerek ýerler üçin gysga alias */
export const useT = () => useI18n().t;
