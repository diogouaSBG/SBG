import { useEffect, useState } from 'react';
import * as microsoftTeams from '@microsoft/teams-js';

export const useTeams = () => {
  const [teamsContext, setTeamsContext] = useState(null);
  const [isTeams, setIsTeams] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const initTeams = async () => {
      try {
        await microsoftTeams.app.initialize();
        setIsTeams(true);

        const context = await microsoftTeams.app.getContext();
        setTeamsContext(context);

        // Sync theme with Teams
        const teamsTheme = context.app?.theme || 'dark';
        setTheme(teamsTheme);

        microsoftTeams.app.registerOnThemeChangeHandler((newTheme) => {
          setTheme(newTheme);
        });

        microsoftTeams.app.notifyAppLoaded();
        microsoftTeams.app.notifySuccess();
      } catch {
        // Running outside Teams (local dev) — fine
        setIsTeams(false);
      }
    };
    initTeams();
  }, []);

  return { teamsContext, isTeams, theme };
};
