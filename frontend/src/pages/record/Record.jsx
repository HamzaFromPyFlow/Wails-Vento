import React from 'react';
import Header from '../../components/Header/Header';
import RecordInitMenu from '../../components/record/RecordInitMenu';

function RecordPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header hideNewRecordingButton />
      <RecordInitMenu />
    </main>
  );
}

export default RecordPage;

