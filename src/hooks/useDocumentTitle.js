import { useEffect } from 'react';
import { useMatches } from 'react-router-dom';

const DEFAULT_TITLE = 'AlphaBitCore';

export default function useDocumentTitle() {
  const matches = useMatches();

  useEffect(() => {
    const title = matches
      .filter((match) => match.handle?.title)
      .pop()
      ?.handle?.title;

    document.title = title ? `${title} - ${DEFAULT_TITLE}` : DEFAULT_TITLE;
  }, [matches]);
}
