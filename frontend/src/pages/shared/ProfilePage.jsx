import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Shield, Palette, Mail, Building2, Layers, Hash, KeyRound,
  Save, RefreshCw, Monitor, Sun, Moon, Languages,
  CheckCircle2, AlertTriangle, Copy, GraduationCap, Briefcase, IdCard,
} from 'lucide-react';
import { getMyProfile, updateMyProfile, updateMyPassword } from '../../api/profile';
import { getFaculties } from '../../api/faculty';
import { getAllDepartments } from '../../api/department';
import { getSections } from '../../api/sections';
import { useApi, useMutation } from '../../lib/useApi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUi } from '../../contexts/UiContext';
import { useI18n, SUPPORTED_LOCALES } from '../../i18n';
import { useToast } from '../../contexts/ToastContext';
import {
  Button, IconButton, Card, CardHeader, CardBody, CardFooter, Tabs, TabPanel,
  Field, Input, Select, PasswordInput, Switch, SegmentedControl,
  Alert, Badge, StatusBadge, Avatar, KVList, Divider, Skeleton, Tooltip,
} from '../../components/ui';
import { formatDate, formatRelative, initials } from '../../lib/format';

/* ═══════════════════════════════════════════════════════════
   Profile — ähli rollar üçin ýeke sahypa
   ───────────────────────────────────────────────────────────
   Öňki ýagdaý (AUDIT F4/F13):
     • `admin/AdminProfilePage.jsx` we `teacher/TeacherProfilePage.jsx`
       iki sany dublikat sahypa bardy
     • Student/dean üçin profil sahypasy **ýokdy**
     • `/profile` route ýokdy — sidebar-daky link 404 berýärdi
   Indi: `/profile` ýeke route, rol boýunça awtomatiki uýgunlaşýar.

   Endpoint-ler:
     GET /profile/me
     PUT /profile/me           ⚠️ B15 sebäpli 500 berip biler
     PUT /profile/me/password  ⚠️ B16/S1 sebäpli paroly düýbünden bozýar
   ═══════════════════════════════════════════════════════════ */

const ROLE_ICON = {
  admin: Shield,
  dean: Briefcase,
  teacher: GraduationCap,
  student: IdCard,
};

const ROLE_TONE = {
  admin: 'error', dean: 'warning', teacher: 'info', student: 'success',
};

/* Parol güýji — 0..4 */
function passwordStrength(value) {
  if (!value) return { score: 0, label: '—', tone: 'neutral' };
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^\w\s]/.test(value)) score += 1;

  const table = [
    { label: 'Very weak', tone: 'error' },
    { label: 'Weak', tone: 'error' },
    { label: 'Fair', tone: 'warning' },
    { label: 'Good', tone: 'info' },
    { label: 'Strong', tone: 'success' },
    { label: 'Excellent', tone: 'success' },
  ];
  return { score: Math.min(score, 5), ...table[Math.min(score, 5)] };
}

const TABS = [
  { value: 'overview', label: 'profile.overview', icon: User },
  { value: 'edit', label: 'common.edit', icon: Save },
  { value: 'security', label: 'profile.security', icon: KeyRound },
  { value: 'preferences', label: 'profile.preferences', icon: Palette },
];

export function ProfilePage() {
  const { t, locale, setLocale } = useI18n();
  const toast = useToast();
  const { user, refreshProfile, hasRole } = useAuth();
  const { theme, setTheme, resolvedTheme, isDark } = useTheme();
  const { collapsed, setCollapsed, isDesktop } = useUi();

  const [tab, setTab] = useState('overview');
  const [form, setForm] = useState({ name: '', email: '', faculty_id: '', department_id: '', section_id: '' });
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const [pwd, setPwd] = useState({ next: '', confirm: '' });
  const [pwdErrors, setPwdErrors] = useState({});
  const [copied, setCopied] = useState(false);

  /* ── Profile ─────────────────────────────────────────────── */
  const { data: profile, loading, error, refetch } = useApi(() => getMyProfile(), {
    select: (r) => r?.data ?? null,
  });

  // `GET /profile/me` None bahalary aýyrýar (services.py:26), şonuň üçin
  // fallback hökmünde AuthContext-däki `user` ulanylýar.
  const merged = useMemo(() => ({
    id: profile?.id ?? user?.id ?? null,
    full_name: profile?.full_name ?? user?.full_name ?? '',
    email: profile?.email ?? user?.email ?? '',
    role: profile?.role ?? user?.role ?? 'student',
    faculty: profile?.faculty ?? user?.faculty ?? null,
    department: profile?.department ?? user?.department ?? null,
    section_number: profile?.section_number ?? user?.section ?? null,
    created_at: profile?.created_at ?? null,
  }), [profile, user]);

  /* ── Lookup listler (redaktirleme üçin) ──────────────────── */
  const canPickStructure = hasRole(['admin', 'dean']);
  const { data: faculties = [] } = useApi(() => getFaculties(), {
    enabled: canPickStructure && tab === 'edit',
    deps: [canPickStructure, tab],
    select: (r) => r?.data ?? [],
  });
  const { data: departments = [] } = useApi(() => getAllDepartments(), {
    enabled: canPickStructure && tab === 'edit',
    deps: [canPickStructure, tab],
    select: (r) => r?.data ?? [],
  });
  const { data: sections = [] } = useApi(() => getSections(), {
    enabled: canPickStructure && tab === 'edit',
    deps: [canPickStructure, tab],
    select: (r) => r?.data ?? [],
  });

  /* Forma maglumatlary ýüklenende doldur */
  useEffect(() => {
    if (!profile && !user) return;
    setForm({
      name: merged.full_name || '',
      email: merged.email || '',
      faculty_id: String(profile?.faculty_id ?? ''),
      department_id: String(profile?.department_id ?? ''),
      section_id: String(profile?.section_id ?? ''),
    });
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, user?.id]);

  /* ── Mutations ───────────────────────────────────────────── */
  const saveProfile = useMutation(
    (payload) => updateMyProfile({ id: Number(merged.id), ...payload }),
    {
      onSuccess: async () => {
        toast.success(t('toast.updated'), t('profile.saved'));
        setDirty(false);
        await refreshProfile();
      },
      onError: (_e, msg) => {
        // B15: backend `faculty_id`/`department_id`/`section_id`-ni jogapda
        // gaýtarmaýar → KeyError → 500. Ulanyja düşnükli habar berýäris.
        toast.error(
          t('toast.error'),
          msg && /key|500|internal/i.test(msg)
            ? 'The server rejected this update (known backend defect B15 — profile updates return 500). Your local session is unchanged.'
            : msg,
        );
      },
    },
  );

  const savePassword = useMutation((next) => updateMyPassword(next), {
    onSuccess: () => {
      toast.success(t('profile.passwordChanged'), 'Use your new password at the next login.');
      setPwd({ next: '', confirm: '' });
      setPwdErrors({});
    },
    onError: (_e, msg) => toast.error(t('toast.error'), msg),
  });

  /* ── Handlers ────────────────────────────────────────────── */
  const setField = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateProfile = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = t('validation.required');
    else if (form.name.trim().length < 3) errs.name = 'Name must be at least 3 characters';

    if (!form.email.trim()) errs.email = t('validation.required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = t('validation.email');

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitProfile = (e) => {
    e.preventDefault();
    if (!validateProfile()) return;

    // Diňe üýtgän meýdanlary iberýäris — backend `UpdateProfile` azyndan
    // bir meýdan talap edýär we `null` iberilen meýdanlary ret edýär.
    const payload = {};
    if (form.name.trim() !== merged.full_name) payload.name = form.name.trim();
    if (form.email.trim() !== merged.email) payload.email = form.email.trim();
    if (canPickStructure) {
      if (form.faculty_id !== '') payload.faculty_id = Number(form.faculty_id);
      if (form.department_id !== '') payload.department_id = Number(form.department_id);
      if (form.section_id !== '') payload.section_id = Number(form.section_id);
    }

    if (Object.keys(payload).length === 0) {
      toast.info('Nothing to save', 'No fields were changed.');
      setDirty(false);
      return;
    }
    saveProfile.run(payload);
  };

  const validatePassword = () => {
    const errs = {};
    if (pwd.next.length < 8) errs.next = t('validation.passwordMin', { min: 8 });
    if (pwd.confirm !== pwd.next) errs.confirm = t('validation.passwordMatch');
    setPwdErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitPassword = (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    savePassword.run(pwd.next);
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(merged.email);
      setCopied(true);
      toast.success('Copied', merged.email);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Could not copy', 'Clipboard access was denied.');
    }
  };

  const strength = passwordStrength(pwd.next);
  const RoleIcon = ROLE_ICON[merged.role] || User;

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="page">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <User size={24} style={{ color: 'var(--text-accent)' }} aria-hidden="true" />
            {t('nav.profile')}
          </h1>
          <p className="page-subtitle">{t('profile.subtitle')}</p>
        </div>
        <div className="page-actions">
          <Button variant="ghost" icon={RefreshCw} onClick={refetch} loading={loading}>{t('common.refresh')}</Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Could not load your profile" onClose={refetch}>
          {error}
        </Alert>
      )}

      {/* ── Identity card ──────────────────────────────────── */}
      <Card>
        <CardBody>
          <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'center', flexWrap: 'wrap' }}>
            {loading ? (
              <Skeleton width={84} height={84} className="avatar avatar--2xl" />
            ) : (
              <Avatar
                name={merged.full_name}
                email={merged.email}
                size="2xl"
                stableKey={merged.id}
              />
            )}

            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <h2 className="truncate" style={{ fontSize: 'var(--font-xl)', letterSpacing: 'var(--tracking-tight)' }}>
                  {loading ? <Skeleton width={180} height={22} /> : merged.full_name || t('profile.unknown')}
                </h2>
                <Badge tone={ROLE_TONE[merged.role] || 'neutral'} soft size="lg">
                  <RoleIcon size={12} aria-hidden="true" /> {t(`profile.${merged.role}`)}
                </Badge>
                <StatusBadge status={user?.verified ? 'active' : 'pending'} label={user?.verified ? t('status.verified') : t('status.unverified')} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                <span className="text-sm text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={14} aria-hidden="true" />
                  <a href={`mailto:${merged.email}`} className="link">{merged.email || '—'}</a>
                </span>
                {merged.id != null && (
                  <span className="text-xs text-faint" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Hash size={13} aria-hidden="true" /> {merged.id}
                  </span>
                )}
                <Tooltip label={copied ? t('common.copied') : t('common.copy')}>
                  <IconButton icon={copied ? CheckCircle2 : Copy} label={t('common.copy')} size="sm" onClick={copyEmail} />
                </Tooltip>
              </div>

              {(merged.faculty || merged.department || merged.section_number != null) && (
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
                  {merged.faculty && (
                    <Badge tone="neutral" icon={Building2}>{merged.faculty}</Badge>
                  )}
                  {merged.department && (
                    <Badge tone="neutral" icon={Layers}>{merged.department}</Badge>
                  )}
                  {merged.section_number != null && (
                    <Badge tone="neutral" icon={Hash}>
                      {t('nav.sections')} {merged.section_number}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <Tabs
        value={tab}
        onChange={setTab}
        items={TABS.map((it) => ({ value: it.value, label: t(it.label), icon: it.icon }))}
        ariaLabel={t('nav.profile')}
      />

      {/* Overview */}
      <TabPanel active={tab === 'overview'}>
        <div className="grid grid-2">
          <Card>
            <CardHeader title={t('profile.personalInfo')} icon={User} />
            <CardBody>
              {loading ? (
                <Skeleton width="100%" height={120} />
              ) : (
                <KVList
                  items={[
                    { label: t('profile.fullName'), value: merged.full_name || '—' },
                    { label: t('profile.email'), value: merged.email || '—' },
                    { label: t('profile.role'), value: t(`profile.${merged.role}`) },
                    { label: t('nav.faculties'), value: merged.faculty || '—' },
                    { label: t('nav.departments'), value: merged.department || '—' },
                    {
                      label: t('nav.sections'),
                      value: merged.section_number != null ? `#${merged.section_number}` : '—',
                    },
                  ]}
                />
              )}
            </CardBody>
            <CardFooter between>
              <span className="text-xs text-faint">
                {merged.created_at ? `${t('common.created')} ${formatDate(merged.created_at)}` : t('profile.sourceProfileApi')}
              </span>
              <Button size="sm" variant="ghost" onClick={() => setTab('edit')} iconRight={Save}>
                {t('common.edit')}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader title={t('profile.accountSecurity')} icon={Shield} />
            <CardBody>
              <KVList
                items={[
                  {
                    label: t('profile.authentication'),
                    value: <Badge tone="success" soft>JWT + {t('nav.otp') || 'OTP'}</Badge>,
                  },
                  { label: t('profile.twoFactor'), value: <StatusBadge status="active" label={t('status.active')} /> },
                  { label: t('profile.sessionStorage'), value: <StatusBadge status="pending" label="localStorage" /> },
                  { label: t('profile.lastLogin'), value: user?.last_login ? formatRelative(user.last_login) : '—' },
                ]}
              />

              <div style={{ marginTop: 'var(--space-4)' }}>
                <Alert variant="warning" title={t('profile.securityNote')}>
                  {t('profile.securityNoteBody')}
                </Alert>
              </div>
            </CardBody>
            <CardFooter>
              <Button size="sm" variant="secondary" icon={KeyRound} onClick={() => setTab('security')}>
                {t('profile.changePassword')}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Role-specific quick links */}
        <Card>
          <CardHeader title={t('dashboard.quickActions')} icon={AlertTriangle} />
          <CardBody>
            <div className="profile-links">
              {merged.role === 'student' && (
                <>
                  <Link className="btn btn-secondary" to="/student/grades"><GraduationCap size={16} /> {t('nav.grades')}</Link>
                  <Link className="btn btn-secondary" to="/student/attendance"><CheckCircle2 size={16} /> {t('nav.attendance')}</Link>
                  <Link className="btn btn-secondary" to="/student/timetable"><Monitor size={16} /> {t('nav.timetable')}</Link>
                </>
              )}
              {merged.role === 'teacher' && (
                <>
                  <Link className="btn btn-secondary" to="/teacher/lessons"><GraduationCap size={16} /> {t('nav.lessons')}</Link>
                  <Link className="btn btn-secondary" to="/teacher/attendance"><CheckCircle2 size={16} /> {t('nav.attendance')}</Link>
                  <Link className="btn btn-secondary" to="/teacher/grades"><Save size={16} /> {t('nav.grades')}</Link>
                </>
              )}
              {(merged.role === 'admin' || merged.role === 'dean') && (
                <>
                  <Link className="btn btn-secondary" to="/admin/users"><User size={16} /> {t('nav.users')}</Link>
                  <Link className="btn btn-secondary" to="/admin/departments"><Layers size={16} /> {t('nav.departments')}</Link>
                  <Link className="btn btn-secondary" to="/admin/sections"><Briefcase size={16} /> {t('nav.sections')}</Link>
                </>
              )}
              <Link className="btn btn-ghost" to="/notifications"><Mail size={16} /> {t('nav.notifications')}</Link>
            </div>
          </CardBody>
        </Card>
      </TabPanel>

      {/* Edit */}
      <TabPanel active={tab === 'edit'}>
        <Card>
          <CardHeader
            title={t('profile.editProfile')}
            subtitle={t('profile.editProfileHint')}
            icon={Save}
            actions={dirty ? <Badge tone="warning" soft>{t('common.unsaved')}</Badge> : null}
          />
          <CardBody>
            <form onSubmit={submitProfile} id="profile-form">
              <div className="grid grid-2">
                <Field label={t('profile.fullName')} required htmlFor="p-name" error={errors.name}>
                  <Input
                    id="p-name"
                    value={form.name}
                    invalid={!!errors.name}
                    autoComplete="name"
                    placeholder={initials(merged.email) ? merged.full_name : 'Full name'}
                    onChange={setField('name')}
                  />
                </Field>

                <Field label={t('profile.email')} required htmlFor="p-email" error={errors.email} hint={t('profile.emailHint')}>
                  <Input
                    id="p-email"
                    type="email"
                    value={form.email}
                    invalid={!!errors.email}
                    autoComplete="email"
                    onChange={setField('email')}
                  />
                </Field>
              </div>

              <Divider label={t('profile.academicPlacement')} />

              {canPickStructure ? (
                <div className="grid grid-3">
                  <Field label={t('nav.faculties')} htmlFor="p-faculty" optional hint={t('profile.structureHint')}>
                    <Select
                      id="p-faculty"
                      placeholder="—"
                      options={(Array.isArray(faculties) ? faculties : []).map((f) => ({ value: f.id, label: f.name }))}
                      value={form.faculty_id}
                      onChange={setField('faculty_id')}
                    />
                  </Field>

                  <Field label={t('nav.departments')} htmlFor="p-dept" optional>
                    <Select
                      id="p-dept"
                      placeholder="—"
                      options={(Array.isArray(departments) ? departments : []).map((d) => ({ value: d.id, label: d.name }))}
                      value={form.department_id}
                      onChange={setField('department_id')}
                    />
                  </Field>

                  <Field label={t('nav.sections')} htmlFor="p-section" optional>
                    <Select
                      id="p-section"
                      placeholder="—"
                      options={(Array.isArray(sections) ? sections : []).map((s) => ({ value: s.id, label: `${t('nav.sections')} ${s.number}` }))}
                      value={form.section_id}
                      onChange={setField('section_id')}
                    />
                  </Field>
                </div>
              ) : (
                <Alert variant="info" title={t('profile.structureReadonly')}>
                  {t('profile.structureReadonlyBody')}
                </Alert>
              )}

              {saveProfile.error && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <Alert variant="error" title={t('toast.error')}>{saveProfile.error}</Alert>
                </div>
              )}
            </form>
          </CardBody>
          <CardFooter between>
            <span className="text-xs text-faint">
              {dirty ? t('common.unsavedChanges') : t('common.allSaved')}
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button
                variant="ghost"
                onClick={() => { setForm((f) => ({ ...f, name: merged.full_name, email: merged.email })); setDirty(false); setErrors({}); }}
                disabled={!dirty || saveProfile.loading}
              >
                {t('common.discard')}
              </Button>
              <Button type="submit" form="profile-form" variant="primary" icon={Save} loading={saveProfile.loading} disabled={!dirty}>
                {t('common.save')}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </TabPanel>

      {/* Security */}
      <TabPanel active={tab === 'security'}>
        <div className="grid grid-2">
          <Card>
            <CardHeader title={t('profile.changePassword')} subtitle={t('profile.passwordHint')} icon={KeyRound} />
            <CardBody>
              <form onSubmit={submitPassword} id="password-form">
                <Field label={t('profile.newPassword')} required htmlFor="p-new" error={pwdErrors.next}>
                  <PasswordInput
                    id="p-new"
                    value={pwd.next}
                    invalid={!!pwdErrors.next}
                    autoComplete="new-password"
                    onChange={(value) => { setPwd((p) => ({ ...p, next: value })); setPwdErrors((e) => ({ ...e, next: undefined })); }}
                  />
                </Field>

                {/* Güýç görkezijisi */}
                <div style={{ display: 'flex', gap: 4, marginTop: 'calc(var(--space-2) * -1)', marginBottom: 'var(--space-4)' }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      style={{
                        flex: 1, height: 4, borderRadius: 999,
                        background: i <= strength.score ? `var(--${strength.tone === 'neutral' ? 'border-strong' : strength.tone})` : 'var(--border-subtle)',
                        transition: 'background var(--transition-base)',
                      }}
                      aria-hidden="true"
                    />
                  ))}
                  <span className="text-2xs text-muted" style={{ minWidth: 68, textAlign: 'right' }}>{strength.label}</span>
                </div>

                <Field label={t('profile.confirmPassword')} required htmlFor="p-confirm" error={pwdErrors.confirm}>
                  <PasswordInput
                    id="p-confirm"
                    value={pwd.confirm}
                    invalid={!!pwdErrors.confirm}
                    autoComplete="new-password"
                    onChange={(value) => { setPwd((p) => ({ ...p, confirm: value })); setPwdErrors((e) => ({ ...e, confirm: undefined })); }}
                  />
                </Field>

                {savePassword.error && (
                  <Alert variant="error" title={t('toast.error')}>{savePassword.error}</Alert>
                )}

                <Alert variant="warning" title={t('profile.passwordWarning')}>
                  {t('profile.passwordWarningBody')}
                </Alert>
              </form>
            </CardBody>
            <CardFooter>
              <Button
                type="submit"
                form="password-form"
                variant="primary"
                icon={KeyRound}
                loading={savePassword.loading}
                disabled={!pwd.next || !pwd.confirm}
              >
                {t('profile.updatePassword')}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader title={t('profile.sessions')} icon={Shield} />
            <CardBody>
              <KVList
                items={[
                  { label: t('profile.accessToken'), value: <Badge tone="info" soft>JWT · localStorage</Badge> },
                  { label: t('profile.refreshToken'), value: <Badge tone="info" soft>JWT · localStorage</Badge> },
                  { label: t('profile.otpChannel'), value: merged.email || '—' },
                  { label: t('profile.device'), value: navigator.userAgent.includes('Mobile') ? 'Mobile browser' : 'Desktop browser' },
                ]}
              />
              <div style={{ marginTop: 'var(--space-4)' }}>
                <Alert variant="info" title={t('profile.sessionsHint')}>
                  {t('profile.sessionsHintBody')}
                </Alert>
              </div>
            </CardBody>
          </Card>
        </div>
      </TabPanel>

      {/* Preferences */}
      <TabPanel active={tab === 'preferences'}>
        <div className="grid grid-2">
          <Card>
            <CardHeader title={t('profile.appearance')} icon={isDark ? Moon : Sun} />
            <CardBody>
              <Field label={t('profile.theme')} hint={t('profile.themeHint')}>
                <SegmentedControl
                  ariaLabel={t('profile.theme')}
                  value={theme}
                  onChange={setTheme}
                  options={[
                    { value: 'light', label: t('theme.light'), icon: Sun },
                    { value: 'dark', label: t('theme.dark'), icon: Moon },
                    { value: 'system', label: t('theme.system'), icon: Monitor },
                  ]}
                />
              </Field>

              <div className="theme-preview" aria-hidden="true">
                <span className={`theme-preview__swatch ${resolvedTheme === 'light' ? 'is-light' : 'is-dark'}`} />
                <span className="text-xs text-muted">
                  {t('theme.activeIs', { theme: t(`theme.${resolvedTheme}`) })}
                </span>
              </div>

              <Divider />

              <Switch
                label={t('profile.collapseSidebar')}
                checked={collapsed}
                disabled={!isDesktop}
                onChange={(v) => setCollapsed(v)}
              />
              {!isDesktop && (
                <p className="text-2xs text-faint" style={{ marginTop: 6 }}>{t('profile.desktopOnly')}</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('profile.languageRegion')} icon={Languages} />
            <CardBody>
              <Field label={t('profile.language')} hint={t('profile.languageHint')}>
                <SegmentedControl
                  ariaLabel={t('profile.language')}
                  value={locale}
                  onChange={setLocale}
                  options={SUPPORTED_LOCALES.map((l) => ({ value: l.code, label: l.short }))}
                />
              </Field>

              <KVList
                items={[
                  { label: t('profile.language'), value: SUPPORTED_LOCALES.find((l) => l.code === locale)?.label || '—' },
                  { label: t('profile.dateFormat'), value: new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date()) },
                  { label: t('profile.timeFormat'), value: new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(new Date()) },
                  { label: t('profile.timezone'), value: Intl.DateTimeFormat().resolvedOptions().timeZone || '—' },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      </TabPanel>

      <style>{`
        .profile-links { display: flex; gap: var(--space-2); flex-wrap: wrap; }
        .profile-links .btn { text-decoration: none; }
        .theme-preview {
          display: flex; align-items: center; gap: var(--space-3);
          margin-top: var(--space-4);
        }
        .theme-preview__swatch {
          width: 34px; height: 34px; border-radius: var(--radius-md);
          border: 1px solid var(--border-default); flex: none;
        }
        .theme-preview__swatch.is-light { background: linear-gradient(135deg, #ffffff 50%, #f1f5f9 50%); }
        .theme-preview__swatch.is-dark  { background: linear-gradient(135deg, #0b0f19 50%, #1b2436 50%); }
      `}</style>
    </div>
  );
}

export default ProfilePage;
