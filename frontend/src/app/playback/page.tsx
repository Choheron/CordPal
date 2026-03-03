import { redirect } from 'next/navigation';

// This page should automatically redirect to the dashboard page as there is no year provided
export default async function Playback({ params }) {
  redirect('/dashboard');
}