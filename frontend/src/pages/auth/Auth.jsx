import React, { useState, useEffect, useReducer } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Box, Loader, PasswordInput, Popover, Progress, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { FaCheck, FaTimes } from 'react-icons/fa';
import Header from '../../components/Header';
import InvitedUserEmailMismatch from '../../components/invite-users/InvitedUserEmailMismatch';
import InviteUsersGenralModel from '../../components/overlays/modals/InviteUsersGeneralModal';
import { useAuth } from '../../stores/authStore';
import { getStrength, generateUrl } from '../../lib/helper-pure';
import { logClientEvent } from '../../lib/misc';
import webAPI from '../../lib/webapi';
import styles from '../../styles/modules/Auth.module.scss';

const requirements = [
  { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: 'Includes special symbol' },
];

function PasswordRequirement({ meets, label }) {
  return (
    <Text c={meets ? 'indigo' : 'red'} style={{ display: 'flex', alignItems: 'center' }} mt={7} size="sm">
      {meets ? <FaCheck style={{ width: '14px', height: '14px' }} fill="#818cf8" /> : <FaTimes style={{ width: '14px', height: '14px' }} fill="#f87171" />}{' '}
      <Box ml={10} style={{ color: meets ? "#818cf8" : "#f87171" }}>{label}</Box>
    </Text>
  );
}

export default function AuthPage({ login = false }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popoverOpened, setPopoverOpened] = useState(false);
  const [isReCaptcha, setIsReCaptcha] = useState(false);
  const [redirectedFromAnymsRec, setRedirectedFromAnymsRec] = useState(false);
  const [teamAdmin, setTeamAdmin] = useState(null);
  const [isTokenChecked, setIsTokenChecked] = useState(false);
  const [formTitleContent, setFormTitleContent] = useState("Welcome to Vento");
  const [inviteToken, setInviteToken] = useState("");
  const [isInvitationLoading, setIsInvitationLoading] = useState(false);
  const [invitationEmail, setInvitationEmail] = useState("");
  const isLogin = !!login;

  const [modalStates, setModalStates] = useReducer((prev, cur) => ({ ...prev, ...cur }), { isInvitedEmailMismatch: false });

  useEffect(() => {
    logClientEvent("page.view.login");
    const query = new URLSearchParams(window.location.search);
    if (query.get("anyms_video")) setRedirectedFromAnymsRec(true);
  }, []);

  useEffect(() => {
    if (searchParams.get('email_changed')) setFormTitleContent("Login with your new email!");
    const token = searchParams.get('invite-token');
    if (token) {
      const fetchAdmin = async () => {
        try {
          const admin = await webAPI.team.teamGetAdminByInvitationId(token);
          setTeamAdmin(admin);
          setInviteToken(token);
        } catch (e) { console.error('Failed to fetch team admin:', e); }
        setIsTokenChecked(true);
      };
      const fetchInvitation = async () => {
        setIsInvitationLoading(true);
        try {
          const invitation = await webAPI.team.teamGetInvitationById(token);
          setInvitationEmail(invitation.email);
        } catch (err) {
          navigate('/auth/invitation-expired');
        } finally {
          setIsInvitationLoading(false);
        }
      };
      fetchAdmin();
      fetchInvitation();
    }
  }, [searchParams, navigate]);

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (!v ? 'Please enter email' : !v.includes('@') ? 'An email must contain @' : !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v) ? 'Invalid email' : null),
      password: (v) => (!v ? 'Please enter password' : !isLogin && getStrength(v) !== 100 ? 'Password Strength is Low' : null),
    },
  });

  const handleSubmit = async (values) => {
    if (invitationEmail && values.email?.toLowerCase() !== invitationEmail.toLowerCase()) {
      setModalStates({ isInvitedEmailMismatch: true });
      return;
    }
    setIsSubmitting(true);
    setIsReCaptcha(true);
    const verified = true;
    if (verified) {
      setIsReCaptcha(false);
      const auth = getAuth();
      if (isLogin) {
        signInWithEmailAndPassword(auth, values.email, values.password)
          .then(async (userCredential) => {
            const user = userCredential.user;
            if (!user.emailVerified) {
              try {
                const ventoUser = await webAPI.user.userGet(user.uid);
                if (ventoUser?.isEmailChanged) webAPI.user.userSendVerificationEmail({ email: ventoUser.email, isEmailChanged: true });
              } catch (err) {}
              setIsSubmitting(false);
              return;
            }
            let redirectTo = searchParams.get('redirect_to') || '/recordings';
            if (!redirectTo || redirectTo === '/' || redirectTo.startsWith('/auth')) {
              redirectTo = '/recordings';
            }
            navigate(redirectTo);
            setIsSubmitting(false);
          })
          .catch(() => {
            form.setErrors({ password: "Please enter valid credentials" });
            setIsSubmitting(false);
          });
      } else {
        fetchSignInMethodsForEmail(auth, values.email)
          .then((signInMethods) => {
            if (signInMethods.length) {
              form.setErrors({ email: 'A user with this email already exists' });
              setIsSubmitting(false);
            } else {
              createUserWithEmailAndPassword(auth, values.email, values.password)
                .then(() => {
                  if (auth.currentUser?.email) {
                    webAPI.user.userSendVerificationEmail({ email: auth.currentUser.email, isEmailChanged: false, ...(inviteToken && { token: inviteToken }) })
                      .finally(() => {
                        navigate(`/auth/verify?email=${auth.currentUser?.email}`);
                        setIsSubmitting(false);
                      });
                  } else setIsSubmitting(false);
                })
                .catch(() => setIsSubmitting(false));
            }
          })
          .catch(() => setIsSubmitting(false));
      }
    } else {
      setIsSubmitting(false);
      form.setErrors({ password: `We ran into an issue. Please contact support: FB0${isLogin ? "1" : "3"}` });
    }
  };

  const strength = getStrength(form.values.password);
  const color = strength === 100 ? 'indigo' : 'red';
  useEffect(() => {
    if (strength === 100) setPopoverOpened(false);
    else if (form.values.password) setPopoverOpened(true);
  }, [strength, form.values.password]);

  const handleProviderSignIn = async (provider) => {
    logClientEvent("click.signIn", { provider });
    if (invitationEmail) {
      const result = await signIn(provider, invitationEmail);
      if (!result) setModalStates({ isInvitedEmailMismatch: true });
    } else signIn(provider);
  };

  if (searchParams.get('invite-token') && isInvitationLoading) {
    return (
      <main className={styles.main}>
        <Header hideNewRecordingButton hideSignInButton />
        <div className={styles.contentWrapper}><Loader size={40} /></div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <Header hideNewRecordingButton hideSignInButton />
      <div className={styles.contentWrapper}>
        {!isTokenChecked && searchParams.get('invite-token') ? null : teamAdmin ? (
          <div className={styles.teamContainer}>
            <img className={styles.teamImg} src={teamAdmin.user?.profilePhotoUrl ?? ""} alt="team admin" referrerPolicy="no-referrer" crossOrigin="anonymous" />
            <p className={styles.teamTitle}>{`Sign up below to join ${teamAdmin.team?.name}'s team!`}</p>
          </div>
        ) : (
          <>
            <h1 className={redirectedFromAnymsRec ? styles.titleSaveVideo : styles.title}>
              {redirectedFromAnymsRec ? "Thanks for trying Vento! Signup to save your recording!" : formTitleContent}
            </h1>
            <p className={styles.sub}>
              {isLogin ? <>Need a Vento account? <span onClick={() => navigate('/auth/signup')}>Signup</span></> : <>Create a free account or <span onClick={() => navigate('/auth/login')}>login</span></>}
            </p>
          </>
        )}
        {/* <div className={styles.btnContainer}>
          <button onClick={() => handleProviderSignIn("google")} className={styles.signInBtn} disabled={isInvitationLoading}>
            Sign in with Google
            <img src="/assets/google-icon.png" alt="google" onError={(e) => e.target.style.display = 'none'} />
          </button>
          <button onClick={() => handleProviderSignIn("microsoft")} className={styles.signInBtn} disabled={isInvitationLoading}>
            Sign in with Microsoft
            <img src="/assets/microsoft-icon.png" alt="microsoft" onError={(e) => e.target.style.display = 'none'} />
          </button>
        </div> */}
        <div className={styles.separator}>
          {/* <h2>or</h2> */}
          <div className={styles.line} />
        </div>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput withAsterisk size="lg" placeholder="email" styles={{ error: { marginBottom: '0.75rem' } }} {...form.getInputProps('email')} />
          <Popover opened={popoverOpened && !isLogin} position="bottom" width="target" transition="pop">
            <Popover.Target>
              <div onFocusCapture={() => setPopoverOpened(true)} onBlurCapture={() => setPopoverOpened(false)} style={{ width: '100%' }}>
                <PasswordInput placeholder="password" size="lg" {...form.getInputProps('password')} />
              </div>
            </Popover.Target>
            <Popover.Dropdown>
              <Progress color={color} value={strength} size={5} mb="xs" />
              <PasswordRequirement label="Includes at least 8 characters" meets={form.values.password.length > 7} />
              {requirements.map((r, i) => <PasswordRequirement key={i} label={r.label} meets={r.re.test(form.values.password)} />)}
            </Popover.Dropdown>
          </Popover>
          <button type="submit" disabled={isSubmitting || isReCaptcha || isInvitationLoading} className={styles.submitButton}>
            {isSubmitting ? <Loader size={30} /> : isLogin ? 'Login' : 'Sign up'}
          </button>
          {isLogin ? (
            <p className={styles.sub}>Forgot your password? <span><Link to="/auth/reset-password">Reset</Link></span></p>
          ) : (
            <p className={styles.sub}>By signing up, you agree to our <Link to="/policy?content=terms-of-service" target="_blank">Terms</Link> and <Link to="/policy?content=privacy-policy" target="_blank">Privacy Policy</Link></p>
          )}
        </form>
      </div>
      <InviteUsersGenralModel opened={modalStates.isInvitedEmailMismatch} onClose={() => setModalStates({ isInvitedEmailMismatch: false })}>
        <InvitedUserEmailMismatch onClose={() => setModalStates({ isInvitedEmailMismatch: false })} />
      </InviteUsersGenralModel>
    </main>
  );
}
