import { getSystemSettings } from '@/app/actions/production';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const settings = await getSystemSettings();

  return <SettingsClient initialCapacityKg={settings.productionCapacityKg} />;
}
