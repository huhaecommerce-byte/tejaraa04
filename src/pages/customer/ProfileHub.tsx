import { useSearchParams } from "@/lib/router-compat";
import { User, MapPin, Users, Bell } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import Profile from './Profile';
import AddressBook from './AddressBook';
import TeamMembers from './TeamMembers';
import NotificationPrefsCard from '@/components/NotificationPrefsCard';

const TABS = ['personal', 'addresses', 'team', 'notifications'] as const;
type Tab = typeof TABS[number];

const TabBody = ({ icon: Icon, label, sub }: { icon: any; label: string; sub: string }) => (
  <>
    <Icon />
    <div className="flex flex-col leading-tight">
      <span>{label}</span>
      <span className="hidden sm:block text-xs font-normal opacity-70">{sub}</span>
    </div>
  </>
);

const ProfileHub = () => {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const tab: Tab = (TABS as readonly string[]).includes(raw || '') ? (raw as Tab) : 'personal';

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        const next = new URLSearchParams(params);
        if (v === 'personal') next.delete('tab');
        else next.set('tab', v);
        setParams(next, { replace: true });
      }}
      className="w-full"
    >
      <TabsList className="mb-4 flex w-full flex-wrap sm:[&>button]:flex-1">
        <TabsTrigger value="personal"><TabBody icon={User} label="Personal" sub="Name, email, password" /></TabsTrigger>
        <TabsTrigger value="addresses"><TabBody icon={MapPin} label="Addresses" sub="Shipping & billing" /></TabsTrigger>
        <TabsTrigger value="team"><TabBody icon={Users} label="Team" sub="Sub-users & roles" /></TabsTrigger>
        <TabsTrigger value="notifications"><TabBody icon={Bell} label="Notifications" sub="Email & in-app prefs" /></TabsTrigger>
      </TabsList>
      <TabsContent value="personal" className="mt-0"><Profile /></TabsContent>
      <TabsContent value="addresses" className="mt-0"><AddressBook /></TabsContent>
      <TabsContent value="team" className="mt-0"><TeamMembers /></TabsContent>
      <TabsContent value="notifications" className="mt-0">
        <div className="space-y-6">
          <PageHeader
            title="Notification preferences"
            highlight="preferences"
            subtitle="Choose what you want to be notified about"
            guide={{
              chip: 'Stay in the loop',
              intro: 'Control how and when we reach out to you.',
              steps: [
                { title: 'Pick channels', description: 'Toggle email and in-app notifications independently.' },
                { title: 'Per-type control', description: 'Enable alerts for orders, quotes, sourcing, and tickets.' },
                { title: 'Stay informed', description: 'Updates apply instantly across all your devices.' },
              ],
            }}
          />
          <NotificationPrefsCard />
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ProfileHub;
