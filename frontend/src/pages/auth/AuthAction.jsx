import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader } from '@mantine/core';
import { generateUrl } from '../../lib/helper-pure';
import { isUserFreePlan } from '../../lib/payment-helper';
import webAPI from '../../lib/webapi';
import { getAuth, applyActionCode } from 'firebase/auth';
import { useAuth } from '../../stores/authStore';
import styles from '../../styles/modules/Auth.module.scss';

export default function AuthActionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { ventoUser, loadingUser } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  const inviteToken = searchParams.get('invite-token');

  const acceptInvitation = async () => {
    if (inviteToken && ventoUser?.id) {
      try {
        await webAPI.team.teamAcceptInvitation(inviteToken);
        localStorage.setItem(`${ventoUser.id}-invite`, "true");
      } catch (e) {}
    }
  };

  useEffect(() => {
    if (mode === 'verifyEmail' && oobCode) {
      const auth = getAuth();
      applyActionCode(auth, oobCode)
        .then(async () => { await auth.currentUser?.reload(); setIsVerified(true); setIsLoading(false); })
        .catch(() => { setIsLoading(false); setIsVerified(false); });
    } else if (mode === 'resetPassword' && oobCode) {
      navigate(`/auth/reset-password?mode=resetPassword&oobCode=${oobCode}`);
    } else setIsLoading(false);
  }, [mode, oobCode, navigate]);

  useEffect(() => {
    if (isVerified && loadingUser === 'hasUser') acceptInvitation();
  }, [isVerified, loadingUser, inviteToken, ventoUser?.id]);

  const nextPath = (!isUserFreePlan(ventoUser) || ventoUser?.isEmailChanged) ? "/recordings" : "/pricing?onBoarding=true";
  return (
    <main className={styles.main}>
      <div className={styles.contentWrapper}>
        {isLoading ? <Loader size={40} /> : (
          <>
            <div className={styles.logo}>
              <img className={styles.image} src="/assets/vento-logo.png" alt="vento logo" width={147} />
            </div>
            <h1 dangerouslySetInnerHTML={{ __html: isVerified ? 'Your account has been verified!' : 'This activation link has expired.<br />Please check your inbox for a new link or contact support.' }} />
            {isVerified && (
              <a href={generateUrl(nextPath)} className={styles.recordNow} onClick={(e) => { e.preventDefault(); navigate(nextPath); }}>Get Started</a>
            )}
          </>
        )}
      </div>
    </main>
  );
}
