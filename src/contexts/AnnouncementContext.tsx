import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnnouncementContextValue {
  visible: boolean;
  text: string;
  dismiss: () => void;
}

const AnnouncementContext = createContext<AnnouncementContextValue>({
  visible: false,
  text: '',
  dismiss: () => {},
});

export const AnnouncementProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    supabase.from('platform_settings').select('key, value').then(({ data }) => {
      if (!data) return;
      let enabled = true;
      let txt = '🚀 New: Dropshipping is now live! Start selling with zero inventory.';
      data.forEach((s: any) => {
        if (s.key === 'announcement_enabled') enabled = s.value === 'true';
        if (s.key === 'announcement_text' && s.value) txt = s.value;
      });
      setText(txt);
      setVisible(enabled && !!txt);
    });
  }, []);

  return (
    <AnnouncementContext.Provider value={{ visible, text, dismiss: () => setVisible(false) }}>
      {children}
    </AnnouncementContext.Provider>
  );
};

export const useAnnouncement = () => useContext(AnnouncementContext);
