import { useState } from 'react';
import { useLocation, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HiOutlineMenu } from 'react-icons/hi';
import { Menu } from '@mantine/core';
import { BsRecordCircle } from 'react-icons/bs';
import { IoSettingsOutline, IoDiamondOutline } from 'react-icons/io5';
import { isBrowser, isSupportedBrowser } from '../../lib/helper-pure';
import { generateUrl } from '../../lib/helper-pure';
import { useRedirectAuthUrl, useSignUpRedirectAuthUrl } from '../../lib/hooks';
import { logClientEvent } from '../../lib/misc';
import { useAuth } from '../../stores/authStore';
import ProfileDropdownBtn from '../dropdowns/ProfileDropdownBtn';
// import RecordingsSearchBar from '../recordings-page/RecordingsSearchBar';
import NotificationModal from '../overlays/modals/NotificationModal';
import styles from '../../styles/modules/Header.module.scss';

type HeaderProps = {
  hideSignInButton?: boolean;
  hideNewRecordingButton?: boolean;
  showPricing?: boolean;
  leftSlot?: React.ReactNode;
};

export default function Header({
  hideSignInButton,
  hideNewRecordingButton,
  showPricing,
  leftSlot,
}: HeaderProps) {
  const { ventoUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = useRedirectAuthUrl();
  const signUpRedirectUrl = useSignUpRedirectAuthUrl();
  const homeUrl = ventoUser ? '/recordings' : '/';
  const canRecord = !isBrowser() || isSupportedBrowser();
  const pathname = location.pathname;
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <nav className={styles.header}>
        <div className={styles.leftContainer}>
          <div
            className={styles.image}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(to bottom right, #67e997, #4ade80)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: '#020617',
              flexShrink: 0,
            }}
          >
            V
          </div>
          <Link to={generateUrl(homeUrl, searchParams, false)} className={styles.logo}>
            ento
          </Link>
          {leftSlot}
          {showPricing && !ventoUser && pathname !== '/pricing' && (
            <Link
              to={generateUrl('/pricing', searchParams, false)}
              className={styles.pricing}
            >
              Pricing
            </Link>
          )}
        </div>
        {/* Search bar - commented out for now. Uncomment import + block to restore.
        {pathname === '/recordings' && (
          <div className={styles.midContainer}>
            <RecordingsSearchBar />
          </div>
        )}
        */}
        <div className={styles.rightContainer}>
          {!hideNewRecordingButton && (
            <button
              className={styles.newRecording}
              onClick={() => {
                if (!canRecord) {
                  return setIsModalOpen(true);
                }
                navigate(generateUrl('/record/new', searchParams, false));
              }}
            >
              Start Recording
            </button>
          )}

          {!hideSignInButton && (
            <>
              {!ventoUser ? (
                <div className={styles.authBtn}>
                  <Link
                    to={generateUrl(redirectUrl, searchParams, false)}
                    className={styles.logIn}
                    onClick={() => logClientEvent('click.header.login')}
                  >
                    Login
                  </Link>
                  <Link
                    to={generateUrl(signUpRedirectUrl, searchParams, false)}
                    className={styles.signUp}
                    onClick={() => logClientEvent('click.header.signup')}
                  >
                    Sign up
                  </Link>
                </div>
              ) : (
                <>
                  <Menu shadow="md" radius="md">
                    <Menu.Target>
                      <button className={styles.hamburgerBtn} aria-label="Menu">
                        <HiOutlineMenu size={22} />
                      </button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<BsRecordCircle size={14} />}
                        onClick={() => navigate('/recordings')}
                      >
                        Recordings
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IoSettingsOutline size={14} />}
                        onClick={() => navigate('/profile')}
                      >
                        Account and settings
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IoDiamondOutline size={14} />}
                        onClick={() => navigate('/pricing')}
                      >
                        Plans and Pricing
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                  <ProfileDropdownBtn />
                </>
              )}
            </>
          )}
        </div>
        <NotificationModal
          opened={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          modalTitle="Browser not supported"
          modalBody="Vento works best with Chrome, Edge and Brave browsers. Please switch to one of those browsers to begin recording using Vento."
        />
      </nav>
    </>
  );
}
