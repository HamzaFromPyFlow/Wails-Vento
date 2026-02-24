import { useState, useRef, useEffect } from 'react';
import { BsRecordCircle } from 'react-icons/bs';
import { HiOutlineMenu } from 'react-icons/hi';
import { IoExitOutline, IoSettingsOutline, IoDiamondOutline } from 'react-icons/io5';
import { MdAttachMoney } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../stores/authStore';
import { isUserFreePlan } from '../../lib/payment-helper';
import styles from '../../styles/modules/ProfileDropdown.module.scss';

function getInitial(name, email) {
  if (name && name.trim()) return name.trim().charAt(0).toUpperCase();
  if (email && email.trim()) return email.trim().charAt(0).toUpperCase();
  return '?';
}

export default function ProfileDropdownBtn() {
  const [opened, setOpened] = useState(false);
  const containerRef = useRef(null);
  const { ventoUser, signOut } = useAuth();
  const navigate = useNavigate();
  const initial = getInitial(ventoUser?.displayName || ventoUser?.name, ventoUser?.email);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpened(false);
      }
    };
    if (opened) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [opened]);

  const handleItemClick = async (fn) => {
    setOpened(false);
    await fn();
  };

  return (
    <div ref={containerRef} className={styles.dropdownWrapper}>
      <button
        className={styles.profileBtn}
        type="button"
        onClick={() => setOpened((o) => !o)}
      >
        <HiOutlineMenu size={22} className={styles.hamburgerIcon} />
        <span className={styles.avatarCircle}>
          {ventoUser?.profilePhotoUrl ? (
            <img
              alt="user profile"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              src={ventoUser.profilePhotoUrl}
              className={styles.profileImg}
              width={38}
              height={38}
            />
          ) : (
            <span className={styles.avatarInitial}>{initial}</span>
          )}
        </span>
      </button>

      {opened && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownLabel}>
            {ventoUser?.displayName || ventoUser?.name || ventoUser?.email || 'User'}
          </div>
          {/* <button
            type="button"
            className={styles.dropdownItem}
            onClick={() => handleItemClick(() => navigate('/recordings'))}
          >
            <BsRecordCircle size={14} />
            <span>View Recordings</span>
          </button>
          <button
            type="button"
            className={styles.dropdownItem}
            onClick={() => handleItemClick(() => navigate('/profile'))}
          >
            <IoSettingsOutline size={14} />
            <span>Account and settings</span>
          </button>
          <button
            type="button"
            className={styles.dropdownItem}
            onClick={() => handleItemClick(() => window.open('https://billing.stripe.com', '_blank'))}
          >
            <MdAttachMoney size={14} />
            <span>Billing</span>
          </button>
          <button
            type="button"
            className={styles.dropdownItem}
            onClick={() => handleItemClick(() => navigate('/pricing'))}
            style={isUserFreePlan(ventoUser) ? { backgroundColor: 'rgba(254, 237, 120, 0.2)' } : {}}
          >
            <IoDiamondOutline size={14} />
            <span>Plans and Pricing</span>
          </button> */}
          <button
            type="button"
            className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
            onClick={() => handleItemClick(async () => {
              await signOut();
              navigate('/');
            })}
          >
            <IoExitOutline size={14} />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
