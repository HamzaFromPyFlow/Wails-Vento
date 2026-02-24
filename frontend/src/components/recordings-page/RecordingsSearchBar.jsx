import { useState } from 'react';
import { TextInput } from '@mantine/core';
import { IoSearchSharp } from 'react-icons/io5';
import styles from '../../styles/modules/Header.module.scss';

export default function RecordingsSearchBar() {
  const [searchValue, setSearchValue] = useState('');

  return (
    <div className={styles.searchContainer}>
      <TextInput
        icon={<IoSearchSharp size={20} />}
        w="100%"
        size="md"
        placeholder="Search for folders, videos, workspaces, and people"
        value={searchValue}
        onChange={(e) => setSearchValue(e.currentTarget.value)}
        styles={{
          input: {
            borderRadius: '8px',
          },
        }}
      />
    </div>
  );
}
