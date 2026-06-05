import { SettingsTabs } from "./settings-tabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Settings</p>
        <h1 className="text-3xl font-semibold">Account & Organization</h1>
      </div>
      <SettingsTabs />
      <div>{children}</div>
    </div>
  );
}
