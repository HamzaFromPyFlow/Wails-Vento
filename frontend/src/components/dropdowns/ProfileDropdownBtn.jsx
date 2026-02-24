import { Menu } from '@mantine/core';
import { BsRecordCircle } from 'react-icons/bs';
import { IoExitOutline, IoSettingsOutline, IoDiamondOutline } from 'react-icons/io5';
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
  const { ventoUser, signOut } = useAuth();
  const navigate = useNavigate();
  const initial = getInitial(ventoUser?.displayName || ventoUser?.name, ventoUser?.email);

  return (
    <Menu trigger="hover" shadow="md" radius="md">
      <Menu.Target>
        <button className={styles.profileBtn}>
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
        </button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{ventoUser?.displayName || ventoUser?.name || ventoUser?.email || 'User'}</Menu.Label>
        <Menu.Item
          icon={<BsRecordCircle size={14} />}
          onClick={() => navigate('/recordings')}
        >
          View Recordings
        </Menu.Item>
        <Menu.Item
          icon={<IoSettingsOutline size={14} />}
          onClick={() => navigate('/profile')}
        >
          Account and settings
        </Menu.Item>
        <Menu.Item
          icon={<IoDiamondOutline size={14} />}
          style={isUserFreePlan(ventoUser) ? { backgroundColor: 'rgba(254, 237, 120, 0.2)' } : {}}
          onClick={() => navigate('/pricing')}
        >
          Plans and Pricing
        </Menu.Item>
        <Menu.Item icon={<IoExitOutline size={14} />} onClick={signOut} color="red">
          Log Out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
