import { useEffect, useState } from 'react';
import { useAuth } from '../../stores/authStore';
import webAPI from '../../lib/webapi';
import ShowMessageModal from '../../components/overlays/modals/ShowMessageModal';
import styles from '../../styles/modules/Auth.module.scss';

export default function AuthVerifyPage() {
  const { ventoUser } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const fetchCount = async () => {
      if (!ventoUser?.id) return;
      try {
        const res = await webAPI.user.userGetVerificationResendCount(ventoUser.id);
        if (typeof res?.count === 'number') setResendCount(res.count);
      } catch (e) {}
    };
    fetchCount();
  }, [ventoUser?.id]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (!ventoUser?.email || isResending || resendCount >= 3 || countdown > 0) return;
    try {
      setIsResending(true);
      await webAPI.user.userSendVerificationEmail({ email: ventoUser.email, isEmailChanged: !!ventoUser.isEmailChanged });
      setModalMessage(`A new activation email has been sent to: ${ventoUser.email}`);
      setModalOpen(true);
      setCountdown(60);
      if (ventoUser?.id) {
        const res = await webAPI.user.userUpdateVerificationResendCount(ventoUser.id, { increment: true });
        setResendCount(typeof res?.count === 'number' ? res.count : resendCount + 1);
      } else setResendCount((c) => c + 1);
    } catch (e) {
      setModalMessage('Unable to send the email. Please contact support!');
      setModalOpen(true);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.contentWrapper}>
        <div className={styles.logo}>
          <img className={styles.image} src="/assets/vento-logo.png" alt="vento logo" width={147} />
        </div>
        <h1>{ventoUser?.isEmailChanged ? 'Check your email to verify your new account' : 'Check your email to activate your account'}</h1>
        <p>We've sent an email with an activation link to <b>{ventoUser?.email}</b>.</p>
        <div className={styles.accounts}>
          <div className={styles.gmail} onClick={() => window.open('https://mail.google.com/mail')}>
            <img src="/assets/gmail-icon.png" alt="gmail" /><span>Open Gmail</span>
          </div>
          <div className={styles.outlook} onClick={() => window.open('https://outlook.live.com/mail')}>
            <img src="/assets/outlook-icon.png" alt="outlook" /><span>Open Outlook</span>
          </div>
        </div>
        <p className={styles.tip}>
          {resendCount >= 3 ? <>Check your spam folder or contact support.</> : countdown > 0 ? <>Resend in {countdown} seconds</> : (
            <>Can't find the email? <a href="#" onClick={(e) => { e.preventDefault(); handleResend(); }} style={{ pointerEvents: isResending ? 'none' : 'auto' }}>{isResending ? 'resending...' : 'resend'}</a></>
          )}
        </p>
      </div>
      <ShowMessageModal opened={modalOpen} message={modalMessage} onClose={() => setModalOpen(false)} />
    </main>
  );
}
