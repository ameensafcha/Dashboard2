import { getSystemSettings } from '@/app/actions/production';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getSystemSettings();

  return <SettingsClient initialCapacityKg={settings.productionCapacityKg} />;
}
