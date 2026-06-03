import { useMemo } from 'react';

export default function useAssistantPlacement() {
  return useMemo(() => ({
    side: 'right',
    launcherClassName: 'right-4 sm:right-6',
    panelClassName: 'right-4 sm:right-6',
    promptClassName: 'assistant-prompt-strip-end',
    style: {
      left: 'auto',
      '--assistant-transform-origin': 'calc(100% - 2rem) 100%',
    },
  }), []);
}
